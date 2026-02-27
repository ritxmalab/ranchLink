import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const updateSchema = z.object({
  public_id: z.string().min(1),
  // BASIC
  name: z.string().min(1).max(100).optional(),
  species: z.string().min(1).max(50).optional(),
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
  // EVENT metadata
  event_type: z.enum(['weight_update', 'health_check', 'vet_visit', 'update', 'note']).default('update'),
  event_notes: z.string().max(1000).optional(),
  event_weight: z.number().optional(),
})

/**
 * POST /api/update-animal
 * Updates animal data, pins new metadata to IPFS, calls setCID on-chain, logs event.
 */
export async function POST(request: NextRequest) {
  if (!rateLimit(request, 10, 60000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body = await request.json()
    let validated: z.infer<typeof updateSchema>
    try {
      validated = updateSchema.parse(body)
    } catch (e) {
      if (e instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid data', details: e.errors }, { status: 400 })
      }
      throw e
    }

    const { public_id, event_type, event_notes, event_weight, ...animalFields } = validated
    const supabase = getSupabaseServerClient()

    // Load current animal + tag
    const { data: animal, error: animalError } = await supabase
      .from('animals')
      .select('*, tags(id, token_id, contract_address, tag_code)')
      .eq('public_id', public_id)
      .single()

    if (animalError || !animal) {
      return NextResponse.json({ error: 'Animal not found' }, { status: 404 })
    }

    // Build update payload (only non-undefined fields)
    const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() }
    const fields = Object.entries(animalFields)
    for (const [key, val] of fields) {
      if (val !== undefined) updatePayload[key] = val
    }

    // Update animal in DB
    const { error: updateError } = await supabase
      .from('animals')
      .update(updatePayload)
      .eq('public_id', public_id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update animal', details: updateError.message }, { status: 500 })
    }

    // Log event — capture ID so we can update it with IPFS CID + tx hash later
    const tag = Array.isArray(animal.tags) ? animal.tags[0] : animal.tags
    const { data: insertedEvent } = await supabase.from('animal_events').insert({
      animal_id: animal.id,
      event_type,
      notes: event_notes || null,
      weight: event_weight || (animalFields as any).yearling_weight || (animalFields as any).weaning_weight || null,
      event_date: new Date().toISOString().slice(0, 10),
    }).select('id').single()

    // Pin updated metadata to IPFS + setCID on-chain (non-blocking)
    let metadataCid: string | null = null
    let metadataTxHash: string | null = null

    try {
      const { data: freshAnimal } = await supabase
        .from('animals')
        .select('*, tags(tag_code)')
        .eq('public_id', public_id)
        .single()

      if (freshAnimal && tag?.token_id) {
        const { pinAnimalMetadata } = await import('@/lib/ipfs/client')
        metadataCid = await pinAnimalMetadata(freshAnimal, null)

        const { setCID } = await import('@/lib/blockchain/ranchLinkTag')
        metadataTxHash = await setCID(BigInt(tag.token_id), metadataCid)

        // Update event with IPFS cid + tx hash (use captured event ID)
        if (metadataCid && insertedEvent?.id) {
          await supabase.from('animal_events').update({
            ipfs_cid: metadataCid,
            tx_hash: metadataTxHash,
          }).eq('id', insertedEvent.id)

          await supabase.from('tags').update({
            metadata_cid: metadataCid,
            metadata_tx_hash: metadataTxHash,
          }).eq('id', tag.id)
        }
      }
    } catch (err: any) {
      console.error('[UPDATE-ANIMAL] IPFS/chain update failed (non-blocking):', err.message)
    }

    return NextResponse.json({
      success: true,
      public_id,
      metadata_updated: !!metadataCid,
      metadata_cid: metadataCid,
      metadata_tx_hash: metadataTxHash,
    })
  } catch (error: any) {
    console.error('[UPDATE-ANIMAL] Error:', error)
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 })
  }
}
