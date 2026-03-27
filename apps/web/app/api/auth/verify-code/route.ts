import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { verifyCode, incrementAttempts, findOrCreateRanchUser, createSession, setSessionCookie } from '@/lib/ranch-auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  email: z.string().email().max(255),
  code: z.string().length(6),
  phone: z.string().max(30).optional(),
  name: z.string().max(200).optional(),
  purpose: z.enum(['claim', 'login']).default('claim'),
})

export async function POST(request: NextRequest) {
  if (!rateLimit(request, 10, 60000)) {
    return NextResponse.json({ error: 'Too many attempts. Please wait.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { email, code, phone, name, purpose } = schema.parse(body)

    const valid = await verifyCode(email, code, purpose)
    if (!valid) {
      await incrementAttempts(email, purpose)
      return NextResponse.json({ error: 'Invalid or expired code. Please try again.' }, { status: 400 })
    }

    const { userId, ranchId, walletAddress, isReturning } = await findOrCreateRanchUser(email, phone || null, name || null)

    const sessionToken = await createSession(userId)

    const response = NextResponse.json({
      success: true,
      user_id: userId,
      ranch_id: ranchId,
      wallet_address: walletAddress,
      is_returning: isReturning,
    })

    setSessionCookie(response, sessionToken)
    return response
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: e.errors }, { status: 400 })
    }
    console.error('[AUTH] verify-code error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
