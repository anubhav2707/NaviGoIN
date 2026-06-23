// Design tokens lifted from stitch_ridenow_mobile_app_ui_design/urban_kinetic/DESIGN.md
// "Urban Kinetic" — quietly-premium, high-contrast, minimal design system for RideNow.

export const colors = {
  surface: '#f9f9f9',
  surfaceDim: '#dadada',
  surfaceBright: '#f9f9f9',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f3f3f3',
  surfaceContainer: '#eeeeee',
  surfaceContainerHigh: '#e8e8e8',
  surfaceContainerHighest: '#e2e2e2',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#4c4546',
  inverseSurface: '#2f3131',
  inverseOnSurface: '#f1f1f1',
  outline: '#7e7576',
  outlineVariant: '#cfc4c5',

  primary: '#000000',
  onPrimary: '#ffffff',
  primaryContainer: '#1b1b1b',
  onPrimaryContainer: '#848484',

  secondary: '#0040df', // "Electric Blue" — used for live data: routes, active status, selection
  onSecondary: '#ffffff',
  secondaryContainer: '#2d5bff',
  onSecondaryContainer: '#efefff',

  tertiary: '#000000',
  onTertiary: '#ffffff',
  tertiaryContainer: '#1c1b1b',
  onTertiaryContainer: '#858383',

  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',

  background: '#f9f9f9',
  onBackground: '#1a1c1c',
  surfaceVariant: '#e2e2e2',

  // "Fixed" accent tones from DESIGN.md — used for selected ride-option chips/icons.
  secondaryFixed: '#dde1ff',
  secondaryFixedDim: '#b8c3ff',

  // Functional colors called out in DESIGN.md (success / warning) but not given hex values —
  // using Material-aligned defaults that fit the rest of the palette.
  success: '#2e7d32',
  onSuccess: '#ffffff',
  warning: '#9a6700',
  onWarning: '#ffffff',
} as const;

export const typography = {
  displayLg: { fontFamily: 'Inter', fontSize: 32, fontWeight: '700' as const, lineHeight: 40, letterSpacing: -0.02 * 32 },
  headlineMd: { fontFamily: 'Inter', fontSize: 24, fontWeight: '600' as const, lineHeight: 32, letterSpacing: -0.01 * 24 },
  headlineSm: { fontFamily: 'Inter', fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  bodyLg: { fontFamily: 'Inter', fontSize: 18, fontWeight: '400' as const, lineHeight: 26 },
  bodyMd: { fontFamily: 'Inter', fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodySm: { fontFamily: 'Inter', fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  labelMd: { fontFamily: 'Inter', fontSize: 12, fontWeight: '600' as const, lineHeight: 16, letterSpacing: 0.02 * 12 },
  buttonLg: { fontFamily: 'Inter', fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
} as const;

export const radii = {
  sm: 4,
  default: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const spacing = {
  base: 4,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  gutter: 16,
  marginMobile: 16,
} as const;

// Level 1 "floating sheet" shadow from DESIGN.md: 0px 4px 20px rgba(0,0,0,0.05)
export const elevation = {
  level1: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  level2: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 6,
  },
} as const;

export const theme = { colors, typography, radii, spacing, elevation } as const;
export type Theme = typeof theme;
