import type { SentimentLabel } from '@newmomcircle/types';

export type { SentimentLabel };

export interface SentimentResult {
  label: SentimentLabel;
  score: number;
  advice: string;
}

interface HFPrediction {
  label: string;
  score: number;
}

export function mapHFLabel(rawLabel: string): SentimentLabel {
  const n = rawLabel.toLowerCase().trim();
  if (n === 'label_0' || n === 'negative') return 'negative';
  if (n === 'label_1' || n === 'neutral') return 'neutral';
  if (n === 'label_2' || n === 'positive') return 'positive';
  return 'neutral';
}

export function pickTopPrediction(predictions: HFPrediction[]): HFPrediction | null {
  if (!predictions || predictions.length === 0) return null;
  return predictions.reduce((best, cur) => (cur.score > best.score ? cur : best));
}

export function generateAdvice(label: SentimentLabel, score: number): string {
  if (label === 'positive') {
    if (score > 0.85) {
      return "You're radiating warmth and strength today. Keep nurturing the joy you've found!";
    }
    return "It sounds like you're in a good space. Treasure these moments and be kind to yourself.";
  }
  if (label === 'neutral') {
    return "Today feels like an ordinary day — and that's perfectly okay. Rest, breathe, and take it one step at a time.";
  }
  if (score > 0.85) {
    return "You're carrying a heavy weight right now, and it takes real courage to put it into words. Please reach out to someone you trust — you are not alone.";
  }
  if (score > 0.65) {
    return "It sounds like you're struggling today. Talking to a friend, a family member, or a counsellor can help lighten this load.";
  }
  return "Your feelings are valid. Postpartum emotions are complex. Be gentle with yourself and consider speaking with a healthcare professional.";
}

export function parseHFSentiment(rawPredictions: HFPrediction[][]): SentimentResult {
  const flat = rawPredictions.flat();
  const top = pickTopPrediction(flat);
  if (!top) {
    return { label: 'neutral', score: 0, advice: generateAdvice('neutral', 0) };
  }
  const label = mapHFLabel(top.label);
  const score = Number(top.score.toFixed(4));
  return { label, score, advice: generateAdvice(label, score) };
}

export function confidenceDisplay(score: number): string {
  return `${Math.round(score * 100)}%`;
}

export function sentimentColour(label: SentimentLabel): string {
  const map: Record<SentimentLabel, string> = {
    positive: '#5CB87A',
    neutral: '#F0B75B',
    negative: '#E05F5F',
  };
  return map[label];
}

export function sentimentEmoji(label: SentimentLabel): string {
  const map: Record<SentimentLabel, string> = {
    positive: '🌸',
    neutral: '🌿',
    negative: '🌧️',
  };
  return map[label];
}
