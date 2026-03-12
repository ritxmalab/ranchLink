import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

const SUPERADMIN_COOKIE = 'rl_superadmin'
const SESSION_TTL_SECONDS = 60 * 60 * 12 // 12h

function getSessionSecret(): string {
  const envSecret = process.env.SUPERADMIN_SESSION_SECRET
  if (envSecret && envSecret.length >= 32) return envSecret
  // Fallback to configured admin password only when explicit session secret is absent.
  // Never hardcode defaults in source.
  return process.env.SUPERADMIN_PASSWORD || ''
}

function sign(payload: string): string {
  const secret = getSessionSecret()
  if (!secret) return ''
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function encodePayload(data: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(data), 'utf8').toString('base64url')
}

function decodePayload(raw: string): any | null {
  try {
    return JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

export function makeSuperadminSessionToken(): string {
  if (!getSessionSecret()) return ''
  const now = Math.floor(Date.now() / 1000)
  const payload = encodePayload({ iat: now, exp: now + SESSION_TTL_SECONDS, v: 1 })
  const signature = sign(payload)
  if (!signature) return ''
  return `${payload}.${signature}`
}

export function isValidSuperadminSessionToken(token: string | undefined): boolean {
  if (!token || !token.includes('.')) return false
  const [payloadB64, providedSig] = token.split('.', 2)
  if (!payloadB64 || !providedSig) return false

  const expectedSig = sign(payloadB64)
  try {
    const a = Buffer.from(providedSig)
    const b = Buffer.from(expectedSig)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false
  } catch {
    return false
  }

  const payload = decodePayload(payloadB64)
  if (!payload || typeof payload.exp !== 'number') return false
  return payload.exp > Math.floor(Date.now() / 1000)
}

export function getSuperadminCookieToken(request: NextRequest): string | undefined {
  return request.cookies.get(SUPERADMIN_COOKIE)?.value
}

export function isSuperadminAuthenticated(request: NextRequest): boolean {
  const token = getSuperadminCookieToken(request)
  return isValidSuperadminSessionToken(token)
}

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
  const isAuthed = isSuperadminAuthenticated(request)
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
