import type { AppSupabaseClient } from './client';
import type { Guardian } from '@newmomcircle/types';

function toGuardian(row: Record<string, unknown>): Guardian {
  return {
    id: row['id'] as string,
    userId: row['user_id'] as string,
    name: row['name'] as string,
    phone: row['phone'] as string,
    relationship: row['relationship'] as string,
    createdAt: row['created_at'] as string,
  };
}

export async function getGuardians(
  supabase: AppSupabaseClient,
  userId: string
): Promise<Guardian[]> {
  const { data, error } = await supabase
    .from('guardians')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(toGuardian);
}

export async function addGuardian(
  supabase: AppSupabaseClient,
  data: { userId: string; name: string; phone: string; relationship: string }
): Promise<Guardian | null> {
  const { data: row, error } = await supabase
    .from('guardians')
    .insert({ user_id: data.userId, name: data.name, phone: data.phone, relationship: data.relationship })
    .select()
    .single();
  if (error || !row) return null;
  return toGuardian(row as Record<string, unknown>);
}

export async function deleteGuardian(
  supabase: AppSupabaseClient,
  guardianId: string
): Promise<void> {
  await supabase.from('guardians').delete().eq('id', guardianId);
}
