import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { createVerificationCode, sendVerificationEmail } from '@/lib/ranch-auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  email: z.string().email().max(255),
  phone: z.string().max(30).optional(),
  purpose: z.enum(['claim', 'login']).default('claim'),
})

export async function POST(request: NextRequest) {
  if (!rateLimit(request, 5, 60000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { email, phone, purpose } = schema.parse(body)

    const code = await createVerificationCode(email, phone || null, purpose)
    if (!code) {
      return NextResponse.json({ error: 'Failed to generate verification code' }, { status: 500 })
    }

    const sent = await sendVerificationEmail(email, code)
    if (!sent) {
      return NextResponse.json({ error: 'Failed to send verification email. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Verification code sent to your email' })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email address', details: e.errors }, { status: 400 })
    }
    console.error('[AUTH] send-code error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
