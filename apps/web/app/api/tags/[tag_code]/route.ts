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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/85a8db88-d50f-4beb-ac4a-a5101446f485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/tags/[tag_code]/route.ts:GET',message:'tags GET received',data:{tag_code,tag_code_length:tag_code?.length},hypothesisId:'H1',timestamp:Date.now()})}).catch(()=>{})
    // #endregion

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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/85a8db88-d50f-4beb-ac4a-a5101446f485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/tags/[tag_code]/route.ts:after fetch',message:'tags DB result',data:{rowCount:rows?.length,tag_id:rows?.[0]?.id,tag_status:rows?.[0]?.status,tag_code_from_row:rows?.[0]?.tag_code},hypothesisId:'H1',timestamp:Date.now()})}).catch(()=>{})
    // #endregion

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
