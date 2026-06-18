/**
 * utils/sentiment.ts
 * Helpers for working with MentalBERT sentiment results.
 * These are unit-tested in __tests__/sentiment.test.ts.
 */

export type SentimentLabel = "positive" | "neutral" | "negative";

export interface SentimentResult {
  label: SentimentLabel;
  score: number; // 0 – 1 confidence
  advice: string;
}

interface HFPrediction {
  label: string;
  score: number;
}

/**
 * Maps raw Hugging Face label strings to our app's canonical labels.
 * MentalBERT uses LABEL_0 / LABEL_1 / LABEL_2 depending on fine-tuning.
 * We map: LABEL_0 → negative, LABEL_1 → neutral, LABEL_2 → positive
 * or named labels: "positive", "neutral", "negative".
 */
export function mapHFLabel(rawLabel: string): SentimentLabel {
  const normalised = rawLabel.toLowerCase().trim();
  if (normalised === "label_0" || normalised === "negative") return "negative";
  if (normalised === "label_1" || normalised === "neutral") return "neutral";
  if (normalised === "label_2" || normalised === "positive") return "positive";
  // Fallback: treat unknown as neutral
  return "neutral";
}

/**
 * Picks the top prediction from an array of HF predictions.
 */
export function pickTopPrediction(
  predictions: HFPrediction[]
): HFPrediction | null {
  if (!predictions || predictions.length === 0) return null;
  return predictions.reduce((best, cur) =>
    cur.score > best.score ? cur : best
  );
}

/**
 * Generates compassionate advice copy based on the sentiment label and score.
 */
export function generateAdvice(
  label: SentimentLabel,
  score: number
): string {
  if (label === "positive") {
    if (score > 0.85) {
      return "You're radiating warmth and strength today. Keep nurturing the joy you've found!";
    }
    return "It sounds like you're in a good space. Treasure these moments and be kind to yourself.";
  }

  if (label === "neutral") {
    return "Today feels like an ordinary day — and that's perfectly okay. Rest, breathe, and take it one step at a time.";
  }

  // negative
  if (score > 0.85) {
    return "You're carrying a heavy weight right now, and it takes real courage to put it into words. Please reach out to someone you trust — you are not alone.";
  }
  if (score > 0.65) {
    return "It sounds like you're struggling today. Talking to a friend, a family member, or a counsellor can help lighten this load.";
  }
  return "Your feelings are valid. Postpartum emotions are complex. Be gentle with yourself and consider speaking with a healthcare professional.";
}

/**
 * Master function: converts raw HF API response into a SentimentResult.
 */
export function parseHFSentiment(
  rawPredictions: HFPrediction[][]
): SentimentResult {
  // HF returns [[{label, score}, ...]]
  const flat = rawPredictions.flat();
  const top = pickTopPrediction(flat);

  if (!top) {
    return {
      label: "neutral",
      score: 0,
      advice: generateAdvice("neutral", 0),
    };
  }

  const label = mapHFLabel(top.label);
  const score = Number(top.score.toFixed(4));

  return {
    label,
    score,
    advice: generateAdvice(label, score),
  };
}

/**
 * Returns a display-safe confidence percentage string.
 * e.g. 0.9423 → "94%"
 */
export function confidenceDisplay(score: number): string {
  return `${Math.round(score * 100)}%`;
}

/**
 * Maps sentiment label to a colour token key for UI rendering.
 */
export function sentimentColour(label: SentimentLabel): string {
  const map: Record<SentimentLabel, string> = {
    positive: "#5CB87A",
    neutral: "#F0B75B",
    negative: "#E05F5F",
  };
  return map[label];
}

/**
 * Maps sentiment label to a mood emoji for quick visual feedback.
 */
export function sentimentEmoji(label: SentimentLabel): string {
  const map: Record<SentimentLabel, string> = {
    positive: "🌸",
    neutral: "🌿",
    negative: "🌧️",
  };
  return map[label];
}
