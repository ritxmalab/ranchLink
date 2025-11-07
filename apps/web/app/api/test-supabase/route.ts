import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Test endpoint to verify Supabase connection
 * GET /api/test-supabase
 */
export async function GET() {
  try {
    const supabase = getSupabaseServerClient()
    // Test connection by querying a simple table
    const { data, error } = await supabase
      .from('owners')
      .select('count')
      .limit(1)

    if (error) {
      // If table doesn't exist, that's OK - migrations haven't run yet
      if (error.code === '42P01') {
        return NextResponse.json({
          success: false,
          connected: true,
          message: 'Supabase connected, but tables not created yet. Run migrations first.',
          error: error.message,
        })
      }

      return NextResponse.json({
        success: false,
        connected: false,
        message: 'Supabase connection error',
        error: error.message,
      })
    }

    return NextResponse.json({
      success: true,
      connected: true,
      message: 'Supabase connected successfully!',
      data: data,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      connected: false,
      message: 'Failed to connect to Supabase',
      error: error.message,
    }, { status: 500 })
  }
}

