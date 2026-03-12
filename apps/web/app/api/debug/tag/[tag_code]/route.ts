import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { verifySuperadminAuth } from '@/lib/superadmin-auth'

// Lightweight debug endpoint to inspect a tag and its linked animal.
// GET /api/debug/tag/[tag_code]
export async function GET(
  request: NextRequest,
  { params }: { params: { tag_code: string } }
) {
  const authError = verifySuperadminAuth(request)
  if (authError) return authError

  try {
    const supabase = getSupabaseServerClient()
    const tagCode = params.tag_code

    const { data: tag, error } = await supabase
      .from('tags')
      .select(
        `
        id,
        tag_code,
        status,
        activation_state,
        token_id,
        contract_address,
        animal_id,
        public_id,
        ranch_id,
        animals (
          id,
          public_id,
          name,
          status,
          ranch_id,
          created_at
        )
      `
      )
      .eq('tag_code', tagCode)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    return NextResponse.json({ tag })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Debug tag lookup failed' },
      { status: 500 }
    )
  }
}
