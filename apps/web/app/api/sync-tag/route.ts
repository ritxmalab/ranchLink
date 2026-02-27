import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { createPublicClient, http } from 'viem'
import { base } from '@/lib/blockchain/config'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

// Schema de validación
const syncTagSchema = z.object({
  tagCode: z.string().min(1).max(20),
})

/**
 * POST /api/sync-tag
 * Sync a tag's on-chain status by checking the blockchain directly
 * This fixes cases where the transaction completed but the DB wasn't updated
 */
export async function POST(request: NextRequest) {
  // Rate limiting - prevent DoS attacks (CVE-2025-55184)
  if (!rateLimit(request, 10, 60000)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }
  
  try {
    const body = await request.json()
    
    // Validación estricta con Zod
    let validated
    try {
      validated = syncTagSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request body', details: error.errors },
          { status: 400 }
        )
      }
      throw error
    }
    
    const { tagCode } = validated

    const supabase = getSupabaseServerClient()

    // 1. Get tag from database
    const { data: tag, error: tagError } = await supabase
      .from('tags')
      .select('id, tag_code, token_id, mint_tx_hash, contract_address, chain, animal_id')
      .eq('tag_code', tagCode)
      .single()

    if (tagError || !tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    // 2. If tag already has token_id, return success
    if (tag.token_id) {
      const contractAddress = tag.contract_address || process.env.RANCHLINKTAG_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_TAG || ''
      return NextResponse.json({
        success: true,
        message: 'Tag already synced',
        tag_code: tag.tag_code,
        token_id: tag.token_id,
        mint_tx_hash: tag.mint_tx_hash,
        basescan_url: contractAddress
          ? `https://basescan.org/token/${contractAddress}?a=${tag.token_id}`
          : `https://basescan.org/tx/${tag.mint_tx_hash}`,
      })
    }

    // 3. If we have a transaction hash, check it directly
    if (tag.mint_tx_hash) {
      const contractAddress = (tag.contract_address || process.env.RANCHLINKTAG_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_TAG) as `0x${string}`
      const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC || process.env.ALCHEMY_BASE_RPC || 'https://mainnet.base.org'

      const publicClient = createPublicClient({
        chain: base,
        transport: http(rpcUrl),
      })

      try {
        // Get transaction receipt
        const receipt = await publicClient.getTransactionReceipt({
          hash: tag.mint_tx_hash as `0x${string}`,
        })

        if (receipt && receipt.status === 'success') {
          // Extract token ID from TagMinted event logs (avoids stale RPC state)
          const TAG_MINTED_TOPIC = '0xe304d243bce9c0e0ff7a391d3c7beee122d63493c415508e44ecdd13491900c9'
          let tokenId: bigint = BigInt(0)
          
          for (const log of receipt.logs) {
            if (
              log.address.toLowerCase() === contractAddress.toLowerCase() &&
              log.topics[0] === TAG_MINTED_TOPIC &&
              log.topics[1]
            ) {
              tokenId = BigInt(log.topics[1] as string)
              break
            }
          }

          // Fallback: use getTokenId if log parsing didn't work
          if (!tokenId || tokenId === BigInt(0)) {
            const publicId = `AUS${tag.tag_code.replace('RL-', '').padStart(4, '0')}`
            const { keccak256, stringToBytes } = await import('viem')
            const publicIdHash = keccak256(stringToBytes(publicId))
            tokenId = await publicClient.readContract({
              address: contractAddress,
              abi: [
                {
                  inputs: [{ name: 'publicIdHash', type: 'bytes32' }],
                  name: 'getTokenId',
                  outputs: [{ name: '', type: 'uint256' }],
                  stateMutability: 'view',
                  type: 'function',
                },
              ],
              functionName: 'getTokenId',
              args: [publicIdHash],
            }) as bigint
          }

          if (tokenId && tokenId > BigInt(0)) {
            // Update database
            const { error: updateError } = await supabase
              .from('tags')
              .update({
                token_id: tokenId.toString(),
                mint_tx_hash: tag.mint_tx_hash,
                contract_address: contractAddress,
                status: 'on_chain_unclaimed',
              })
              .eq('id', tag.id)

            if (updateError) {
              return NextResponse.json({
                success: false,
                error: `Failed to update database: ${updateError.message}`,
              }, { status: 500 })
            }

            return NextResponse.json({
              success: true,
              message: 'Tag synced successfully',
              tag_code: tag.tag_code,
              token_id: tokenId.toString(),
              mint_tx_hash: tag.mint_tx_hash,
              basescan_url: `https://basescan.org/token/${contractAddress}?a=${tokenId.toString()}`,
            })
          }
        }
      } catch (syncError: any) {
        console.error('[SYNC] Error syncing tag:', syncError)
        return NextResponse.json({
          success: false,
          error: `Failed to sync: ${syncError.message}`,
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'No transaction hash found. Tag may not have been minted yet.',
    }, { status: 400 })
  } catch (error: any) {
    console.error('[SYNC] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
    }, { status: 500 })
  }
}

