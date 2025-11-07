import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type AnySupabaseClient = SupabaseClient<any, string, any>

function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables')
  }

  return { url, anonKey }
}

let cachedPublicClient: AnySupabaseClient | null = null

export function getSupabaseClient(): AnySupabaseClient {
  if (!cachedPublicClient) {
    const { url, anonKey } = getSupabasePublicConfig()
    cachedPublicClient = createClient(url, anonKey)
  }
  return cachedPublicClient
}

export function createServerClient(): AnySupabaseClient {
  const { url } = getSupabasePublicConfig()
  const serviceKey = process.env.SUPABASE_SERVICE_KEY

  if (!serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_KEY environment variable')
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

