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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d1bab796-07e5-40b1-a8e1-d8929352e341',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'da8bc1'},body:JSON.stringify({sessionId:'da8bc1',runId:'auth-audit-pre',hypothesisId:'H1',location:'lib/superadmin-auth.ts:verifySuperadminAuth',message:'Superadmin auth check executed',data:{hasCookieHeader:Boolean(cookieHeader),cookieHeaderLength:cookieHeader.length,isAuthed},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  if (!isAuthed) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Superadmin authentication required' },
      { status: 401 }
    )
  }
  return null
}
