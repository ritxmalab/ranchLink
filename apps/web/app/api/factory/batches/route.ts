import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { mintTag as mintTagUnified } from '@/lib/blockchain/mintTag'
import { getDefaultCattleContract } from '@/lib/blockchain/contractRegistry'
import { pinAnimalMetadata } from '@/lib/ipfs/client'

/**
 * POST /api/factory/batches
 * Creates a batch of tags, mints NFTs, and returns QR data
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

    const supabase = getSupabaseServerClient()

    // 1. Create batch row
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
        status: 'draft',
      })
      .select('id')
      .single()

    if (batchError || !batch) {
      return NextResponse.json(
        { error: `Failed to create batch: ${batchError?.message}` },
        { status: 500 }
      )
    }

    // 2. Generate tag codes and create tags
    const tags = []
    const batchDate = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const slug = batchName.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4)

    // Get current max tag number for sequential codes
    // Use tags table (v1.0 canonical source)
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

    // Generate tags
    for (let i = 0; i < batchSize; i++) {
      const tagNumber = startNumber + i
      const tagCode = `RL-${String(tagNumber).padStart(3, '0')}`
      const publicId = `AUS${String(tagNumber).padStart(4, '0')}`
      const code = `RL-${batchDate}-${slug}-${String(tagNumber).padStart(4, '0')}`

      // Get contract from registry (supports multiple contracts/standards)
      const contract = await getDefaultCattleContract()
      let contractAddress = contract?.contract_address || process.env.RANCHLINKTAG_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_TAG || ''
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ranch-link.vercel.app'
      
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
          status: 'in_inventory',
          activation_state: 'active',
        })
        .select('id, tag_code')
        .single()

      if (tagError || !tag) {
        console.error(`Failed to create tag ${tagCode}:`, tagError)
        continue // Skip this tag but continue with others
      }

      // 3. Mint NFT on blockchain
      let tokenId: bigint | null = null
      let mintTxHash: string | null = null
      let cid: string = ''

      try {
        // Pin metadata to IPFS first (optional, can be empty initially)
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
        } catch (ipfsError) {
          console.warn(`IPFS pin failed for ${tagCode}, continuing without CID:`, ipfsError)
          // Continue without CID - can be updated later
        }

        // Mint the NFT using unified minting (supports multiple standards)
        // TODO: LastBurner / Non-custodial Support
        // - Currently mints to server wallet (custodial model)
        // - Future: For LastBurner kits, pass recipientAddress (Burner card address)
        // - Tags table already supports this via contract_address field
        const mintResult = await mintTagUnified({
          tagCode,
          publicId,
          cid,
          assetType: 'cattle', // Can be changed to 'licensed_products' for ERC-3643
          // recipientAddress: burnerAddress, // Future: for LastBurner kits
        })
        tokenId = mintResult.tokenId
        mintTxHash = mintResult.txHash
        
        // Update contract_address if different from default
        if (mintResult.contractAddress && mintResult.contractAddress !== contractAddress) {
          contractAddress = mintResult.contractAddress
          
          // Update tag with correct contract address
          await supabase
            .from('tags')
            .update({ contract_address: contractAddress })
            .eq('id', tag.id)
        }

        // Update tag with token ID and transaction hash
        await supabase
          .from('tags')
          .update({
            token_id: tokenId ? tokenId.toString() : null,
            mint_tx_hash: mintTxHash,
          })
          .eq('id', tag.id)
      } catch (mintError: any) {
        console.error(`Failed to mint tag ${tagCode}:`, mintError)
        // Continue - tag exists in DB, minting can be retried later
      }

      // 4. Generate QR URL
      const baseQrUrl = `${appUrl}/t/${tagCode}`

      tags.push({
        id: tag.id,
        tag_code: tagCode,
        public_id: publicId,
        token_id: tokenId ? tokenId.toString() : null,
        mint_tx_hash: mintTxHash || null,
        base_qr_url: baseQrUrl,
        chain: chain || 'BASE',
        contract_address: contractAddress,
        status: 'in_inventory',
        activation_state: 'active',
        batch_id: batch.id,
        ranch_id: targetRanchId || null,
      })
    }

    // 5. Handle kit mode if enabled
    let kitId: string | null = null
    if (kitMode && kitSize) {
      // Generate kit code
      const kitCode = `RLKIT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`

      // Create kit
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

        // Link tags to kit (first kitSize tags)
        try {
          const kitTagLinks = tags.slice(0, kitSize).map(tagData => ({
            kit_id: kit.id,
            tag_id: tagData.id,
          }))

          if (kitTagLinks.length > 0) {
            await supabase.from('kit_tags').insert(kitTagLinks)
          }
        } catch (kitLinkError) {
          console.warn('Kit tags linking failed:', kitLinkError)
          // Continue - kit exists, linking can be done later
        }
      }
    }

    // 6. Update batch status
    await supabase
      .from('batches')
      .update({ status: 'printed' })
      .eq('id', batch.id)

    return NextResponse.json({
      success: true,
      batch: {
        id: batch.id,
        name: batchName,
        count: batchSize,
      },
      tags,
      kit: kitId ? { id: kitId } : null,
      message: `Successfully created batch with ${tags.length} tags`,
    })
  } catch (error: any) {
    console.error('Factory batch creation error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to create batch',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

