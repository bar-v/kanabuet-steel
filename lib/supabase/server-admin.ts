import { createClient } from "@supabase/supabase-js";

// Karena RLS akan dinonaktifkan di Supabase, kita cukup pakai ANON key.
// Client ini dipakai khusus di Server Actions / Backend untuk berinteraksi dengan DB.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
