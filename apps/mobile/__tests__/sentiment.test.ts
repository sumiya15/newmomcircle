/**
 * __tests__/sentiment.test.ts
 * Unit tests for the sentiment utility helpers.
 * Run with: npx jest
 */

import {
  mapHFLabel,
  pickTopPrediction,
  generateAdvice,
  parseHFSentiment,
  confidenceDisplay,
} from "../utils/sentiment";

describe("mapHFLabel", () => {
  it("maps LABEL_0 to negative", () => {
    expect(mapHFLabel("LABEL_0")).toBe("negative");
  });
  it("maps LABEL_1 to neutral", () => {
    expect(mapHFLabel("LABEL_1")).toBe("neutral");
  });
  it("maps LABEL_2 to positive", () => {
    expect(mapHFLabel("LABEL_2")).toBe("positive");
  });
  it("maps named labels case-insensitively", () => {
    expect(mapHFLabel("Positive")).toBe("positive");
    expect(mapHFLabel("NEGATIVE")).toBe("negative");
    expect(mapHFLabel("Neutral")).toBe("neutral");
  });
  it("falls back to neutral for unknown labels", () => {
    expect(mapHFLabel("UNKNOWN")).toBe("neutral");
  });
});

describe("pickTopPrediction", () => {
  it("returns the prediction with the highest score", () => {
    const preds = [
      { label: "LABEL_0", score: 0.1 },
      { label: "LABEL_2", score: 0.8 },
      { label: "LABEL_1", score: 0.1 },
    ];
    expect(pickTopPrediction(preds)).toEqual({ label: "LABEL_2", score: 0.8 });
  });
  it("returns null for empty array", () => {
    expect(pickTopPrediction([])).toBeNull();
  });
});

describe("generateAdvice", () => {
  it("returns encouraging text for high-confidence positive", () => {
    const advice = generateAdvice("positive", 0.92);
    expect(advice).toContain("radiating");
  });
  it("returns a gentle message for moderate positive", () => {
    const advice = generateAdvice("positive", 0.7);
    expect(advice).toContain("good space");
  });
  it("returns a compassionate message for high-confidence negative", () => {
    const advice = generateAdvice("negative", 0.9);
    expect(advice).toContain("you are not alone");
  });
  it("returns a supportive message for moderate negative", () => {
    const advice = generateAdvice("negative", 0.7);
    expect(advice).toContain("struggling");
  });
  it("returns a neutral message for neutral sentiment", () => {
    const advice = generateAdvice("neutral", 0.6);
    expect(advice).toContain("ordinary day");
  });
});

describe("parseHFSentiment", () => {
  it("parses a typical HF response", () => {
    const raw = [
      [
        { label: "LABEL_2", score: 0.75 },
        { label: "LABEL_1", score: 0.15 },
        { label: "LABEL_0", score: 0.1 },
      ],
    ];
    const result = parseHFSentiment(raw);
    expect(result.label).toBe("positive");
    expect(result.score).toBe(0.75);
    expect(result.advice).toBeTruthy();
  });

  it("handles an empty response gracefully", () => {
    const result = parseHFSentiment([[]]);
    expect(result.label).toBe("neutral");
    expect(result.score).toBe(0);
  });
});

describe("confidenceDisplay", () => {
  it("converts 0.9423 to '94%'", () => {
    expect(confidenceDisplay(0.9423)).toBe("94%");
  });
  it("converts 0.5 to '50%'", () => {
    expect(confidenceDisplay(0.5)).toBe("50%");
  });
  it("converts 1.0 to '100%'", () => {
    expect(confidenceDisplay(1.0)).toBe("100%");
  });
});
