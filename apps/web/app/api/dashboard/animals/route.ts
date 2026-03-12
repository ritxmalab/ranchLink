import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { verifySuperadminAuth } from '@/lib/superadmin-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/animals
 * Returns all animals (v1.0) so the dashboard always shows every claimed animal.
 * Uses two sources and merges: animals table + animals linked from attached tags,
 * so no animal is ever missing due to relation or timing.
 */
export async function GET(request: NextRequest) {
  const authError = verifySuperadminAuth(request)
  if (authError) return authError

  try {
    const supabase = getSupabaseServerClient()

    const selectSpec = `
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
    `

    // 1) All animals ordered by created_at (primary source)
    const { data: animalsFromTable, error: err1 } = await supabase
      .from('animals')
      .select(selectSpec)
      .order('created_at', { ascending: false })

    if (err1) {
      console.error('Error fetching animals:', err1)
      return NextResponse.json({ error: err1.message }, { status: 500 })
    }

    const byId = new Map<string, typeof animalsFromTable[0]>()
    for (const a of animalsFromTable || []) {
      byId.set(a.id, a)
    }

    // 2) Any animal linked from an attached tag that wasn't in the first result (defensive)
    const { data: attachedTags, error: err2 } = await supabase
      .from('tags')
      .select('animal_id')
      .eq('status', 'attached')
      .not('animal_id', 'is', null)

    if (!err2 && attachedTags?.length) {
      const animalIds = [...new Set(attachedTags.map(t => t.animal_id).filter(Boolean))]
      const missingIds = animalIds.filter(id => !byId.has(id))
      if (missingIds.length) {
        const { data: extraAnimals, error: err3 } = await supabase
          .from('animals')
          .select(selectSpec)
          .in('id', missingIds)
        if (!err3 && extraAnimals?.length) {
          for (const a of extraAnimals) {
            byId.set(a.id, a)
          }
        }
      }
    }

    const animals = Array.from(byId.values()).sort(
      (a, b) => new Date((b as any).created_at).getTime() - new Date((a as any).created_at).getTime()
    )

    const res = NextResponse.json({ animals })
    res.headers.set('Cache-Control', 'no-store, must-revalidate')
    res.headers.set('Pragma', 'no-cache')
    return res
  } catch (error: any) {
    console.error('Dashboard animals error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch animals',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

