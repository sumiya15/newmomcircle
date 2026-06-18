/**
 * utils/theme.ts — design tokens for NewMomCircle.
 * Single source of truth. Never hardcode colours/spacing elsewhere.
 */

// ─── Light mode (Nurturing Circle palette) ────────────────────────────────────

export const Colors = {
  peach:        '#FF9F7C',
  peachLight:   '#FFCFBB',
  peachDark:    '#E8734A',
  peachOverlay: 'rgba(255,159,124,0.18)',

  white:     '#FFFFFF',
  offWhite:  '#FDF8F5',
  warmGrey:  '#F5EDE8',
  cardBg:    'rgba(255,255,255,0.92)',

  textPrimary:   '#2D1B13',
  textSecondary: '#6B4C3B',
  textMuted:     '#A08070',
  textOnDark:    '#FFFFFF',

  overlayDark:  'rgba(20,8,4,0.52)',
  overlayWarm:  'rgba(80,30,10,0.38)',
  overlayLight: 'rgba(255,240,230,0.15)',
  glassBg:      'rgba(255,255,255,0.12)',
  glassStroke:  'rgba(255,255,255,0.28)',

  sentimentPositive: '#5CB87A',
  sentimentNeutral:  '#F0B75B',
  sentimentNegative: '#E05F5F',
  success: '#4CAF7D',
  danger:  '#D94F4F',

  divider: 'rgba(255,159,124,0.25)',
  shadow:  'rgba(80,30,10,0.18)',
} as const;

// ─── Dark mode (warm charcoal — not pure black, for 3am feeds) ───────────────

export const DarkColors = {
  peach:        '#FFB59B',
  peachLight:   '#FFCFBB',
  peachDark:    '#FF9F7C',
  peachOverlay: 'rgba(255,181,155,0.2)',

  white:     '#2C1E17',
  offWhite:  '#1E130D',
  warmGrey:  '#2E1F16',
  cardBg:    'rgba(44,30,23,0.95)',

  textPrimary:   '#F5EDE8',
  textSecondary: '#C8A898',
  textMuted:     '#8B6A58',
  textOnDark:    '#F5EDE8',

  overlayDark:  'rgba(0,0,0,0.65)',
  overlayWarm:  'rgba(10,5,2,0.55)',
  overlayLight: 'rgba(255,200,160,0.08)',
  glassBg:      'rgba(255,255,255,0.07)',
  glassStroke:  'rgba(255,255,255,0.14)',

  sentimentPositive: '#6FD192',
  sentimentNeutral:  '#F5C56B',
  sentimentNegative: '#E87878',
  success: '#6FD192',
  danger:  '#E87878',

  divider: 'rgba(255,181,155,0.2)',
  shadow:  'rgba(0,0,0,0.4)',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const Typography = {
  fontFamily:         'Poppins_400Regular',
  fontFamilyMedium:   'Poppins_500Medium',
  fontFamilySemiBold: 'Poppins_600SemiBold',
  fontFamilyBold:     'Poppins_700Bold',

  xs:    11,  // captions, timestamps
  sm:    13,  // metadata, secondary labels
  base:  15,  // body copy
  md:    17,  // slightly elevated body
  lg:    20,  // h3, section headings
  xl:    24,  // h2, modal titles
  '2xl': 30,  // h1
  '3xl': 38,  // display / splash
} as const;

// ─── Spacing — strict 8pt grid ────────────────────────────────────────────────

export const Spacing = {
  xs:    4,
  sm:    8,
  md:    16,
  lg:    24,
  xl:    32,
  '2xl': 48,
  '3xl': 64,
} as const;

// ─── Radii ────────────────────────────────────────────────────────────────────

export const Radius = {
  sm:   8,    // chips, badges
  md:   14,   // thumbnails, small cards
  lg:   20,   // main cards
  xl:   28,   // bottom sheets, large modals
  full: 9999,
} as const;

// ─── Shadows — soft, diffuse ──────────────────────────────────────────────────

export const Shadow = {
  card: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
  },
  button: {
    shadowColor: Colors.peachDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 18,
    elevation: 8,
  },
  soft: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 3,
  },
} as const;

// ─── Motion — standard durations and spring configs ───────────────────────────
// Use these everywhere so every animation feels like one product.

export const Motion = {
  duration: {
    fast:  150,  // micro: press highlights, icon swaps
    base:  250,  // standard: fades, slides, modals
    slow:  400,  // onboarding, full-page transitions
  },
  spring: {
    snappy: { damping: 18, stiffness: 280 } as const,  // button/card press
    gentle: { damping: 14, stiffness: 180 } as const,  // list insertions, FAB
    bouncy: { damping: 10, stiffness: 260 } as const,  // like/heart pop
  },
} as const;
