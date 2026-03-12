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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d1bab796-07e5-40b1-a8e1-d8929352e341',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'da8bc1'},body:JSON.stringify({sessionId:'da8bc1',runId:'auth-audit-pre',hypothesisId:'H2',location:'api/superadmin/login/route.ts:POST:start',message:'Superadmin login attempt',data:{hasEnvPassword:Boolean(process.env.SUPERADMIN_PASSWORD),hasEnvUsername:Boolean(process.env.SUPERADMIN_USERNAME),providedUsernameLength:typeof username==='string'?username.length:0,providedPasswordLength:typeof password==='string'?password.length:0},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  const normalizedUsername = typeof username === 'string' ? username.trim().toLowerCase() : ''
  if (password !== correct || normalizedUsername !== expectedUsername) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d1bab796-07e5-40b1-a8e1-d8929352e341',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'da8bc1'},body:JSON.stringify({sessionId:'da8bc1',runId:'auth-audit-pre',hypothesisId:'H2',location:'api/superadmin/login/route.ts:POST:reject',message:'Superadmin login rejected',data:{reason:'invalid_credentials'},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d1bab796-07e5-40b1-a8e1-d8929352e341',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'da8bc1'},body:JSON.stringify({sessionId:'da8bc1',runId:'auth-audit-pre',hypothesisId:'H3',location:'api/superadmin/login/route.ts:POST:success',message:'Superadmin login success and cookie set',data:{cookieHttpOnly:true,cookieMaxAgeHours:12},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return response
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('rl_superadmin')
  return response
}
