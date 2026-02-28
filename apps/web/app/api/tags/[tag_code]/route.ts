import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/tags/[tag_code]
 * Get tag information by tag_code
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tag_code: string } }
) {
  try {
    const { tag_code } = params
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_KEY
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Use direct REST API to bypass any JS client connection pooling
    const res = await fetch(
      `${supabaseUrl}/rest/v1/tags?tag_code=eq.${encodeURIComponent(tag_code)}&select=*,animals(public_id,name,species,breed),ranches(id,name)&limit=1`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Database error', status: res.status }, { status: 500 })
    }

    const rows = await res.json()
    
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    const tag = rows[0]
    return NextResponse.json({ tag })
  } catch (error: any) {
    console.error('Get tag error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get tag' },
      { status: 500 }
    )
  }
}
