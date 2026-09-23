import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { verifySuperadminAuth } from '@/lib/superadmin-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * GET /api/superadmin/export
 *
 * Superadmin-only snapshot of the operational dataset (tags, animals, events,
 * ranches, batches, orders) as a downloadable JSON backup.
 *
 * Secrets are never exported: claim tokens, custodial wallet keys, sessions,
 * verification codes and order view secrets are excluded by projection.
 */

type TableSpec = { table: string; columns: string; orderBy?: string }

const EXPORT_TABLES: TableSpec[] = [
  {
    table: 'ranches',
    columns: 'id, name, contact_email, phone, wallet_address, created_at, updated_at',
    orderBy: 'created_at',
  },
  {
    table: 'batches',
    columns: 'id, name, batch_name, model, material, color, chain, count, target_ranch_id, status, created_at',
    orderBy: 'created_at',
  },
  {
    table: 'tags',
    columns:
      'id, tag_code, chain, contract_address, token_id, mint_tx_hash, batch_id, ranch_id, animal_id, status, activation_state, metadata_cid, metadata_tx_hash, public_id, assembled_at, shipped_at, created_at, updated_at',
    orderBy: 'created_at',
  },
  {
    table: 'animals',
    columns: '*',
    orderBy: 'created_at',
  },
  {
    table: 'animal_events',
    columns: 'id, animal_id, event_type, notes, weight, event_date, metadata, ipfs_cid, tx_hash, created_at',
    orderBy: 'created_at',
  },
  {
    table: 'stripe_orders',
    columns:
      'id, order_number, stripe_checkout_session_id, customer_email, customer_name, tier, tag_count, amount_total, currency, payment_status, fulfillment_status, status, carrier, tracking_number, created_at',
    orderBy: 'created_at',
  },
]

const PAGE_SIZE = 1000

export async function GET(request: NextRequest) {
  const authError = verifySuperadminAuth(request)
  if (authError) return authError

  const supabase = getSupabaseServerClient()
  const data: Record<string, unknown[]> = {}
  const skipped: Record<string, string> = {}

  for (const spec of EXPORT_TABLES) {
    const rows: unknown[] = []
    let from = 0
    for (;;) {
      let query = supabase.from(spec.table).select(spec.columns).range(from, from + PAGE_SIZE - 1)
      if (spec.orderBy) query = query.order(spec.orderBy, { ascending: true })
      const { data: page, error } = await query
      if (error) {
        skipped[spec.table] = error.message
        break
      }
      rows.push(...(page || []))
      if (!page || page.length < PAGE_SIZE) break
      from += PAGE_SIZE
    }
    if (!skipped[spec.table]) data[spec.table] = rows
  }

  const snapshot = {
    exported_at: new Date().toISOString(),
    chain_id: process.env.NEXT_PUBLIC_CHAIN_ID || null,
    schema_version: 'v2',
    counts: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])),
    skipped_tables: skipped,
    data,
  }

  const filename = `ranchlink-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')}.json`

  return new NextResponse(JSON.stringify(snapshot, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store, must-revalidate',
    },
  })
}
