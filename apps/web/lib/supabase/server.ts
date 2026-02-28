import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type AnySupabaseClient = SupabaseClient<any, string, any>

function getServerConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_KEY environment variable')
  }

  return { url, serviceKey }
}

export function getSupabaseServerClient(): AnySupabaseClient {
  // Do NOT cache — Vercel serverless can reuse module instances across requests
  // with stale env vars baked in. Always create fresh to pick up current env.
  const { url, serviceKey } = getServerConfig()
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

