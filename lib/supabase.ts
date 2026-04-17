import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Universal Supabase Client.
 * Use this for standard operations tied to the user's session.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Admin Supabase Client.
 * Use this only in server-side environments for managing users/bypassing RLS.
 * Requires SUPABASE_SERVICE_ROLE_KEY.
 */
export const getSupabaseAdmin = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing. Admin operations are unavailable.');
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
