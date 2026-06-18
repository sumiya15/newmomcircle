/**
 * supabase/auth.ts
 * Auth wrappers using Supabase.
 */

import { supabase } from './client';
import { upsertProfile } from '@newmomcircle/api';
import type { SupportedLocale } from '@newmomcircle/types';

export async function signUp(
  email: string,
  password: string,
  displayName: string,
  language: SupportedLocale = 'en'
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName, full_name: displayName } },
  });
  if (error) throw error;
  if (data.user) {
    await upsertProfile(supabase, { id: data.user.id, email, displayName, language, role: 'member' });
  }
  return data.user;
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function forgotPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function requestAccountDeletion(password: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Re-authenticate via sign in before deletion
  const { error: reAuthError } = await supabase.auth.signInWithPassword({
    email: user.email ?? '',
    password,
  });
  if (reAuthError) throw reAuthError;

  // Mark profile for GDPR deletion
  const { requestAccountDeletion: markForDeletion } = await import('@newmomcircle/api');
  await markForDeletion(supabase, user.id);
}

export async function updateUserProfile(updates: { displayName?: string; photoUrl?: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { updateProfile } = await import('@newmomcircle/api');
  await updateProfile(supabase, user.id, updates);
}

export { supabase };
