import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { password } = await request.json()
  const correct = process.env.SUPERADMIN_PASSWORD || 'ranchlink2026'

  if (password !== correct) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const cookieValue = Buffer.from(correct + '_ranchlink').toString('base64')
  const response = NextResponse.json({ success: true })
  response.cookies.set('rl_superadmin', cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })
  return response
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('rl_superadmin')
  return response
}
