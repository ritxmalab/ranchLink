import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSuperadminAuthenticated } from '@/lib/superadmin-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/tags
 * Get tags for the current logged-in ranch user (v1.0)
 * 
 * TODO: Filter by authenticated user's ranch_id
 * For now, returns all tags (will be filtered by ranch_id in production)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    const isAdmin = isSuperadminAuthenticated(request)

    // TODO: Get current user's ranch_id from Supabase Auth
    // const { data: { user } } = await supabase.auth.getUser()
    // const userRanchId = user?.user_metadata?.ranch_id
    // if (!userRanchId) {
    //   return NextResponse.json({ tags: [] })
    // }

    // Public mode: show only attached tags (demo-safe, no inventory leakage).
    // Admin mode: show all tags for operational inventory management.
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

    const query = isAdmin ? baseQuery : baseQuery.eq('status', 'attached')
    const { data: tags, error } = await query

    if (error) {
      console.error('Error fetching tags:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const res = NextResponse.json({ tags: tags || [], scope: isAdmin ? 'admin' : 'public' })
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

