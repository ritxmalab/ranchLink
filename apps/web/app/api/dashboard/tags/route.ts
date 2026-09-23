import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSuperadminAuthenticated } from '@/lib/superadmin-auth'
import { validateSession } from '@/lib/ranch-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/tags
 *
 * Scope depends on the caller:
 *   admin  — every tag, for inventory operations
 *   ranch  — only the signed-in ranch's tags
 *   public — attached tags only (demo-safe, no inventory leakage)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    const isAdmin = isSuperadminAuthenticated(request)
    const session = isAdmin ? null : await validateSession(request)
    const baseQuery = supabase
      .from('tags')
      .select(`
        tag_code,
        token_id,
        mint_tx_hash,
        chain,
        contract_address,
        status,
        activation_state,
        animal_id,
        animals (
          public_id,
          name
        )
      `)
      .order('created_at', { ascending: false })

    const query = isAdmin
      ? baseQuery
      : session
      ? baseQuery.eq('ranch_id', session.ranchId)
      : baseQuery.eq('status', 'attached')
    const { data: tags, error } = await query

    if (error) {
      console.error('Error fetching tags:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const res = NextResponse.json({ tags: tags || [], scope: isAdmin ? 'admin' : session ? 'ranch' : 'public' })
    res.headers.set('Cache-Control', 'no-store, must-revalidate')
    res.headers.set('Pragma', 'no-cache')
    return res
  } catch (error: any) {
    console.error('Dashboard tags error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch tags',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

