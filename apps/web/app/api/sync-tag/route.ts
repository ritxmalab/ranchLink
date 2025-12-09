import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { createPublicClient, http } from 'viem'
import { base } from '@/lib/blockchain/config'

/**
 * POST /api/sync-tag
 * Sync a tag's on-chain status by checking the blockchain directly
 * This fixes cases where the transaction completed but the DB wasn't updated
 */
export async function POST(request: NextRequest) {
  try {
    const { tagCode } = await request.json()

    if (!tagCode) {
      return NextResponse.json({ error: 'tagCode is required' }, { status: 400 })
    }

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
      return NextResponse.json({
        success: true,
        message: 'Tag already synced',
        tag_code: tag.tag_code,
        token_id: tag.token_id,
        mint_tx_hash: tag.mint_tx_hash,
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
          // Transaction succeeded, now get the token ID
          // We need to parse the logs or call getTokenId
          // For now, let's try to get it from the public_id
          const publicId = `AUS${tag.tag_code.replace('RL-', '').padStart(4, '0')}`
          
          // Hash the public ID
          const { keccak256, stringToBytes } = await import('viem')
          const publicIdHash = keccak256(stringToBytes(publicId))

          // Get token ID from contract
          const tokenId = await publicClient.readContract({
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

