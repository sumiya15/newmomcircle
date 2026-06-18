import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeekEntry {
  date: string;
  sentiment: string;
  score: number;
  mood?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const { weekData } = await req.json() as { weekData: WeekEntry[] };
    if (!weekData || weekData.length === 0) {
      return new Response(JSON.stringify({ error: 'No data provided' }), { status: 400, headers: corsHeaders });
    }

    const avgScore = weekData.reduce((sum, e) => sum + e.score, 0) / weekData.length;
    const positiveCount = weekData.filter(e => e.sentiment === 'positive').length;
    const negativeCount = weekData.filter(e => e.sentiment === 'negative').length;

    let dominantSentiment: 'positive' | 'challenging' | 'mixed';
    let summary: string;

    if (positiveCount > weekData.length * 0.6) {
      dominantSentiment = 'positive';
      summary = `This has been a genuinely positive week for you. You've shown real strength and found moments of joy. Keep nurturing these positive patterns — they're building your resilience day by day.`;
    } else if (negativeCount > weekData.length * 0.5) {
      dominantSentiment = 'challenging';
      summary = `This week has been challenging, and that takes real courage to acknowledge. Your feelings are completely valid. Consider reaching out to your support circle, and remember — difficult weeks pass. You are stronger than you know.`;
    } else {
      dominantSentiment = 'mixed';
      summary = `This week has been a mix of ups and downs — which is completely normal for a new mother. You're navigating so much at once. Be gentle with yourself and celebrate even the smallest wins.`;
    }

    return new Response(JSON.stringify({ summary, avgScore: Math.round(avgScore), dominantSentiment }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
