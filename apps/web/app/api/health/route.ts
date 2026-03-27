import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { verifySuperadminAuth } from '@/lib/superadmin-auth'

/**
 * Health check endpoint. Public response is minimal; superadmin gets full diagnostics.
 * GET /api/health
 */
export async function GET(request: NextRequest) {
  const isSuperadmin = !verifySuperadminAuth(request)

  if (!isSuperadmin) {
    // Public health: minimal — don't leak env/infra details
    try {
      const supabase = getSupabaseServerClient()
      await supabase.from('tags').select('id').limit(1)
      return NextResponse.json({ status: 'healthy', timestamp: new Date().toISOString() })
    } catch {
      return NextResponse.json({ status: 'unhealthy', timestamp: new Date().toISOString() }, { status: 500 })
    }
  }

  const checks: Record<string, { status: 'ok' | 'error'; message: string }> = {}

  checks.env = {
    status: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY ? 'ok' : 'error',
    message: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
      ? 'Required env vars present'
      : 'Missing required environment variables',
  }

  try {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase.from('tags').select('id').limit(1)
    checks.supabase = error
      ? { status: 'error', message: `Supabase error: ${error.message}` }
      : { status: 'ok', message: 'Connected' }
  } catch (err: any) {
    checks.supabase = { status: 'error', message: `Connection failed: ${err.message}` }
  }

  const allOk = Object.values(checks).every(c => c.status === 'ok')

  return NextResponse.json({
    status: allOk ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
  }, { status: allOk ? 200 : 500 })
}

