import { NextRequest, NextResponse } from 'next/server'
import { validateSession, clearSessionCookie } from '@/lib/ranch-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await validateSession(request)
  if (!session) {
    return NextResponse.json({ authenticated: false })
  }

  return NextResponse.json({
    authenticated: true,
    user_id: session.userId,
    ranch_id: session.ranchId,
    email: session.email,
    wallet_address: session.walletAddress,
  })
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  clearSessionCookie(response)
  return response
}
