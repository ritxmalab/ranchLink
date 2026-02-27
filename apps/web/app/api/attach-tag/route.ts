import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

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
      .select('id, tag_code, animal_id, ranch_id, status, token_id, contract_address, mint_tx_hash')
      .eq('tag_code', tagCode)
      .single()

    if (tagError || !tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    // 2. Tag MUST be on-chain before attach (v1.0 rule)
    if (!tag.token_id || !tag.contract_address) {
      return NextResponse.json(
        {
          error: 'Tag is not on-chain',
          message: 'This tag has not been minted yet. Tags must be minted on-chain before they can be attached to an animal.',
          tag_code: tag.tag_code,
          status: tag.status,
          suggestion: tag.status === 'mint_failed'
            ? 'The mint failed during batch creation. Please use the Retry Mint button in the Inventory tab to complete the mint.'
            : 'Please wait for the mint to complete, or use Retry Mint if it failed.',
        },
        { status: 400 }
      )
    }

    // 3. Build the full animal payload
    const animalPayload = {
      name: animalData.name,
      species: animalData.species,
      breed: animalData.breed || null,
      birth_year: animalData.birth_year || null,
      sex: animalData.sex || null,
      size: animalData.size || null,
      // IDENTIFICATION
      eid: animalData.eid || null,
      secondary_id: animalData.secondary_id || null,
      tattoo: animalData.tattoo || null,
      brand: animalData.brand || null,
      // ADDITIONAL
      owner: animalData.owner || null,
      head_count: animalData.head_count || null,
      labels: animalData.labels || null,
      // CALLFHOOD
      dam_id: animalData.dam_id || null,
      sire_id: animalData.sire_id || null,
      birth_weight: animalData.birth_weight || null,
      weaning_weight: animalData.weaning_weight || null,
      weaning_date: animalData.weaning_date || null,
      yearling_weight: animalData.yearling_weight || null,
      yearling_date: animalData.yearling_date || null,
      // PURCHASE
      seller: animalData.seller || null,
      purchase_price: animalData.purchase_price || null,
      purchase_date: animalData.purchase_date || null,
      // PHOTO
      photo_url: animalData.photo_url || null,
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

    // 5. Link tag to animal
    const { error: updateError } = await supabase
      .from('tags')
      .update({
        animal_id: animalId,
        ranch_id: tag.ranch_id || null,
        status: 'attached',
      })
      .eq('id', tag.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 })
    }

    // 6. Pin complete metadata to IPFS and update NFT tokenURI on-chain
    let metadataCid: string | null = null
    let metadataTxHash: string | null = null

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

      if (completeAnimal && tag.token_id) {
        const { pinAnimalMetadata } = await import('@/lib/ipfs/client')
        metadataCid = await pinAnimalMetadata(completeAnimal, ranchData)
        console.log(`[ATTACH-TAG] Metadata pinned to IPFS: ${metadataCid}`)

        const { setCID } = await import('@/lib/blockchain/ranchLinkTag')
        const tokenId = BigInt(tag.token_id)
        metadataTxHash = await setCID(tokenId, metadataCid)
        console.log(`[ATTACH-TAG] TokenURI updated on-chain: ${metadataTxHash}`)

        await supabase
          .from('tags')
          .update({
            metadata_cid: metadataCid,
            metadata_tx_hash: metadataTxHash,
          })
          .eq('id', tag.id)
      }
    } catch (error: any) {
      console.error('[ATTACH-TAG] Failed to update metadata (non-blocking):', error)
    }

    return NextResponse.json({
      success: true,
      public_id: publicId,
      tag_code: tagCode,
      message: 'Tag attached successfully',
      metadata_updated: !!metadataCid,
      metadata_cid: metadataCid,
      metadata_tx_hash: metadataTxHash,
    })
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
