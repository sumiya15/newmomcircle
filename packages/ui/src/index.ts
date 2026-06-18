// ─── Brand colours ────────────────────────────────────────────────────────────

export const Colors = {
  peach: '#FF9F7C',
  peachLight: '#FFCFBB',
  peachDark: '#E8734A',
  peachOverlay: 'rgba(255,159,124,0.18)',

  white: '#FFFFFF',
  offWhite: '#FDF8F5',
  warmGrey: '#F5EDE8',
  textPrimary: '#2D1B13',
  textSecondary: '#6B4C3B',
  textMuted: '#A08070',

  overlayDark: 'rgba(20,8,4,0.72)',
  overlayWarm: 'rgba(80,30,10,0.38)',
  glassBg: 'rgba(255,255,255,0.12)',
  glassBorder: 'rgba(255,255,255,0.28)',

  sentimentPositive: '#5CB87A',
  sentimentNeutral: '#F0B75B',
  sentimentNegative: '#E05F5F',

  divider: 'rgba(255,159,124,0.25)',
  shadow: 'rgba(80,30,10,0.18)',
  cardBg: 'rgba(255,255,255,0.92)',
  danger: '#D94F4F',
  success: '#4CAF7D',
} as const;

// ─── Typography scale ─────────────────────────────────────────────────────────

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 38,
} as const;

// ─── Spacing scale (4-pt grid) ────────────────────────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

// ─── Border radii ─────────────────────────────────────────────────────────────

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
} as const;

// ─── CSS gradient strings (web only) ─────────────────────────────────────────

export const Gradients = {
  peach: 'linear-gradient(135deg, #FF9F7C, #E8734A)',
  overlay:
    'linear-gradient(to bottom, rgba(20,8,4,0.55) 0%, rgba(20,8,4,0.45) 40%, rgba(232,115,74,0.18) 80%, rgba(20,8,4,0.72) 100%)',
} as const;

// ─── RN Shadow presets (mobile only) ─────────────────────────────────────────

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
} as const;
