'use client';

import { createBrowserClient } from '@supabase/ssr';
import { createSupabaseClient, type AppSupabaseClient } from '@newmomcircle/api';
import type { Database } from '@newmomcircle/api';

// createBrowserClient adds cookie-based session persistence for Next.js App Router.
// The cast is safe: both createClient and createBrowserClient implement the same interface.
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
) as unknown as AppSupabaseClient;

// Re-export factory for server-side use (Server Components / Route Handlers)
export { createSupabaseClient };
