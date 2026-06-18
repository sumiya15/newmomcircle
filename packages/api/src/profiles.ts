import type { AppSupabaseClient } from './client';
import type { Profile, SupportedLocale, UserRole } from '@newmomcircle/types';

function toProfile(row: Record<string, unknown>): Profile {
  return {
    id: row['id'] as string,
    email: row['email'] as string,
    displayName: row['display_name'] as string,
    photoUrl: row['photo_url'] as string | null,
    babyDob: row['baby_dob'] as string | null,
    language: row['language'] as SupportedLocale,
    role: row['role'] as UserRole,
    allowRetraining: row['allow_retraining'] as boolean,
    gdprDeleteRequested: row['gdpr_delete_requested'] as boolean,
    gdprRequestedAt: row['gdpr_requested_at'] as string | null,
    deletedAt: row['deleted_at'] as string | null,
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
  };
}

export async function getProfile(supabase: AppSupabaseClient, userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) return null;
  return toProfile(data as Record<string, unknown>);
}

export async function upsertProfile(
  supabase: AppSupabaseClient,
  profile: { id: string; email: string; displayName: string; language?: SupportedLocale; role?: UserRole }
): Promise<void> {
  await supabase.from('profiles').upsert({
    id: profile.id,
    email: profile.email,
    display_name: profile.displayName,
    language: profile.language ?? 'en',
    role: profile.role ?? 'member',
    allow_retraining: false,
    gdpr_delete_requested: false,
  });
}

export async function updateProfile(
  supabase: AppSupabaseClient,
  userId: string,
  updates: { displayName?: string; babyDob?: string; language?: SupportedLocale; allowRetraining?: boolean; photoUrl?: string }
): Promise<void> {
  const mapped: {
    display_name?: string;
    baby_dob?: string | null;
    language?: string;
    allow_retraining?: boolean;
    photo_url?: string | null;
    updated_at?: string;
  } = { updated_at: new Date().toISOString() };
  if (updates.displayName !== undefined) mapped.display_name = updates.displayName;
  if (updates.babyDob !== undefined) mapped.baby_dob = updates.babyDob;
  if (updates.language !== undefined) mapped.language = updates.language;
  if (updates.allowRetraining !== undefined) mapped.allow_retraining = updates.allowRetraining;
  if (updates.photoUrl !== undefined) mapped.photo_url = updates.photoUrl;
  await supabase.from('profiles').update(mapped).eq('id', userId);
}

export async function requestAccountDeletion(
  supabase: AppSupabaseClient,
  userId: string
): Promise<void> {
  await supabase.from('profiles').update({
    gdpr_delete_requested: true,
    gdpr_requested_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', userId);
  // Actual deletion is handled server-side via Supabase Auth webhook → Edge Function
  await supabase.auth.signOut();
}
