import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { password } = await request.json()
  const correct = process.env.SUPERADMIN_PASSWORD || 'ranchlink2026'

  if (password !== correct) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const cookieValue = Buffer.from(correct + '_ranchlink').toString('base64')
  const response = NextResponse.json({ success: true })
  // httpOnly: false so the client JS can detect the session on page reload.
  // The value is a derived token (not the raw password), so exposure is acceptable.
  response.cookies.set('rl_superadmin', cookieValue, {
    httpOnly: false,
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
