import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Health check endpoint to diagnose connectivity issues
 * GET /api/health
 */
export async function GET() {
  const checks: Record<string, { status: 'ok' | 'error'; message: string }> = {}

  // Check environment variables
  checks.env = {
    status: 'ok',
    message: 'All environment variables present'
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    checks.env = {
      status: 'error',
      message: 'Missing NEXT_PUBLIC_SUPABASE_URL'
    }
  }

  if (!process.env.SUPABASE_SERVICE_KEY) {
    checks.env = {
      status: 'error',
      message: 'Missing SUPABASE_SERVICE_KEY'
    }
  }

  // Check Supabase connection
  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('devices')
      .select('count')
      .limit(1)

    if (error) {
      checks.supabase = {
        status: 'error',
        message: `Supabase error: ${error.message}`
      }
    } else {
      checks.supabase = {
        status: 'ok',
        message: 'Supabase connected successfully'
      }
    }
  } catch (err: any) {
    checks.supabase = {
      status: 'error',
      message: `Supabase connection failed: ${err.message}`
    }
  }

  const allOk = Object.values(checks).every(c => c.status === 'ok')

  return NextResponse.json({
    status: allOk ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  }, { status: allOk ? 200 : 500 })

}

