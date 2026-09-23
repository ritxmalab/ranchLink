import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSuperadminAuthenticated } from '@/lib/superadmin-auth'

// GET /api/animals/[id] - Get animal by public_id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const publicId = params.id
    const supabase = getSupabaseServerClient()
    const isAdmin = isSuperadminAuthenticated(request)

    const publicSelect = `
      id,
      public_id,
      name,
      species,
      breed,
      sex,
      birth_year,
      size,
      status,
      eid,
      secondary_id,
      tattoo,
      brand,
      owner,
      head_count,
      labels,
      dam_id,
      sire_id,
      birth_weight,
      weaning_weight,
      weaning_date,
      yearling_weight,
      yearling_date,
      photo_url,
      ranch_id,
      tag_id,
      created_at,
      updated_at,
      tags (
        id,
        tag_code,
        token_id,
        mint_tx_hash,
        chain,
        contract_address,
        status,
        activation_state
      ),
      ranches (
        id,
        name
      )
    `

    const adminSelect = `
      *,
      tags (
        id,
        tag_code,
        token_id,
        mint_tx_hash,
        chain,
        contract_address,
        status,
        activation_state,
        owner_user_id
      ),
      ranches (
        id,
        name,
        contact_email
      )
    `

    // Get animal with tag and ranch info (v1.0 schema)
    // Note: * already includes photo_url; claim_token is on tags table via separate query
    const selectSpec: string = isAdmin ? adminSelect : publicSelect
    const { data, error } = await supabase
      .from('animals')
      .select(selectSpec)
      .eq('public_id', publicId)
      .single()

    const animal = data as Record<string, any> | null

    if (error || !animal) {
      return NextResponse.json({ error: 'Animal not found' }, { status: 404 })
    }

    // Get animal events (ongoing updates log)
    const { data: events } = await supabase
      .from('animal_events')
      .select('*')
      .eq('animal_id', animal.id)
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({
      animal,
      events: events || [],
    })
  } catch (error: any) {
    console.error('Get animal error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


