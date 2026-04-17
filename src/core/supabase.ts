import { createClient } from '@supabase/supabase-js';

/**
 * Universal Supabase Client.
 * Use this for standard operations tied to the user's session.
 */
export const supabase = (() => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined' || process.env.NODE_ENV === 'production') {
      console.warn('Supabase environment variables are missing.');
    }
    // Return a dummy client or handle gracefully to prevent crash on evaluation
    return createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
})();

/**
 * Admin Supabase Client.
 * Use this only in server-side environments for managing users/bypassing RLS.
 * Requires SUPABASE_SERVICE_ROLE_KEY.
 */
export const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY or URL is missing. Admin operations are unavailable.');
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
