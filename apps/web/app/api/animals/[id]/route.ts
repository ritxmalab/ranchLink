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

    // Get animal with owner info
    const { data: animal, error } = await supabase
      .from('animals')
      .select(`
        *,
        owners (
          id,
          basename,
          email
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


