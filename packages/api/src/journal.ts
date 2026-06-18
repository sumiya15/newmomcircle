import type { AppSupabaseClient } from './client';
import type { JournalEntry, MoodLevel, SentimentLabel } from '@newmomcircle/types';

function toEntry(row: Record<string, unknown>): JournalEntry {
  return {
    id: row['id'] as string,
    userId: row['user_id'] as string,
    content: row['content'] as string,
    mood: row['mood'] as MoodLevel | null,
    wordCount: row['word_count'] as number,
    language: row['language'] as string,
    sentiment: row['sentiment'] as SentimentLabel | null,
    sentimentScore: row['sentiment_score'] as number | null,
    sentimentAdvice: row['sentiment_advice'] as string | null,
    suggestedCoping: row['suggested_coping'] as string | null,
    allowRetraining: row['allow_retraining'] as boolean,
    analyzedAt: row['analyzed_at'] as string | null,
    createdAt: row['created_at'] as string,
  };
}

export async function createJournalEntry(
  supabase: AppSupabaseClient,
  data: { userId: string; content: string; mood?: MoodLevel; language?: string; allowRetraining?: boolean }
): Promise<JournalEntry | null> {
  const { data: row, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: data.userId,
      content: data.content,
      mood: data.mood ?? null,
      word_count: data.content.trim().split(/\s+/).length,
      language: data.language ?? 'en',
      allow_retraining: data.allowRetraining ?? false,
    })
    .select()
    .single();
  if (error || !row) return null;
  return toEntry(row as Record<string, unknown>);
}

export async function updateJournalSentiment(
  supabase: AppSupabaseClient,
  entryId: string,
  sentiment: { label: SentimentLabel; score: number; advice: string; coping?: string }
): Promise<void> {
  await supabase.from('journal_entries').update({
    sentiment: sentiment.label,
    sentiment_score: sentiment.score,
    sentiment_advice: sentiment.advice,
    suggested_coping: sentiment.coping ?? null,
    analyzed_at: new Date().toISOString(),
  }).eq('id', entryId);
}

export async function getJournalEntries(
  supabase: AppSupabaseClient,
  userId: string,
  limit = 20
): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(toEntry);
}

export async function deleteJournalEntry(
  supabase: AppSupabaseClient,
  entryId: string
): Promise<void> {
  await supabase.from('journal_entries').delete().eq('id', entryId);
}
