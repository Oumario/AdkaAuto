// ADKA AUTO Design System
export const Colors = {
  // Base
  background: '#0f0f1a',
  surface: '#1a1a2e',
  surfaceElevated: '#22223a',
  surfaceBorder: '#2a2a45',
  overlay: 'rgba(0,0,0,0.6)',

  // Brand
  renault: '#FFCC00',
  renaultDark: '#e6b800',
  dacia: '#3b82f6',
  daciaDark: '#2563eb',

  // Text
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textInverse: '#0f0f1a',

  // Semantic
  success: '#22c55e',
  successBg: 'rgba(34,197,94,0.12)',
  warning: '#f59e0b',
  warningBg: 'rgba(245,158,11,0.12)',
  error: '#ef4444',
  errorBg: 'rgba(239,68,68,0.12)',
  info: '#3b82f6',
  infoBg: 'rgba(59,130,246,0.12)',

  // UI
  primary: '#FFCC00',
  primaryText: '#0f0f1a',
  separator: '#1e1e35',
  inputBg: '#16162a',
  inputBorder: '#2a2a45',
  inputFocusBorder: '#FFCC00',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  sizes: {
    xs: 11,
    sm: 13,
    base: 16,
    md: 18,
    lg: 20,
    xl: 24,
    xxl: 28,
    xxxl: 36,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
  },
};

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
};
