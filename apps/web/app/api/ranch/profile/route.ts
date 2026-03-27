import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/ranch-auth'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  ranch_name: z.string().min(1).max(200).optional(),
  user_name: z.string().min(1).max(200).optional(),
  phone: z.string().max(30).optional(),
})

export async function GET(request: NextRequest) {
  const session = await validateSession(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseServerClient()

  const [ranchRes, userRes, animalCountRes, tagCountRes, onChainCountRes] = await Promise.all([
    supabase
      .from('ranches')
      .select('name, contact_email, phone, wallet_address, created_at')
      .eq('id', session.ranchId)
      .single(),
    supabase
      .from('ranch_users')
      .select('name, email, phone')
      .eq('id', session.userId)
      .single(),
    supabase
      .from('animals')
      .select('id', { count: 'exact', head: true })
      .eq('ranch_id', session.ranchId),
    supabase
      .from('tags')
      .select('id', { count: 'exact', head: true })
      .eq('ranch_id', session.ranchId),
    supabase
      .from('tags')
      .select('id', { count: 'exact', head: true })
      .eq('ranch_id', session.ranchId)
      .not('mint_tx_hash', 'is', null),
  ])

  if (ranchRes.error || !ranchRes.data) {
    return NextResponse.json({ error: 'Failed to load ranch profile' }, { status: 500 })
  }

  return NextResponse.json({
    ranch: ranchRes.data,
    user: userRes.data || null,
    stats: {
      animal_count: animalCountRes.count ?? 0,
      tag_count: tagCountRes.count ?? 0,
      on_chain_count: onChainCountRes.count ?? 0,
    },
  })
}

export async function PATCH(request: NextRequest) {
  if (!rateLimit(request, 10, 60000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  const session = await validateSession(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { ranch_name, user_name, phone } = patchSchema.parse(body)

    const supabase = getSupabaseServerClient()
    const updates: Promise<any>[] = []

    if (ranch_name) {
      updates.push(
        supabase
          .from('ranches')
          .update({ name: ranch_name })
          .eq('id', session.ranchId)
      )
    }

    if (user_name || phone !== undefined) {
      const userUpdate: Record<string, string> = {}
      if (user_name) userUpdate.name = user_name
      if (phone !== undefined) userUpdate.phone = phone
      updates.push(
        supabase
          .from('ranch_users')
          .update(userUpdate)
          .eq('id', session.userId)
      )
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: e.errors }, { status: 400 })
    }
    console.error('[RANCH] profile update error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
