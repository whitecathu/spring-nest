/// <reference types="vite/client" />

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabaseDisabled = import.meta.env.VITE_DISABLE_SUPABASE === 'true';

// Returns null if env vars not configured (guest mode)
export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseDisabled || !supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase: SupabaseClient | null =
  !supabaseDisabled && supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export function isSupabaseConfigured(): boolean {
  return !supabaseDisabled && !!supabaseUrl && !!supabaseAnonKey;
}
