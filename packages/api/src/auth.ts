import type { AppSupabaseClient } from './client';
import type { SupportedLocale } from '@newmomcircle/types';
import { upsertProfile } from './profiles';
import { getInitials } from '@newmomcircle/utils';

export async function signUp(
  supabase: AppSupabaseClient,
  email: string,
  password: string,
  displayName: string,
  language: SupportedLocale = 'en'
) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (data.user) {
    await upsertProfile(supabase, {
      id: data.user.id,
      email,
      displayName,
      language,
      role: 'member',
    });
  }
  return data;
}

export async function signIn(supabase: AppSupabaseClient, email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut(supabase: AppSupabaseClient) {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(supabase: AppSupabaseClient, email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/update-password`,
  });
  if (error) throw error;
}

export async function signInWithGoogle(supabase: AppSupabaseClient) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/feed` },
  });
  if (error) throw error;
  return data;
}

export async function getSession(supabase: AppSupabaseClient) {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function onAuthStateChange(
  supabase: AppSupabaseClient,
  callback: (userId: string | null) => void
) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user?.id ?? null);
  });
  return data.subscription.unsubscribe;
}

// Re-export for convenience
export { getInitials };
