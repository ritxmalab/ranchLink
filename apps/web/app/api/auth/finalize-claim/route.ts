import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { verifyFinalizeToken, verifyCode, incrementAttempts, findOrCreateRanchUser } from '@/lib/ranch-auth'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  token: z.string().min(1),
  email: z.string().email().max(255),
  code: z.string().length(6),
  phone: z.string().max(30).optional(),
  name: z.string().max(200).optional(),
})

export async function POST(request: NextRequest) {
  if (!rateLimit(request, 10, 60000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { token, email, code, phone, name } = schema.parse(body)

    const tokenData = verifyFinalizeToken(token)
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid or expired link. Please request a new one.' }, { status: 400 })
    }

    const valid = await verifyCode(email, code, 'claim')
    if (!valid) {
      await incrementAttempts(email, 'claim')
      return NextResponse.json({ error: 'Invalid or expired code. Please try again.' }, { status: 400 })
    }

    const { userId, ranchId, walletAddress } = await findOrCreateRanchUser(email, phone || null, name || null)

    const supabase = getSupabaseServerClient()

    const { data: tag, error: tagError } = await supabase
      .from('tags')
      .select('id, owner_user_id')
      .eq('tag_code', tokenData.tagCode)
      .single()

    if (tagError || !tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    if (tag.owner_user_id && tag.owner_user_id !== userId) {
      return NextResponse.json({ error: 'This tag has already been claimed by another user' }, { status: 409 })
    }

    const { error: updateError } = await supabase
      .from('tags')
      .update({ owner_user_id: userId, ranch_id: ranchId })
      .eq('id', tag.id)

    if (updateError) {
      console.error('[AUTH] finalize-claim tag update error:', updateError)
      return NextResponse.json({ error: 'Failed to link tag to your account' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      ranch_id: ranchId,
      wallet_address: walletAddress,
    })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: e.errors }, { status: 400 })
    }
    console.error('[AUTH] finalize-claim error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
