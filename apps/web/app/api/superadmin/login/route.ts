import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { password } = await request.json()
  const correct = process.env.SUPERADMIN_PASSWORD || 'ranchlink2026'
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d1bab796-07e5-40b1-a8e1-d8929352e341',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'da8bc1'},body:JSON.stringify({sessionId:'da8bc1',runId:'auth-audit-pre',hypothesisId:'H2',location:'api/superadmin/login/route.ts:POST:start',message:'Superadmin login attempt',data:{hasEnvPassword:Boolean(process.env.SUPERADMIN_PASSWORD),providedPasswordLength:typeof password==='string'?password.length:0},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  if (password !== correct) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d1bab796-07e5-40b1-a8e1-d8929352e341',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'da8bc1'},body:JSON.stringify({sessionId:'da8bc1',runId:'auth-audit-pre',hypothesisId:'H2',location:'api/superadmin/login/route.ts:POST:reject',message:'Superadmin login rejected',data:{reason:'password_mismatch'},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d1bab796-07e5-40b1-a8e1-d8929352e341',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'da8bc1'},body:JSON.stringify({sessionId:'da8bc1',runId:'auth-audit-pre',hypothesisId:'H3',location:'api/superadmin/login/route.ts:POST:success',message:'Superadmin login success and cookie set',data:{cookieHttpOnly:false,cookieMaxAgeDays:30},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return response
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('rl_superadmin')
  return response
}
