import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function createClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase env vars')
  }
  return createSupabaseClient(supabaseUrl, supabaseKey)
}

export function hasSupabaseConfig() {
  return !!(supabaseUrl && supabaseKey)
}
