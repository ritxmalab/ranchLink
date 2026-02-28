import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { verifySuperadminAuth } from '@/lib/superadmin-auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const verifySchema = z.object({
  txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/, 'Invalid tx hash format'),
  tagCode: z.string().regex(/^RL-\d{3,}$/, 'Invalid tag code format'),
})

/**
 * POST /api/verify-tx
 * Verify a transaction hash and update tag status if mint was successful.
 * Superadmin-only endpoint.
 */
export async function POST(request: NextRequest) {
  const authError = verifySuperadminAuth(request)
  if (authError) return authError

  if (!rateLimit(request, 20, 60000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    let txHash: string, tagCode: string
    try {
      const parsed = verifySchema.parse(await request.json())
      txHash = parsed.txHash
      tagCode = parsed.tagCode
    } catch (e: any) {
      return NextResponse.json({ error: 'Invalid input', details: e.errors || e.message }, { status: 400 })
    }

    // Check transaction status on blockchain
    const { createPublicClient, http } = await import('viem')
    const { base } = await import('@/lib/blockchain/config')
    const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC || process.env.ALCHEMY_BASE_RPC || 'https://mainnet.base.org'
    const rawAddr = process.env.RANCHLINKTAG_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_TAG
    if (!rawAddr) {
      return NextResponse.json({ error: 'RANCHLINKTAG_ADDRESS not configured' }, { status: 500 })
    }
    const contractAddress = rawAddr as `0x${string}`

    const publicClient = createPublicClient({
      chain: base,
      transport: http(rpcUrl),
    })

    // Get transaction receipt
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` })

    if (!receipt) {
      return NextResponse.json({
        success: false,
        message: 'Transaction not found. It may still be pending.',
        txHash,
        basescan: `https://basescan.org/tx/${txHash}`,
      })
    }

    if (receipt.status === 'reverted') {
      return NextResponse.json({
        success: false,
        message: 'Transaction reverted',
        txHash,
        basescan: `https://basescan.org/tx/${txHash}`,
      })
    }

    // Transaction succeeded - now get the token ID
    // We need to parse the logs to find the TagMinted event
    const RANCHLINK_TAG_ABI = [
      {
        type: 'event',
        name: 'TagMinted',
        inputs: [
          { name: 'tokenId', type: 'uint256', indexed: true },
          { name: 'publicIdHash', type: 'bytes32', indexed: true },
          { name: 'to', type: 'address', indexed: false },
          { name: 'cid', type: 'string', indexed: false },
        ],
      },
    ]

    // Parse logs to find TagMinted event
    let tokenId: bigint | null = null
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() === contractAddress.toLowerCase()) {
        try {
          const { decodeEventLog } = await import('viem')
          const decoded = decodeEventLog({
            abi: RANCHLINK_TAG_ABI,
            data: log.data,
            topics: log.topics,
          })
          if (decoded.eventName === 'TagMinted' && decoded.args && 'tokenId' in decoded.args) {
            tokenId = decoded.args.tokenId as bigint
            break
          }
        } catch (e) {
          // Not the event we're looking for
        }
      }
    }

    if (!tokenId) {
      // Try alternative: get token ID from contract using public ID hash
      // This requires the tag's public_id, which we can get from the database
      const { getSupabaseServerClient } = await import('@/lib/supabase/server')
      const supabase = getSupabaseServerClient()
      
      const { data: tag } = await supabase
        .from('tags')
        .select('public_id')
        .eq('tag_code', tagCode)
        .single()

      if (tag?.public_id) {
        const { hashPublicId } = await import('@/lib/blockchain/ranchLinkTag')
        const publicIdHash = hashPublicId(tag.public_id)
        
        try {
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
        } catch (e) {
          console.error('[VERIFY-TX] Failed to get token ID:', e)
        }
      }
    }

    if (!tokenId || tokenId === BigInt(0)) {
      return NextResponse.json({
        success: false,
        message: 'Transaction confirmed but token ID not found',
        txHash,
        receipt: {
          blockNumber: receipt.blockNumber.toString(),
          status: receipt.status,
        },
        basescan: `https://basescan.org/tx/${txHash}`,
      })
    }

    // Update tag in database
    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = getSupabaseServerClient()

    const { error: updateError } = await supabase
      .from('tags')
      .update({
        token_id: tokenId.toString(),
        mint_tx_hash: txHash,
        contract_address: contractAddress,
        status: 'on_chain_unclaimed',
      })
      .eq('tag_code', tagCode)

    if (updateError) {
      return NextResponse.json({
        success: false,
        message: 'Transaction confirmed but database update failed',
        error: updateError.message,
        tokenId: tokenId.toString(),
        txHash,
        basescan: `https://basescan.org/tx/${txHash}`,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction verified and tag updated',
      tokenId: tokenId.toString(),
      txHash,
      blockNumber: receipt.blockNumber.toString(),
      basescan: `https://basescan.org/tx/${txHash}`,
      tokenUrl: `https://basescan.org/token/${contractAddress}?a=${tokenId.toString()}`,
    })
  } catch (error: any) {
    console.error('[VERIFY-TX] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

