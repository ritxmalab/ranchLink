import { NextRequest, NextResponse } from 'next/server'
import { makeSuperadminSessionToken } from '@/lib/superadmin-auth'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  if (!rateLimit(request, 8, 60000)) {
    return NextResponse.json({ error: 'Too many login attempts' }, { status: 429 })
  }

  const { username, password } = await request.json()
  const expectedUsername = process.env.SUPERADMIN_USERNAME?.trim().toLowerCase() || ''
  const correct = process.env.SUPERADMIN_PASSWORD || ''
  if (!expectedUsername || !correct) {
    return NextResponse.json({ error: 'Superadmin auth not configured' }, { status: 500 })
  }

  const normalizedUsername = typeof username === 'string' ? username.trim().toLowerCase() : ''
  if (password !== correct || normalizedUsername !== expectedUsername) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const cookieValue = makeSuperadminSessionToken()
  if (!cookieValue) {
    return NextResponse.json({ error: 'Superadmin session secret missing' }, { status: 500 })
  }
  const response = NextResponse.json({ success: true })
  // httpOnly + signed session token prevents client-side script spoofing.
  response.cookies.set('rl_superadmin', cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 12, // 12 hours
    path: '/',
  })
  return response
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('rl_superadmin')
  return response
}
