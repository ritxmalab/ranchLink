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
        tags (
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
          name,
          contact_email
        )
      `)
      .eq('public_id', publicId)
      .single()

    if (error || !animal) {
      return NextResponse.json({ error: 'Animal not found' }, { status: 404 })
    }

    // Get events
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('public_id', publicId)
      .order('created_at', { ascending: false })
      .limit(50)

    // Get anchors
    const { data: anchors } = await supabase
      .from('anchors')
      .select('*')
      .eq('public_id', publicId)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      animal,
      events: events || [],
      anchors: anchors || [],
    })
  } catch (error: any) {
    console.error('Get animal error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


