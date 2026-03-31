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

  // stripe_orders — commerce / fulfillment (internal CRM + webhook idempotency)
  const commerceChecks: { name: string; select: string }[] = [
    { name: 'stripe_orders_fulfillment', select: 'fulfillment_status,shipping_address_json' },
    { name: 'stripe_orders_internal_crm', select: 'internal_notes,assigned_to' },
    { name: 'stripe_orders_email_idempotency', select: 'order_confirmation_sent_at,internal_ops_notified_at' },
    { name: 'stripe_orders_view_secret', select: 'order_view_secret' },
  ]
  for (const c of commerceChecks) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/stripe_orders?select=${encodeURIComponent(c.select)}&limit=1`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      })
      const data = await res.json()
      if (Array.isArray(data)) {
        results.push({ migration: c.name, status: 'already_exists' })
      } else if (data?.code === '42703' || data?.code === 'PGRST204') {
        const files =
          c.name === 'stripe_orders_fulfillment'
            ? 'ADD_STRIPE_ORDER_FULFILLMENT_FIELDS.sql'
            : c.name === 'stripe_orders_internal_crm'
              ? '008_STRIPE_ORDERS_INTERNAL_OPS.sql'
              : c.name === 'stripe_orders_email_idempotency'
                ? '009_STRIPE_WEBHOOK_EMAIL_IDEMPOTENCY.sql'
                : '010_ORDER_VIEW_SECRET.sql'
        results.push({
          migration: c.name,
          status: 'missing',
          error: `Run supabase/migrations/${files} in Supabase SQL Editor (then NOTIFY pgrst reload if needed).`,
        })
      } else {
        results.push({ migration: c.name, status: 'unknown', error: JSON.stringify(data) })
      }
    } catch (e: any) {
      results.push({ migration: c.name, status: 'check_failed', error: e.message })
    }
  }

  const sqlToRun = results
    .filter(r => r.status === 'missing')
    .map(r => r.error)
    .join('\n\n')

  return NextResponse.json({
    results,
    sql_to_run_manually: sqlToRun || null,
    note: sqlToRun
      ? 'Run each file listed in sql_to_run_manually in your Supabase SQL editor, then re-run this endpoint.'
      : 'All checked migrations appear present.',
    supabase_sql_editor: 'https://supabase.com/dashboard/project/utovzxpmfnzihurotqnv/sql/new',
    stripe_webhook: 'Stripe Dashboard → Developers → Webhooks → endpoint URL must be https://YOUR_DOMAIN/api/stripe/webhook with signing secret in STRIPE_WEBHOOK_SECRET',
  })
}
