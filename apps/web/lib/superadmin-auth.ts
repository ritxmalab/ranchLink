import { NextRequest, NextResponse } from 'next/server'

/**
 * Verify the superadmin cookie on API routes.
 * Returns null if authenticated, or a 401 NextResponse if not.
 *
 * Usage:
 *   const authError = verifySuperadminAuth(request)
 *   if (authError) return authError
 */
export function verifySuperadminAuth(request: NextRequest): NextResponse | null {
  const cookieHeader = request.headers.get('cookie') || ''
  // Exact key match (not substring) to prevent spoofing
  const isAuthed = cookieHeader
    .split(';')
    .some(c => c.trim().startsWith('rl_superadmin=') && c.trim().split('=')[1]?.trim().length > 0)

  if (!isAuthed) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Superadmin authentication required' },
      { status: 401 }
    )
  }
  return null
}

/**
 * Verify TAMACORE access: superadmin cookie OR internal key (for scripted agent).
 * Use on routes that the agent may call from a script (e.g. batch comptroller).
 */
export function verifyTamacoreAuth(request: NextRequest): NextResponse | null {
  const key = request.headers.get('x-tamacore-key') ?? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const internalKey = process.env.TAMACORE_INTERNAL_KEY
  if (internalKey && key === internalKey) return null
  return verifySuperadminAuth(request)
}
