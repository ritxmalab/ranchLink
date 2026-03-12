import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { verifyTamacoreAuth } from '@/lib/superadmin-auth'

type SnapshotRow = {
  pipeline_contact_id: string
  entity_name?: string
  taxpayer_number?: string
  mailing_address?: string
  mailing_city?: string
  mailing_state?: string
  mailing_zip?: string
  right_to_transact?: string
  state_of_formation?: string
  sos_registration_status?: string
  effective_sos_date?: string
  sos_file_number?: string
  registered_agent_name?: string
  registered_office_address?: string
  registered_office_city?: string
  registered_office_state?: string
  registered_office_zip?: string
  pir_year?: string
  pir_title?: string
  pir_name_and_address?: string
  zip_within_50_mi_atx?: boolean
  address_validated?: boolean
  raw_json?: object
}

/**
 * POST /api/tamacore/comptroller/batch — internal (superadmin or x-tamacore-key)
 * Body: { snapshots: SnapshotRow[] }
 * Inserts all snapshots in one go for "plug all at once" after batch lookup.
 */
export async function POST(request: NextRequest) {
  const authErr = verifyTamacoreAuth(request)
  if (authErr) return authErr
  let body: { snapshots?: SnapshotRow[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON body required' }, { status: 400 })
  }
  const snapshots = body.snapshots
  if (!Array.isArray(snapshots) || snapshots.length === 0) {
    return NextResponse.json({ error: 'snapshots array required (non-empty)' }, { status: 400 })
  }

  const supabase = getSupabaseServerClient()
  const rows = snapshots.map((s) => {
    if (!s.pipeline_contact_id) throw new Error('Each snapshot must have pipeline_contact_id')
    return {
      pipeline_contact_id: s.pipeline_contact_id,
      entity_name: s.entity_name ?? null,
      taxpayer_number: s.taxpayer_number ?? null,
      mailing_address: s.mailing_address ?? null,
      mailing_city: s.mailing_city ?? null,
      mailing_state: s.mailing_state ?? null,
      mailing_zip: s.mailing_zip ?? null,
      right_to_transact: s.right_to_transact ?? null,
      state_of_formation: s.state_of_formation ?? null,
      sos_registration_status: s.sos_registration_status ?? null,
      effective_sos_date: s.effective_sos_date ?? null,
      sos_file_number: s.sos_file_number ?? null,
      registered_agent_name: s.registered_agent_name ?? null,
      registered_office_address: s.registered_office_address ?? null,
      registered_office_city: s.registered_office_city ?? null,
      registered_office_state: s.registered_office_state ?? null,
      registered_office_zip: s.registered_office_zip ?? null,
      pir_year: s.pir_year ?? null,
      pir_title: s.pir_title ?? null,
      pir_name_and_address: s.pir_name_and_address ?? null,
      zip_within_50_mi_atx: s.zip_within_50_mi_atx === true || s.zip_within_50_mi_atx === 'true',
      address_validated: s.address_validated === true || s.address_validated === 'true',
      raw_json: s.raw_json ?? null,
    }
  })

  const { data, error } = await supabase.from('comptroller_snapshots').insert(rows).select('id, pipeline_contact_id, entity_name, mailing_zip, created_at')

  if (error) {
    console.error('[TAMACORE] comptroller batch insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ inserted: data?.length ?? 0, snapshots: data })
}
