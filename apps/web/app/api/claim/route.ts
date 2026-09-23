import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { pinAnimalMetadata } from '@/lib/ipfs/client'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Superseded by the /t/[tag_code] attach flow. Kept reachable only when
// ENABLE_LEGACY_CLAIM_API is explicitly set, so it cannot be used to create
// owner/animal records anonymously in production.
const LEGACY_CLAIM_ENABLED = process.env.ENABLE_LEGACY_CLAIM_API === 'true'

const claimSchema = z.object({
  token: z.string().min(1).max(200),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(30).optional(),
  basename: z.string().max(200).optional(),
  animalName: z.string().max(100).optional(),
  species: z.string().max(50).optional(),
  breed: z.string().max(100).optional(),
  birthYear: z.number().int().min(1900).max(2100).optional(),
})

// POST /api/claim - Claim a tag with token (legacy)
export async function POST(request: NextRequest) {
  if (!LEGACY_CLAIM_ENABLED) {
    return NextResponse.json(
      { error: 'This endpoint is retired. Use /t/[tag_code] instead.' },
      { status: 410 }
    )
  }

  if (!rateLimit(request, 5, 60000)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    let parsed: z.infer<typeof claimSchema>
    try {
      parsed = claimSchema.parse(await request.json())
    } catch (e) {
      if (e instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid request body', details: e.errors }, { status: 400 })
      }
      throw e
    }
    const { token, email, phone, basename, animalName, species, breed, birthYear } = parsed

    const supabase = getSupabaseServerClient()

    // LEGACY ENDPOINT - v1.0 uses /t/[tag_code] flow instead
    // This endpoint is kept for backward compatibility only
    // If token looks like a tag_code (RL-XXX), redirect to v1.0 flow
    if (/^RL-\d+$/i.test(token.trim())) {
      return NextResponse.json({ 
        error: 'This endpoint is deprecated. Please use /t/[tag_code] instead.',
        redirect: `/t/${token.trim().toUpperCase()}`
      }, { status: 400 })
    }

    // Find device by claim token (LEGACY - only for old tokens)
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('*')
      .eq('claim_token', token)
      .eq('status', 'printed')
      .single()

    if (deviceError || !device) {
      return NextResponse.json({ error: 'Invalid or already claimed token' }, { status: 400 })
    }

    // Check if token expired
    if (device.claim_exp && new Date(device.claim_exp) < new Date()) {
      return NextResponse.json({ error: 'Claim token expired' }, { status: 400 })
    }

    // Create or get owner
    let ownerId
    if (basename) {
      const { data: existingOwner } = await supabase
        .from('owners')
        .select('id')
        .eq('basename', basename)
        .single()

      if (existingOwner) {
        ownerId = existingOwner.id
      } else {
        const { data: newOwner, error: ownerError } = await supabase
          .from('owners')
          .insert({ email, phone, basename })
          .select('id')
          .single()

        if (ownerError) {
          return NextResponse.json({ error: 'Failed to create owner' }, { status: 500 })
        }
        ownerId = newOwner.id
      }
    } else {
      const { data: newOwner, error: ownerError } = await supabase
        .from('owners')
        .insert({ email, phone })
        .select('id')
        .single()

      if (ownerError) {
        return NextResponse.json({ error: 'Failed to create owner' }, { status: 500 })
      }
      ownerId = newOwner.id
    }

    // Generate public ID if not assigned
    const publicId = device.public_id || `AUS${String(device.id).slice(0, 4).padStart(4, '0')}`

    // Create animal record
    const { data: animal, error: animalError } = await supabase
      .from('animals')
      .insert({
        public_id: publicId,
        tag_id: device.tag_id,
        owner_id: ownerId,
        species: species || 'Cattle',
        breed: breed || null,
        birth_year: birthYear || null,
        status: 'active',
      })
      .select('*')
      .single()

    if (animalError) {
      return NextResponse.json({ error: 'Failed to create animal' }, { status: 500 })
    }

    // Pin animal metadata to IPFS
    let cid: string | null = null
    try {
      cid = await pinAnimalMetadata({ ...animal, animal_name: animalName })
    } catch (error) {
      console.error('IPFS pin failed:', error)
      // Continue anyway - can retry later
    }

    // Update device status
    await supabase
      .from('devices')
      .update({
        status: 'claimed',
        owner_id: ownerId,
        public_id: publicId,
        activated_at: new Date().toISOString(),
      })
      .eq('id', device.id)

    // TODO: Mint NFT on-chain (async, don't block)
    // This would be done in a background job

    return NextResponse.json({
      success: true,
      public_id: publicId,
      animal,
      cid,
      message: 'Tag claimed successfully!',
    })
  } catch (error: any) {
    console.error('Claim error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}


