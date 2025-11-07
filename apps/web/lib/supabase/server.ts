import { createClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client
 * Uses service_role key for admin operations
 * ⚠️ NEVER expose this in frontend code!
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseServiceKey) {
  console.warn('⚠️ SUPABASE_SERVICE_KEY not set. Server-side operations may fail.')
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

