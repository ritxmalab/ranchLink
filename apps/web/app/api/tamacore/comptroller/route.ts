import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { verifyTamacoreAuth } from '@/lib/superadmin-auth'

/**
 * POST /api/tamacore/comptroller — internal (superadmin or x-tamacore-key)
 */
export async function POST(request: NextRequest) {
  const authErr = verifyTamacoreAuth(request)
  if (authErr) return authErr
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON body required' }, { status: 400 })
  }
  const pipeline_contact_id = body.pipeline_contact_id as string | undefined
  if (!pipeline_contact_id) {
    return NextResponse.json({ error: 'pipeline_contact_id required' }, { status: 400 })
  }

  const supabase = getSupabaseServerClient()
  const row = {
    pipeline_contact_id,
    entity_name: (body.entity_name as string) ?? null,
    taxpayer_number: (body.taxpayer_number as string) ?? null,
    mailing_address: (body.mailing_address as string) ?? null,
    mailing_city: (body.mailing_city as string) ?? null,
    mailing_state: (body.mailing_state as string) ?? null,
    mailing_zip: (body.mailing_zip as string) ?? null,
    right_to_transact: (body.right_to_transact as string) ?? null,
    state_of_formation: (body.state_of_formation as string) ?? null,
    sos_registration_status: (body.sos_registration_status as string) ?? null,
    effective_sos_date: (body.effective_sos_date as string) ?? null,
    sos_file_number: (body.sos_file_number as string) ?? null,
    registered_agent_name: (body.registered_agent_name as string) ?? null,
    registered_office_address: (body.registered_office_address as string) ?? null,
    registered_office_city: (body.registered_office_city as string) ?? null,
    registered_office_state: (body.registered_office_state as string) ?? null,
    registered_office_zip: (body.registered_office_zip as string) ?? null,
    pir_year: (body.pir_year as string) ?? null,
    pir_title: (body.pir_title as string) ?? null,
    pir_name_and_address: (body.pir_name_and_address as string) ?? null,
    zip_within_50_mi_atx: body.zip_within_50_mi_atx === true || body.zip_within_50_mi_atx === 'true',
    address_validated: body.address_validated === true || body.address_validated === 'true',
    raw_json: (body.raw_json as object) ?? null,
  }

  const { data, error } = await supabase
    .from('comptroller_snapshots')
    .insert(row)
    .select('id, pipeline_contact_id, entity_name, mailing_zip, created_at')
    .single()

  if (error) {
    console.error('[TAMACORE] comptroller insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ snapshot: data })
}

/**
 * GET /api/tamacore/comptroller — internal (superadmin or x-tamacore-key)
 */
export async function GET(request: NextRequest) {
  const authErr = verifyTamacoreAuth(request)
  if (authErr) return authErr
  const contactId = request.nextUrl.searchParams.get('pipeline_contact_id')
  if (!contactId) {
    return NextResponse.json({ error: 'pipeline_contact_id required' }, { status: 400 })
  }

  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('comptroller_snapshots')
    .select('*')
    .eq('pipeline_contact_id', contactId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[TAMACORE] comptroller get error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ snapshot: data })
}
