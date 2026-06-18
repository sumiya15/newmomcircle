import type { AppSupabaseClient } from './client';
import type { Resource, SupportedLocale } from '@newmomcircle/types';

function toResource(row: Record<string, unknown>): Resource {
  return {
    id: row['id'] as string,
    title: row['title'] as string,
    content: row['content'] as string,
    imageUrl: row['image_url'] as string | null,
    category: row['category'] as string,
    language: row['language'] as SupportedLocale,
    submittedBy: row['submitted_by'] as string,
    isApproved: row['is_approved'] as boolean,
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
  };
}

export async function getApprovedResources(
  supabase: AppSupabaseClient,
  lang?: SupportedLocale
): Promise<Resource[]> {
  let query = supabase
    .from('resources')
    .select('*')
    .eq('is_approved', true)
    .order('created_at', { ascending: false });
  if (lang) query = query.eq('language', lang);
  const { data, error } = await query;
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(toResource);
}

export async function getPendingResources(
  supabase: AppSupabaseClient
): Promise<Resource[]> {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('is_approved', false)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(toResource);
}

export async function submitResource(
  supabase: AppSupabaseClient,
  data: { title: string; content: string; category: string; language: SupportedLocale; submittedBy: string; imageUrl?: string }
): Promise<Resource | null> {
  const { data: row, error } = await supabase
    .from('resources')
    .insert({
      title: data.title,
      content: data.content,
      category: data.category,
      language: data.language,
      submitted_by: data.submittedBy,
      image_url: data.imageUrl ?? null,
      is_approved: false,
    })
    .select()
    .single();
  if (error || !row) return null;
  return toResource(row as Record<string, unknown>);
}

export async function approveResource(
  supabase: AppSupabaseClient,
  resourceId: string
): Promise<void> {
  await supabase.from('resources').update({ is_approved: true, updated_at: new Date().toISOString() }).eq('id', resourceId);
}
