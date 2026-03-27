import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { createVerificationCode, sendVerificationEmail } from '@/lib/ranch-auth'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  email: z.string().email().max(255),
})

export async function POST(request: NextRequest) {
  if (!rateLimit(request, 5, 60000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  try {
    const { email } = schema.parse(await request.json())

    const supabase = getSupabaseServerClient()
    const { data: user } = await supabase
      .from('ranch_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (!user) {
      return NextResponse.json({ success: true, message: 'If an account exists, a code was sent.' })
    }

    const code = await createVerificationCode(email, null, 'login')
    if (!code) {
      return NextResponse.json({ error: 'Failed to send code' }, { status: 500 })
    }

    const sent = await sendVerificationEmail(email, code)
    if (!sent) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Verification code sent' })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
