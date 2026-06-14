import { createClient } from "@supabase/supabase-js";

// Client ini dipakai khusus di Server Actions / Backend untuk berinteraksi dengan DB dan Storage.
// Menggunakan SERVICE_ROLE_KEY agar bisa menembus RLS (terutama berguna untuk Storage yang default-nya ada RLS).
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
