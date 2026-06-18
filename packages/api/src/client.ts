import { createClient as _createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export type AppSupabaseClient = ReturnType<typeof _createClient<Database>>;

/**
 * Factory — call once per platform with the platform's env vars.
 *
 * Web:    createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, ...)
 * Mobile: createSupabaseClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, ...)
 */
export function createSupabaseClient(url: string, anonKey: string): AppSupabaseClient {
  if (!url || !anonKey) {
    throw new Error(
      'Supabase URL and anon key are required. Check your .env file.'
    );
  }
  return _createClient<Database>(url, anonKey);
}
