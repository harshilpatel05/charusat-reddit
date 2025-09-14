import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Create a Supabase client with the service role key (server only!)
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
