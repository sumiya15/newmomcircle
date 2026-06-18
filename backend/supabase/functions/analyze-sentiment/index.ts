import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LABEL_MAP: Record<string, string> = {
  LABEL_0: 'negative',
  LABEL_1: 'neutral',
  LABEL_2: 'positive',
  negative: 'negative',
  neutral: 'neutral',
  positive: 'positive',
};

const ADVICE: Record<string, string> = {
  positive: "It sounds like you're in a good space. Treasure these moments and be kind to yourself.",
  neutral: "Today feels like an ordinary day — and that's perfectly okay. Rest, breathe, take it one step at a time.",
  negative: "Your feelings are valid. Postpartum emotions are complex. Be gentle with yourself and consider speaking with a healthcare professional.",
};

const COPING: Record<string, string> = {
  positive: 'Positive Reframing',
  neutral: 'Active Coping',
  negative: 'Planning',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Verify authenticated user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const { text } = await req.json() as { text: string };
    if (!text || text.trim().length < 5) {
      return new Response(JSON.stringify({ error: 'Text too short' }), { status: 400, headers: corsHeaders });
    }

    const hfToken = Deno.env.get('HF_API_TOKEN');

    // Call Hugging Face if token is available
    if (hfToken) {
      const hfRes = await fetch(
        'https://api-inference.huggingface.co/models/mental/mental-bert-base-uncased',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs: text }),
        }
      );

      if (hfRes.ok) {
        const predictions = await hfRes.json() as Array<Array<{ label: string; score: number }>>;
        const flat = predictions.flat();
        const top = flat.reduce((a, b) => (b.score > a.score ? b : a));
        const sentiment = LABEL_MAP[top.label] ?? 'neutral';
        const score = Math.round(top.score * 100);
        const advice = score > 85 && sentiment === 'negative'
          ? "You're carrying a heavy weight. Please reach out to someone you trust — you are not alone."
          : ADVICE[sentiment] ?? ADVICE['neutral'];

        return new Response(JSON.stringify({
          sentiment,
          sentimentScore: score,
          sentimentAdvice: advice,
          suggestedCoping: COPING[sentiment],
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Fallback: keyword-based mock sentiment
    const lower = text.toLowerCase();
    const positiveWords = ['happy', 'great', 'wonderful', 'love', 'joy', 'smile', 'good', 'better', 'amazing'];
    const negativeWords = ['sad', 'tired', 'anxious', 'worry', 'cry', 'alone', 'overwhelm', 'scared', 'depressed', 'difficult'];
    const posCount = positiveWords.filter(w => lower.includes(w)).length;
    const negCount = negativeWords.filter(w => lower.includes(w)).length;
    const sentiment = negCount > posCount ? 'negative' : posCount > negCount ? 'positive' : 'neutral';

    return new Response(JSON.stringify({
      sentiment,
      sentimentScore: 60,
      sentimentAdvice: ADVICE[sentiment],
      suggestedCoping: COPING[sentiment],
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
