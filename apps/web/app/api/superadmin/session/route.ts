import { NextRequest, NextResponse } from 'next/server'
import { isSuperadminAuthenticated } from '@/lib/superadmin-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authenticated = isSuperadminAuthenticated(request)
  return NextResponse.json({ authenticated })
}
