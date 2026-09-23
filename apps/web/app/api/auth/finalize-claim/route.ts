import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import {
  verifyFinalizeToken,
  verifyCode,
  incrementAttempts,
  findOrCreateRanchUser,
  createSession,
  setSessionCookie,
} from '@/lib/ranch-auth'
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
      .select('id, owner_user_id, public_id, animal_id')
      .eq('tag_code', tokenData.tagCode)
      .single()

    if (tagError || !tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    // The signed link is scoped to one animal; a tag re-attached to a different
    // animal since the link was issued must not be claimable with it.
    if (tag.public_id !== tokenData.publicId) {
      return NextResponse.json({ error: 'Invalid or expired link. Please request a new one.' }, { status: 400 })
    }

    if (tag.owner_user_id && tag.owner_user_id !== userId) {
      return NextResponse.json({ error: 'This tag has already been claimed by another user' }, { status: 409 })
    }

    // Claim atomically: only an unowned tag (or one already owned by this user)
    // can be linked, so two concurrent finalizations cannot both win.
    const { data: claimed, error: updateError } = await supabase
      .from('tags')
      .update({ owner_user_id: userId, ranch_id: ranchId })
      .eq('id', tag.id)
      .or(`owner_user_id.is.null,owner_user_id.eq.${userId}`)
      .select('id')

    if (!updateError && (!claimed || claimed.length === 0)) {
      return NextResponse.json({ error: 'This tag has already been claimed by another user' }, { status: 409 })
    }

    if (updateError) {
      console.error('[AUTH] finalize-claim tag update error:', updateError)
      return NextResponse.json({ error: 'Failed to link tag to your account' }, { status: 500 })
    }

    if (tag.animal_id) {
      const { error: animalError } = await supabase
        .from('animals')
        .update({ ranch_id: ranchId })
        .eq('id', tag.animal_id)
      if (animalError) {
        console.error('[AUTH] finalize-claim animal update error:', animalError)
      }
    }

    // Sign the claimant in, matching the OTP login flow: the UI reloads straight
    // into the ranch-scoped view after finalizing.
    const response = NextResponse.json({
      success: true,
      ranch_id: ranchId,
      wallet_address: walletAddress,
    })
    setSessionCookie(response, await createSession(userId))
    return response
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: e.errors }, { status: 400 })
    }
    console.error('[AUTH] finalize-claim error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
