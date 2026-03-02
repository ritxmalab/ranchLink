import { NextRequest, NextResponse } from 'next/server'
import { verifySuperadminAuth } from '@/lib/superadmin-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const authError = verifySuperadminAuth(request)
  if (authError) return authError

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const results: { migration: string; status: string; error?: string }[] = []

  // Check if claim_token column exists in tags
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/tags?select=claim_token&limit=1`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    })
    const data = await res.json()
    if (Array.isArray(data)) {
      results.push({ migration: 'add_claim_token_to_tags', status: 'already_exists' })
    } else if (data?.code === '42703') {
      results.push({ migration: 'add_claim_token_to_tags', status: 'missing', error: 'ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS claim_token UUID;' })
    } else {
      results.push({ migration: 'add_claim_token_to_tags', status: 'unknown', error: JSON.stringify(data) })
    }
  } catch (e: any) {
    results.push({ migration: 'add_claim_token_to_tags', status: 'check_failed', error: e.message })
  }

  const sqlToRun = results
    .filter(r => r.status === 'missing')
    .map(r => r.error)
    .join('\n')

  return NextResponse.json({
    results,
    sql_to_run_manually: sqlToRun || null,
    note: sqlToRun ? 'Run the sql_to_run_manually in your Supabase SQL editor, then re-run this endpoint.' : 'All migrations up to date.',
    supabase_sql_editor: 'https://supabase.com/dashboard/project/utovzxpmfnzihurotqnv/sql/new',
  })
}
