import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { verifySuperadminAuth } from '@/lib/superadmin-auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const assembleSchema = z.object({
  tag_id: z.string().uuid(),
  action: z.enum(['assemble', 'push_to_inventory', 'ship', 'mark_demo', 'mark_for_sale', 'mark_sold']),
  assembled_by: z.string().max(100).optional(),
})

/**
 * POST /api/superadmin/assemble
 * Advances a tag through the assembly pipeline:
 *   assemble         → status: assembled  (physical QR + 3D tag joined)
 *   push_to_inventory → status: in_inventory (ready for sale/gift)
 *   ship             → status: shipped    (dispatched — triggered from Inventory, not Assemble)
 */
export async function POST(request: NextRequest) {
  const authError = verifySuperadminAuth(request)
  if (authError) return authError

  if (!rateLimit(request, 30, 60000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body = await request.json()
  let validated: z.infer<typeof assembleSchema>
  try {
    validated = assembleSchema.parse(body)
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: e.errors }, { status: 400 })
    }
    throw e
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const now = new Date().toISOString()
  const update: Record<string, any> = {}

  if (validated.action === 'assemble') {
    update.assembled_at = now
    update.assembled_by = validated.assembled_by || 'superadmin'
    update.status = 'assembled'
  } else if (validated.action === 'push_to_inventory') {
    update.status = 'in_inventory'
  } else if (validated.action === 'mark_demo') {
    update.status = 'demo'
  } else if (validated.action === 'mark_for_sale') {
    update.status = 'for_sale'
  } else if (validated.action === 'mark_sold') {
    update.status = 'sold'
  } else {
    // ship
    update.shipped_at = now
    update.status = 'shipped'
  }

  const res = await fetch(
    `${supabaseUrl}/rest/v1/tags?id=eq.${validated.tag_id}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(update),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: text || 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ success: true, action: validated.action })
}

/**
 * GET /api/superadmin/assemble
 * Returns all tags in the assemble workflow (on_chain_unclaimed or assembled).
 * Uses direct REST fetch to avoid JS client connection pool staleness.
 */
export async function GET(request: NextRequest) {
  const authError = verifySuperadminAuth(request)
  if (authError) return authError

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ranch-link.vercel.app'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const res = await fetch(
    `${supabaseUrl}/rest/v1/tags?status=in.(on_chain_unclaimed,pre_identity,assembled)&select=id,tag_code,token_id,mint_tx_hash,contract_address,status,chain,assembled_at,shipped_at,assembled_by,created_at,batch_id,metadata_cid&order=created_at.desc`,
    {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Cache-Control': 'no-cache, no-store',
      },
      cache: 'no-store',
    }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  const tags = await res.json()

  const enriched = (tags || []).map((t: any) => ({
    ...t,
    base_qr_url: `${appUrl}/t/${t.tag_code}`,
  }))

  return NextResponse.json({ tags: enriched })
}
