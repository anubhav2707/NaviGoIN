export const colors = {
  // Primary colors - Driver theme (professional blue)
  primary: '#2563EB',
  primaryVariant: '#1D4ED8',
  secondary: '#10B981',
  secondaryVariant: '#059669',
  
  // Surface colors
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceVariant: '#F3F4F6',
  
  // Text colors
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
  onBackground: '#111827',
  onSurface: '#111827',
  onSurfaceVariant: '#6B7280',
  
  // Status colors
  error: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  info: '#3B82F6',
  
  // Earnings specific
  earnings: '#059669',
  earningsLight: '#D1FAE5',
  
  // Navigation specific
  routeActive: '#3B82F6',
  routeInactive: '#9CA3AF',
  
  // Border colors
  border: '#E5E7EB',
  divider: '#E5E7EB'
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40
  },
  h2: {
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 36
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28
  },
  bodyLg: {
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 28
  },
  bodyMd: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24
  },
  bodySm: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20
  },
  labelLg: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20
  },
  labelMd: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16
  },
  labelSm: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 16
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16
  }
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8
  }
};