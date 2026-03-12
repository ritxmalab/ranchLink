import { NextRequest, NextResponse } from 'next/server'
import { isSuperadminAuthenticated } from '@/lib/superadmin-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authenticated = isSuperadminAuthenticated(request)
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d1bab796-07e5-40b1-a8e1-d8929352e341',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'da8bc1'},body:JSON.stringify({sessionId:'da8bc1',runId:'auth-audit-pre',hypothesisId:'H5',location:'api/superadmin/session/route.ts:GET',message:'Superadmin session probe',data:{authenticated},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return NextResponse.json({ authenticated })
}
