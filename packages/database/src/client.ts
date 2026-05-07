import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type ClientOptions = {
  url: string
  anonKey: string
}

let singleton: SupabaseClient | null = null
let currentSignature: string | null = null

export function getSupabaseClient(options: ClientOptions): SupabaseClient {
  const url = options.url.trim()
  const anonKey = options.anonKey.trim()

  if (!url) {
    throw new Error('VITE_SUPABASE_URL is required.')
  }

  if (!anonKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY is required.')
  }

  const signature = `${url}::${anonKey}`

  if (!singleton || currentSignature !== signature) {
    singleton = createClient(url, anonKey)
    currentSignature = signature
  }

  return singleton
}

export function resetSupabaseClientForTests() {
  singleton = null
  currentSignature = null
}
