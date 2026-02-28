import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const attachTagSchema = z.object({
  tagCode: z.string().min(1).max(20),
  animalData: z.object({
    // BASIC
    name: z.string().min(1).max(100),
    species: z.string().min(1).max(50),
    breed: z.string().max(100).optional(),
    birth_year: z.number().int().min(1900).max(2100).optional(),
    sex: z.string().max(20).optional(),
    size: z.string().max(50).optional(),

    // IDENTIFICATION
    eid: z.string().max(100).optional(),
    secondary_id: z.string().max(100).optional(),
    tattoo: z.string().max(100).optional(),
    brand: z.string().max(100).optional(),

    // ADDITIONAL
    owner: z.string().max(200).optional(),
    head_count: z.number().int().min(1).optional(),
    labels: z.array(z.string().max(50)).optional(),

    // CALLFHOOD
    dam_id: z.string().max(100).optional(),
    sire_id: z.string().max(100).optional(),
    birth_weight: z.number().optional(),
    weaning_weight: z.number().optional(),
    weaning_date: z.string().optional(),
    yearling_weight: z.number().optional(),
    yearling_date: z.string().optional(),

    // PURCHASE
    seller: z.string().max(200).optional(),
    purchase_price: z.number().optional(),
    purchase_date: z.string().optional(),
    // PHOTO
    photo_url: z.string().url().optional(),
  }),
})

/**
 * POST /api/attach-tag
 * Attaches a tag to an animal — fills all field sections from the RanchLink diagram.
 * 
 * Pipeline: QR scan → /t/[tag_code] → this endpoint → /a/[public_id]
 * The NFT was already minted during batch creation. This only:
 *   1. Creates the animal record with all fields
 *   2. Links tag to animal
 *   3. Pins full metadata to IPFS
 *   4. Calls setCID() to update NFT tokenURI on-chain
 */
