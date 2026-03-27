import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { checkExistingUser } from '@/lib/ranch-auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  email: z.string().email().max(255),
  phone: z.string().max(30).optional(),
})

export async function POST(request: NextRequest) {
  if (!rateLimit(request, 10, 60000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { email, phone } = schema.parse(body)

    const result = await checkExistingUser(email, phone)

    return NextResponse.json({
      exists: result.exists,
      ...(result.ranchName && { ranch_name: result.ranchName }),
    })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: e.errors }, { status: 400 })
    }
    console.error('[AUTH] check-existing error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
