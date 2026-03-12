import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { verifySuperadminAuth } from '@/lib/superadmin-auth'

/**
 * GET /api/tamacore/activity — internal (superadmin only)
 */
export async function GET(request: NextRequest) {
  const authErr = verifySuperadminAuth(request)
  if (authErr) return authErr
  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 200)
  const contactId = searchParams.get('pipeline_contact_id')
  const actionType = searchParams.get('action_type')

  const supabase = getSupabaseServerClient()
  let q = supabase
    .from('agent_activity_log')
    .select(`
      id,
      pipeline_contact_id,
      action_type,
      step,
      payload,
      created_at
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (contactId) q = q.eq('pipeline_contact_id', contactId)
  if (actionType) q = q.eq('action_type', actionType)

  const { data, error } = await q

  if (error) {
    console.error('[TAMACORE] activity list error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ activities: data ?? [] })
}

/**
 * POST /api/tamacore/activity — internal (superadmin only)
 */
export async function POST(request: NextRequest) {
  const authErr = verifySuperadminAuth(request)
  if (authErr) return authErr
  let body: { pipeline_contact_id?: string; action_type: string; step?: string; payload?: Record<string, unknown> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON body required' }, { status: 400 })
  }
  const { pipeline_contact_id, action_type, step, payload } = body
  if (!action_type || typeof action_type !== 'string') {
    return NextResponse.json({ error: 'action_type required' }, { status: 400 })
  }

  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('agent_activity_log')
    .insert({
      pipeline_contact_id: pipeline_contact_id || null,
      action_type,
      step: step ?? null,
      payload: payload ?? null,
    })
    .select('id, pipeline_contact_id, action_type, step, payload, created_at')
    .single()

  if (error) {
    console.error('[TAMACORE] activity insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ activity: data })
}
