import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { mintTag as mintTagUnified } from '@/lib/blockchain/mintTag'
import { getDefaultCattleContract } from '@/lib/blockchain/contractRegistry'
import { pinAnimalMetadata } from '@/lib/ipfs/client'

/**
 * POST /api/factory/batches
 * Creates a batch of tags, mints NFTs on-chain (MANDATORY), and returns QR data
 * 
 * CRITICAL: In v1.0, mint is MANDATORY. Tags without token_id are NOT real tags.
 * 
 * Request body:
 * {
 *   batchName: string,
 *   batchSize: number,
 *   model: string,
 *   material: string,
 *   color: string,
 *   chain: string (default: 'BASE'),
 *   targetRanchId?: string (optional),
 *   kitMode?: boolean (default: false),
 *   kitSize?: number (optional, if kitMode is true)
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('[FACTORY] Starting batch creation...')
  
  try {
    const body = await request.json()
    const {
      batchName,
      batchSize,
      model,
      material,
      color,
      chain = 'BASE',
      targetRanchId,
      kitMode = false,
      kitSize,
    } = body

    // Validation
    if (!batchName || !batchSize || !model || !material || !color) {
      return NextResponse.json(
        { error: 'Missing required fields: batchName, batchSize, model, material, color' },
        { status: 400 }
      )
    }

    if (batchSize < 1 || batchSize > 1000) {
      return NextResponse.json(
        { error: 'Batch size must be between 1 and 1000' },
        { status: 400 }
      )
    }

    // Pre-flight checks for minting
    console.log('[FACTORY] Pre-flight checks...')
    const preflightErrors: string[] = []
    const preflightChecks: string[] = []

    // Check environment variables
    if (!process.env.SERVER_WALLET_PRIVATE_KEY) {
      preflightErrors.push('Missing SERVER_WALLET_PRIVATE_KEY environment variable')
    } else {
      preflightChecks.push('✓ SERVER_WALLET_PRIVATE_KEY is set')
    }

    const contractAddress = process.env.RANCHLINKTAG_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_TAG || ''
    if (!contractAddress) {
      preflightErrors.push('Missing contract address (RANCHLINKTAG_ADDRESS or NEXT_PUBLIC_CONTRACT_TAG)')
    } else {
      preflightChecks.push(`✓ Contract address: ${contractAddress}`)
    }

    if (!process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC && !process.env.ALCHEMY_BASE_RPC) {
      preflightErrors.push('Missing RPC URL (NEXT_PUBLIC_ALCHEMY_BASE_RPC or ALCHEMY_BASE_RPC)')
    } else {
      preflightChecks.push('✓ RPC URL is set')
    }

    // Check wallet balance (if we can)
    try {
      const { createPublicClient, http, formatEther } = await import('viem')
      const { base } = await import('@/lib/blockchain/config')
      const serverWalletAddress = process.env.SERVER_WALLET_ADDRESS || '0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83'
      
      const publicClient = createPublicClient({
        chain: base,
        transport: http(process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC || process.env.ALCHEMY_BASE_RPC || 'https://mainnet.base.org'),
      })

      const balance = await publicClient.getBalance({ address: serverWalletAddress as `0x${string}` })
      const balanceEth = formatEther(balance)
      preflightChecks.push(`✓ Server wallet balance: ${balanceEth} ETH`)
      
      if (parseFloat(balanceEth) < 0.001) {
        preflightErrors.push(`Insufficient balance: ${balanceEth} ETH (need at least 0.001 ETH for gas)`)
      }
    } catch (balanceError: any) {
      console.warn('[FACTORY] Could not check wallet balance:', balanceError.message)
      preflightChecks.push(`⚠ Could not check balance: ${balanceError.message}`)
    }

    if (preflightErrors.length > 0) {
      console.error('[FACTORY] Pre-flight checks failed:', preflightErrors)
      return NextResponse.json(
        {
          error: 'Pre-flight checks failed - cannot mint tags',
          checks: preflightChecks,
          errors: preflightErrors,
          message: 'Please configure environment variables and ensure server wallet has sufficient ETH before generating tags.',
        },
        { status: 500 }
      )
    }

    console.log('[FACTORY] Pre-flight checks passed:', preflightChecks)

    const supabase = getSupabaseServerClient()

    // 1. Create batch row
    console.log('[FACTORY] Creating batch in database...')
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .insert({
        name: batchName,
        batch_name: batchName,
        model,
        material,
        color,
        chain,
        count: batchSize,
        target_ranch_id: targetRanchId || null,
        status: 'minting', // Start as 'minting' - will update to 'ready_for_sale' if all mints succeed
      })
      .select('id')
      .single()

    if (batchError || !batch) {
      console.error('[FACTORY] Failed to create batch:', batchError)
      return NextResponse.json(
        { error: `Failed to create batch: ${batchError?.message}` },
        { status: 500 }
      )
    }

    console.log(`[FACTORY] Batch created: ${batch.id}`)

    // 2. Generate tag codes and create tags
    const tags: any[] = []
    const batchDate = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const slug = batchName.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4)

    // Get current max tag number for sequential codes
    const { data: existingTags } = await supabase
      .from('tags')
      .select('tag_code')
      .order('created_at', { ascending: false })
      .limit(1)

    let startNumber = 1
    if (existingTags && existingTags.length > 0) {
      const lastCode = existingTags[0].tag_code
      if (lastCode) {
        const match = lastCode.match(/RL-(\d+)/)
        if (match) {
          startNumber = parseInt(match[1], 10) + 1
        }
      }
    }

    console.log(`[FACTORY] Starting tag generation from RL-${String(startNumber).padStart(3, '0')}`)

    // Generate tags and mint them
    const mintResults: Array<{ tagCode: string; success: boolean; tokenId?: string; error?: string }> = []
    
    for (let i = 0; i < batchSize; i++) {
      const tagNumber = startNumber + i
      const tagCode = `RL-${String(tagNumber).padStart(3, '0')}`
      const publicId = `AUS${String(tagNumber).padStart(4, '0')}`
      
      console.log(`[FACTORY] Processing tag ${i + 1}/${batchSize}: ${tagCode}`)

      // Get contract from registry
      const contract = await getDefaultCattleContract()
      let contractAddress = contract?.contract_address || process.env.RANCHLINKTAG_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_TAG || ''
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ranch-link.vercel.app'
      
      // Create tag in DB first (status: 'minting')
      const { data: tag, error: tagError } = await supabase
        .from('tags')
        .insert({
          tag_code: tagCode,
          chain: chain || 'BASE',
          contract_address: contractAddress,
          token_id: null, // Will be set after minting
          mint_tx_hash: null, // Will be set after minting
          batch_id: batch.id,
          ranch_id: targetRanchId || null,
          status: 'minting', // Start as 'minting'
          activation_state: 'active',
        })
        .select('id, tag_code')
        .single()

      if (tagError || !tag) {
        console.error(`[FACTORY] Failed to create tag ${tagCode}:`, tagError)
        mintResults.push({ tagCode, success: false, error: `DB error: ${tagError?.message}` })
        continue
      }

      console.log(`[FACTORY] Tag ${tagCode} created in DB, now minting on-chain...`)

      // 3. Mint NFT on blockchain (MANDATORY - blocking)
      let tokenId: bigint | null = null
      let mintTxHash: string | null = null
      let cid: string = ''
      let mintError: any = null

      try {
        // Pin metadata to IPFS first (optional)
        try {
          cid = await pinAnimalMetadata({
            public_id: publicId,
            tag_code: tagCode,
            batch_name: batchName,
            material,
            model,
            color,
            chain,
          })
          console.log(`[FACTORY] IPFS metadata pinned for ${tagCode}: ${cid}`)
        } catch (ipfsError) {
          console.warn(`[FACTORY] IPFS pin failed for ${tagCode}, continuing without CID:`, ipfsError)
          // Continue without CID
        }

        // Mint the NFT (MANDATORY)
        console.log(`[FACTORY] Calling mintTagUnified for ${tagCode}...`)
        const mintResult = await mintTagUnified({
          tagCode,
          publicId,
          cid,
          assetType: 'cattle',
        })
        
        tokenId = mintResult.tokenId
        mintTxHash = mintResult.txHash
        
        console.log(`[FACTORY] ✅ Mint successful for ${tagCode}: token_id=${tokenId}, tx=${mintTxHash}`)

        // Update contract_address if different from default
        if (mintResult.contractAddress && mintResult.contractAddress !== contractAddress) {
          contractAddress = mintResult.contractAddress
          await supabase
            .from('tags')
            .update({ contract_address: contractAddress })
            .eq('id', tag.id)
        }

        // Update tag with token ID and transaction hash
        const { error: updateError } = await supabase
          .from('tags')
          .update({
            token_id: tokenId.toString(),
            mint_tx_hash: mintTxHash,
            contract_address: contractAddress,
            status: 'on_chain_unclaimed', // v1.0: Tag is now on-chain and ready for claim
          })
          .eq('id', tag.id)

        if (updateError) {
          console.error(`[FACTORY] Failed to update tag ${tagCode} after mint:`, updateError)
          mintResults.push({ tagCode, success: false, error: `DB update error: ${updateError.message}` })
        } else {
          console.log(`[FACTORY] Tag ${tagCode} updated in DB with token_id=${tokenId}`)
          mintResults.push({ tagCode, success: true, tokenId: tokenId.toString() })
        }
      } catch (error: any) {
        mintError = error
        console.error(`[FACTORY] ❌ Failed to mint tag ${tagCode}:`, error)
        console.error(`[FACTORY] Error details:`, {
          message: error.message,
          stack: error.stack,
          name: error.name,
        })
        
        // Mark tag as mint_failed in database
        await supabase
          .from('tags')
          .update({
            status: 'mint_failed',
          })
          .eq('id', tag.id)
        
        mintResults.push({ tagCode, success: false, error: error.message || 'Unknown mint error' })
        // Continue with next tag - don't fail entire batch
      }

      // Only include successfully minted tags in response
      if (tokenId) {
        const baseQrUrl = `${appUrl}/t/${tagCode}`

        tags.push({
          id: tag.id,
          tag_code: tagCode,
          public_id: publicId,
          token_id: tokenId.toString(),
          mint_tx_hash: mintTxHash || null,
          base_qr_url: baseQrUrl,
          chain: chain || 'BASE',
          contract_address: contractAddress,
          status: 'on_chain_unclaimed', // v1.0: Ready for claim
          activation_state: 'active',
          batch_id: batch.id,
          ranch_id: targetRanchId || null,
        })
      }
    }

    // 4. Handle kit mode if enabled
    let kitId: string | null = null
    if (kitMode && kitSize) {
      const kitCode = `RLKIT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
      const { data: kit, error: kitError } = await supabase
        .from('kits')
        .insert({
          kit_code: kitCode,
          status: 'unclaimed',
        })
        .select('id')
        .single()

      if (!kitError && kit) {
        kitId = kit.id
        const kitTagLinks = tags.slice(0, kitSize).map(tagData => ({
          kit_id: kit.id,
          tag_id: tagData.id,
        }))

        if (kitTagLinks.length > 0) {
          await supabase.from('kit_tags').insert(kitTagLinks)
        }
      }
    }

    // 5. Calculate mint statistics
    const successfulMints = mintResults.filter(r => r.success).length
    const failedMints = mintResults.filter(r => !r.success).length

    // 6. Update batch status
    const batchStatus = failedMints === 0 ? 'ready_for_sale' : 'mint_failed'
    await supabase
      .from('batches')
      .update({ status: batchStatus })
      .eq('id', batch.id)

    const duration = Date.now() - startTime
    console.log(`[FACTORY] Batch creation completed in ${duration}ms. Success: ${successfulMints}/${batchSize}`)

    // 7. Return response
    return NextResponse.json({
      success: failedMints === 0,
      batch: {
        id: batch.id,
        name: batchName,
        count: batchSize,
        status: batchStatus,
      },
      tags, // Only successfully minted tags (on-chain)
      kit: kitId ? { id: kitId } : null,
      mint_summary: {
        total: batchSize,
        successful: successfulMints,
        failed: failedMints,
        results: mintResults,
      },
      preflight_checks: preflightChecks,
      message: failedMints === 0
        ? `✅ Successfully created batch with ${tags.length} tags. All tags are on-chain and ready for sale.`
        : `⚠️ Created batch with ${batchSize} tags. ${successfulMints} minted successfully (ready for sale), ${failedMints} failed to mint (cannot be sold).`,
      warnings: failedMints > 0 ? [
        `⚠️ ${failedMints} tag(s) failed to mint and cannot be sold or printed.`,
        'Failed tags are marked as "mint_failed" in database.',
        'Check server wallet balance, RPC connection, and MINTER_ROLE permissions.',
        'Use the Retry Mint button in Inventory tab to retry failed mints.',
        'DO NOT print or ship tags with "Token ID: Pending" - they will not work.',
      ] : [],
    })
  } catch (error: any) {
    console.error('[FACTORY] Batch creation error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to create batch',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