export async function POST(request: NextRequest) {
  if (!rateLimit(request, 10, 60000)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()

    let validated
    try {
      validated = attachTagSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request body', details: error.errors },
          { status: 400 }
        )
      }
      throw error
    }

    const { tagCode, animalData } = validated
    const supabase = getSupabaseServerClient()

    // 1. Load tag — must exist and be on-chain
    const { data: tag, error: tagError } = await supabase
      .from('tags')
      .select('id, tag_code, animal_id, ranch_id, status, token_id, contract_address, mint_tx_hash, metadata_cid')
      .eq('tag_code', tagCode)
      .single()

    if (tagError || !tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    // 2. Tag must be in a valid state for attachment
    // v2.0: pre_identity tags (Merkle-anchored) are valid — they lazy-mint at attach time
    // v1.0: on_chain_unclaimed tags (already minted ERC-721) are valid
    const validStatuses = ['on_chain_unclaimed', 'pre_identity', 'assembled', 'in_inventory']
    if (!validStatuses.includes(tag.status)) {
      return NextResponse.json(
        {
          error: 'Tag is not available for attachment',
          tag_code: tag.tag_code,
          status: tag.status,
          suggestion: tag.status === 'mint_failed'
            ? 'Use the Retry Mint button in the Inventory tab.'
            : tag.status === 'attached'
            ? 'This tag is already attached to an animal.'
            : 'Tag is not in a claimable state.',
        },
        { status: 400 }
      )
    }

    // 3. Build the full animal payload
    const animalPayload = {
      name: animalData.name,
      species: animalData.species,
      breed: animalData.breed ?? null,
      birth_year: animalData.birth_year ?? null,
      sex: animalData.sex ?? null,
      size: animalData.size ?? null,
      // IDENTIFICATION
      eid: animalData.eid ?? null,
      secondary_id: animalData.secondary_id ?? null,
      tattoo: animalData.tattoo ?? null,
      brand: animalData.brand ?? null,
      // ADDITIONAL
      owner: animalData.owner ?? null,
      head_count: animalData.head_count ?? null,
      labels: animalData.labels ?? null,
      // CALLFHOOD — use ?? so 0 values are preserved
      dam_id: animalData.dam_id ?? null,
      sire_id: animalData.sire_id ?? null,
      birth_weight: animalData.birth_weight ?? null,
      weaning_weight: animalData.weaning_weight ?? null,
      weaning_date: animalData.weaning_date ?? null,
      yearling_weight: animalData.yearling_weight ?? null,
      yearling_date: animalData.yearling_date ?? null,
      // PURCHASE
      seller: animalData.seller ?? null,
      purchase_price: animalData.purchase_price ?? null,
      purchase_date: animalData.purchase_date ?? null,
      // PHOTO
      photo_url: animalData.photo_url ?? null,
    }

    // 4. Create or update animal
    let animalId: string
    let publicId: string

    if (tag.animal_id) {
      const { data: existingAnimal, error: animalError } = await supabase
        .from('animals')
        .update(animalPayload)
        .eq('id', tag.animal_id)
        .select('public_id')
        .single()

      if (animalError || !existingAnimal) {
        return NextResponse.json({ error: 'Failed to update animal' }, { status: 500 })
      }

      animalId = tag.animal_id
      publicId = existingAnimal.public_id
    } else {
      const { data: lastAnimal } = await supabase
        .from('animals')
        .select('public_id')
        .order('created_at', { ascending: false })
        .limit(1)

      let nextNumber = 1
      if (lastAnimal && lastAnimal.length > 0) {
        const match = lastAnimal[0].public_id?.match(/AUS(\d+)/)
        if (match) nextNumber = parseInt(match[1], 10) + 1
      }

      publicId = `AUS${String(nextNumber).padStart(4, '0')}`
      const ranchId = tag.ranch_id || null

      const { data: newAnimal, error: animalError } = await supabase
        .from('animals')
        .insert({
          public_id: publicId,
          ranch_id: ranchId,
          status: 'active',
          ...animalPayload,
        })
        .select('id, public_id')
        .single()

      if (animalError || !newAnimal) {
        console.error('[ATTACH-TAG] Failed to create animal:', animalError)
        return NextResponse.json({ error: 'Failed to create animal' }, { status: 500 })
      }

      animalId = newAnimal.id
      publicId = newAnimal.public_id
    }

    // 5. Link tag to animal — write public_id so /t/[tag_code] can redirect without a join
    // Generate a claim_token so the attaching farmer can edit their animal later
    const { randomUUID } = await import('crypto')
    const claimToken = randomUUID()

    const { error: updateError } = await supabase
      .from('tags')
      .update({
        animal_id: animalId,
        public_id: publicId,
        ranch_id: tag.ranch_id || null,
        status: 'attached',
        claim_token: claimToken,
      })
      .eq('id', tag.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 })
    }

    // 5b. Write tag_id back to animal so the reverse lookup works
    const { error: tagLinkError } = await supabase
      .from('animals')
      .update({ tag_id: tag.id })
      .eq('id', animalId)
    if (tagLinkError) {
      console.error('[ATTACH-TAG] Failed to write tag_id to animal:', tagLinkError.message)
    }

    // 6. Pin metadata to IPFS
    let metadataCid: string | null = null
    let metadataTxHash: string | null = null
    let tokenId: string | null = tag.token_id || null

    try {
      let ranchData = null
      if (tag.ranch_id) {
        const { data: ranch } = await supabase
          .from('ranches')
          .select('name, contact_email, phone')
          .eq('id', tag.ranch_id)
          .single()
        ranchData = ranch
      }

      const { data: completeAnimal } = await supabase
        .from('animals')
        .select('*, tags!inner(tag_code)')
        .eq('id', animalId)
        .single()

      if (completeAnimal) {
        const { pinAnimalMetadata } = await import('@/lib/ipfs/client')
        metadataCid = await pinAnimalMetadata(completeAnimal, ranchData)
        console.log(`[ATTACH-TAG] Metadata pinned: ${metadataCid}`)
      }
    } catch (e: any) {
      console.error('[ATTACH-TAG] IPFS pin failed (non-blocking):', e.message)
    }

    // 7. Lazy mint ERC-1155 token (pre_identity → active RWA)
    //    For legacy ERC-721 tags (already have token_id), just update CID.
    //    For new pre_identity tags, mint the ERC-1155 token now.
    const isPre = tag.status === 'pre_identity' || !tag.token_id

    // Decode Merkle proof stored in metadata_cid as "MERKLE:<batchIdHex>|<proof1>,<proof2>,..."
    let batchIdHex: `0x${string}` | null = null
    let merkleProof: `0x${string}`[] = []
    const metaCid: string = (tag as any).metadata_cid || ''
    if (metaCid.startsWith('MERKLE:')) {
      const [batchPart, proofPart] = metaCid.slice(7).split('|')
      batchIdHex = batchPart as `0x${string}`
      merkleProof = proofPart ? proofPart.split(',').filter(Boolean) as `0x${string}`[] : []
    }

    // merkleProof can be [] for a single-tag batch (valid empty proof)
    if (isPre && batchIdHex && metadataCid) {
      try {
        const { lazyMintTag } = await import('@/lib/blockchain/ranchLinkTag1155')
        const result = await lazyMintTag(
          tagCode,
          batchIdHex,
          merkleProof,
          metadataCid
        )
        tokenId = result.tokenId.toString()
        metadataTxHash = result.txHash
        console.log(`[ATTACH-TAG] ✅ ERC-1155 lazy mint: tokenId=${tokenId}, tx=${metadataTxHash}`)

        await supabase
          .from('tags')
          .update({
            token_id: tokenId,
            mint_tx_hash: metadataTxHash,
            metadata_cid: metadataCid,
            metadata_tx_hash: metadataTxHash,
          })
          .eq('id', tag.id)
      } catch (e: any) {
        console.error('[ATTACH-TAG] Lazy mint failed (non-blocking):', e.message)
        // Tag is still attached in DB — mint can be retried later
        if (metadataCid) {
          await supabase.from('tags').update({ metadata_cid: metadataCid }).eq('id', tag.id)
        }
      }
    } else if (tag.token_id && metadataCid) {
      // Legacy ERC-721 path: just update CID
      try {
        const { setCID } = await import('@/lib/blockchain/ranchLinkTag')
        metadataTxHash = await setCID(BigInt(tag.token_id), metadataCid)
        console.log(`[ATTACH-TAG] ERC-721 CID updated: ${metadataTxHash}`)
        await supabase
          .from('tags')
          .update({ metadata_cid: metadataCid, metadata_tx_hash: metadataTxHash })
          .eq('id', tag.id)
      } catch (e: any) {
        console.error('[ATTACH-TAG] ERC-721 setCID failed (non-blocking):', e.message)
      }
    }

    const response = NextResponse.json({
      success: true,
      public_id: publicId,
      tag_code: tagCode,
      token_id: tokenId,
      claim_token: claimToken,
      message: 'Tag attached successfully',
      metadata_updated: !!metadataCid,
      metadata_cid: metadataCid,
      metadata_tx_hash: metadataTxHash,
      on_chain: !!tokenId,
    })

    // Set claim_token cookie so the farmer's browser can edit this animal later
    // Keyed by public_id so multiple animals can be owned on the same device
    response.cookies.set(`rl_owner_${publicId}`, claimToken, {
      httpOnly: false, // needs to be readable by client JS for the animal card
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365 * 5, // 5 years
      secure: process.env.NODE_ENV === 'production',
    })

    return response
  } catch (error: any) {
    console.error('Attach tag error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to attach tag',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
