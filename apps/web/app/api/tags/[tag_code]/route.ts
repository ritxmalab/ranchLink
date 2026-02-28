import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

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
    const supabase = getSupabaseServerClient()

    const { data: tag, error } = await supabase
      .from('tags')
      .select(`
        *,
        animals (
          public_id,
          name,
          species,
          breed
        ),
        ranches (
          id,
          name
        )
      `)
      .eq('tag_code', tag_code)
      .single()

    if (error || !tag) {
      return NextResponse.json(
        { error: 'Tag not found', supabase_error: error?.message },
        { status: 404 }
      )
    }

    return NextResponse.json({ tag, _debug: { key_prefix: process.env.SUPABASE_SERVICE_KEY?.substring(0, 15) } })
  } catch (error: any) {
    console.error('Get tag error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get tag' },
      { status: 500 }
    )
  }
}

