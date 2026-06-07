import { createClient } from '@supabase/supabase-js'

// Service role client — samo za server-side admin operacije
// Nikoli ne eksponirati na client!
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
