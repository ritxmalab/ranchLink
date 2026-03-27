import { NextRequest, NextResponse } from 'next/server'
import { verifySuperadminAuth } from '@/lib/superadmin-auth'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { generateFinalizeToken } from '@/lib/ranch-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authError = verifySuperadminAuth(request)
  if (authError) return authError

  try {
    const supabase = getSupabaseServerClient()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://ranch-link.vercel.app'

    const { data: tags, error } = await supabase
      .from('tags')
      .select('id, tag_code, public_id')
      .eq('status', 'attached')
      .is('owner_user_id', null)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
    }

    const result = (tags || []).map((tag) => {
      const token = generateFinalizeToken(tag.tag_code, tag.public_id || tag.id)
      return {
        tag_code: tag.tag_code,
        public_id: tag.public_id,
        finalize_url: `${baseUrl}/t/${tag.tag_code}?finalize=${token}`,
      }
    })

    return NextResponse.json({ tags: result })
  } catch (error: any) {
    console.error('[SUPERADMIN] finalize-links error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
