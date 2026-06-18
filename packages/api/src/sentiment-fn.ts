import type { AppSupabaseClient } from './client';
import type { SentimentLabel } from '@newmomcircle/types';

export interface SentimentAnalysisResult {
  sentiment: SentimentLabel;
  sentimentScore: number;
  sentimentAdvice: string;
  suggestedCoping: string;
}

export interface InsightSummaryResult {
  summary: string;
  avgScore: number;
  dominantSentiment: 'positive' | 'challenging' | 'mixed';
}

export async function analyzeSentiment(
  supabase: AppSupabaseClient,
  text: string
): Promise<SentimentAnalysisResult | null> {
  const { data, error } = await supabase.functions.invoke('analyze-sentiment', {
    body: { text },
  });
  if (error) return null;
  return data as SentimentAnalysisResult;
}

export async function generateInsightSummary(
  supabase: AppSupabaseClient,
  weekData: Array<{ date: string; sentiment: SentimentLabel; score: number; mood?: string }>
): Promise<InsightSummaryResult | null> {
  const { data, error } = await supabase.functions.invoke('generate-insight-summary', {
    body: { weekData },
  });
  if (error) return null;
  return data as InsightSummaryResult;
}
