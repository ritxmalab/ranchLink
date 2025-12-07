import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

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

    // TODO: Get current user's ranch_id from Supabase Auth
    // const { data: { user } } = await supabase.auth.getUser()
    // const userRanchId = user?.user_metadata?.ranch_id
    // if (!userRanchId) {
    //   return NextResponse.json({ tags: [] })
    // }

    // For v1.0, fetch all tags (will be filtered by ranch_id in production)
    const { data: tags, error } = await supabase
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
      // .eq('ranch_id', userRanchId) // TODO: Uncomment when auth is implemented
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tags:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      tags: tags || [],
    })
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

