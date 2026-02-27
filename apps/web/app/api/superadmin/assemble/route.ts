import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const assembleSchema = z.object({
  tag_id: z.string().uuid(),
  action: z.enum(['assemble', 'ship']),
  assembled_by: z.string().max(100).optional(),
})

/**
 * POST /api/superadmin/assemble
 * Marks a tag as assembled or shipped.
 */
export async function POST(request: NextRequest) {
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

  const supabase = getSupabaseServerClient()
  const now = new Date().toISOString()

  const update: Record<string, any> = {}
  if (validated.action === 'assemble') {
    update.assembled_at = now
    update.assembled_by = validated.assembled_by || 'superadmin'
    update.status = 'assembled'
  } else {
    update.shipped_at = now
    update.status = 'shipped'
  }

  const { error } = await supabase
    .from('tags')
    .update(update)
    .eq('id', validated.tag_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, action: validated.action })
}

/**
 * GET /api/superadmin/assemble
 * Returns all tags ready for assembly (on_chain_unclaimed) or assembled.
 */
export async function GET(request: NextRequest) {
  const supabase = getSupabaseServerClient()

  const { data: tags, error } = await supabase
    .from('tags')
    .select('id, tag_code, token_id, contract_address, status, chain, assembled_at, shipped_at, assembled_by, created_at, batch_id')
    .in('status', ['on_chain_unclaimed', 'assembled', 'shipped'])
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ tags: tags || [] })
}
