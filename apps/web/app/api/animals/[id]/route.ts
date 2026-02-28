import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

// GET /api/animals/[id] - Get animal by public_id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const publicId = params.id
    const supabase = getSupabaseServerClient()

    // Get animal with tag and ranch info (v1.0 schema)
    const { data: animal, error } = await supabase
      .from('animals')
      .select(`
        *,
        photo_url,
        tags (
          tag_code,
          token_id,
          mint_tx_hash,
          chain,
          contract_address,
          status,
          activation_state,
          claim_token
        ),
        ranches (
          id,
          name,
          contact_email
        )
      `)
      .eq('public_id', publicId)
      .single()

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


