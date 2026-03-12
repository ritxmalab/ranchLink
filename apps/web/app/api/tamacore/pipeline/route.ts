import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { verifyTamacoreAuth } from '@/lib/superadmin-auth'
import { searchNameSequence } from '@/lib/tamacore/entity-name-variants'

/**
 * GET /api/tamacore/pipeline — internal (superadmin or x-tamacore-key)
 * Query: status, category, limit, include_search_sequence=1 (adds search_name_sequence for each contact for batch lookup).
 */
export async function GET(request: NextRequest) {
  const authErr = verifyTamacoreAuth(request)
  if (authErr) return authErr
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const category = searchParams.get('category')
  const includeSearchSequence = searchParams.get('include_search_sequence') === '1' || searchParams.get('include_search_sequence') === 'true'
  const limit = Math.min(Number(searchParams.get('limit')) || 100, 500)

  const supabase = getSupabaseServerClient()
  let q = supabase
    .from('pipeline_contacts')
    .select('id, list_order, legal_name, contact, location, category, herd_type, estimated_herd, status, created_at, updated_at')
    .order('list_order', { ascending: true })
    .limit(limit)

  if (status) q = q.eq('status', status)
  if (category) q = q.eq('category', category)

  const { data, error } = await q

  if (error) {
    console.error('[TAMACORE] pipeline list error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const contacts = (data ?? []) as Array<Record<string, unknown> & { legal_name?: string }>
  if (includeSearchSequence) {
    for (const c of contacts) {
      ;(c as Record<string, unknown>).search_name_sequence = searchNameSequence(c.legal_name ?? '')
    }
  }
  return NextResponse.json({ contacts })
}
