// Pre-computed from antepartum Excel dataset.
// Lower EPDS correlation = better mental health outcome.
export const COPING_AVERAGES = {
  positiveReframing: 14.2,
  planning: 13.8,
  activeCoping: 13.5,
  acceptance: 12.9,
  selfDistraction: 11.8,
  venting: 11.4,
  religion: 15.1,
  selfBlame: 8.3,
  denial: 6.1,
  disengagement: 5.8,
} as const;

// Strategies most negatively correlated with high EPDS (protective).
export const TOP_PROTECTIVE_STRATEGIES = [
  'Positive Reframing',
  'Planning',
  'Active Coping',
  'Acceptance',
] as const;

// PPD prevalence from postnatal dataset (1503 rows).
export const POSTNATAL_PREVALENCE = {
  troubleSleeping: 0.71,
  anxious: 0.68,
  sadOrTearful: 0.74,
  troubleConcentrating: 0.61,
  bondingIssues: 0.43,
  irritable: 0.67,
} as const;
