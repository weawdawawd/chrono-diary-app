import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Try both VITE_ prefix (for Vite apps) and standard env vars
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[v0] Missing Supabase environment variables');
  console.error('[v0] VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.error('[v0] SUPABASE_URL:', import.meta.env.SUPABASE_URL);
}

export const supabase = createClient<Database>(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder',
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
