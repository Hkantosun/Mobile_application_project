export const THEME = {
  colors: {
    background: '#0B0D14',      // Deep space black
    cardBackground: '#141824',  // Elevated dark surface
    cardBorder: '#232A3E',      // Subtle glass/border edge
    cardBorderActive: '#6366F1',
    surfaceSubtle: '#1C2237',
    
    // Brand & Accents
    primary: '#6366F1',         // Indigo / Violet
    primaryGradient: ['#4F46E5', '#7C3AED'],
    secondary: '#06B6D4',       // Vibrant Cyan
    accentYellow: '#FBBF24',    // Gold / XP
    accentOrange: '#F97316',    // Streak fire
    success: '#10B981',         // Emerald green (Easy/Understood)
    danger: '#EF4444',          // Coral red (Hard/Repeat)
    warning: '#F59E0B',         // Amber (Medium)

    // Text hierarchy
    textPrimary: '#FFFFFF',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textLight: '#E2E8F0',

    // Tab bar & Headers
    tabBarBackground: '#0B0D14EE',
    tabBarActive: '#818CF8',
    tabBarInactive: '#64748B',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
    full: 9999,
  },
  typography: {
    h1: { fontSize: 26, fontWeight: '700' as const, color: '#FFFFFF' },
    h2: { fontSize: 20, fontWeight: '700' as const, color: '#FFFFFF' },
    h3: { fontSize: 16, fontWeight: '600' as const, color: '#FFFFFF' },
    body: { fontSize: 15, fontWeight: '400' as const, color: '#E2E8F0', lineHeight: 22 },
    bodySecondary: { fontSize: 13, fontWeight: '400' as const, color: '#94A3B8' },
    caption: { fontSize: 11, fontWeight: '500' as const, color: '#64748B' },
  },
};
