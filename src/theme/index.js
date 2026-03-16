// ─────────────────────────────────────────────────────────────
// SenseVoice Design System
// Palette: Warm Teal (trust/safety) + Coral (joy/warmth)
// Material Design 3 tokens
// ─────────────────────────────────────────────────────────────

export const Colors = {
  // Primary – Warm Teal
  primary:            '#00897B',
  primaryLight:       '#4DB6AC',
  primaryDark:        '#00695C',
  primaryContainer:   '#E0F2F1',
  onPrimary:          '#FFFFFF',
  onPrimaryContainer: '#004D40',

  // Secondary – Coral warmth
  secondary:          '#FF7043',
  secondaryLight:     '#FFAB91',
  secondaryDark:      '#E64A19',
  secondaryContainer: '#FBE9E7',
  onSecondary:        '#FFFFFF',

  // Tertiary – Amber celebration
  tertiary:           '#FFB300',
  tertiaryLight:      '#FFD54F',
  tertiaryContainer:  '#FFF8E1',
  onTertiary:         '#FFFFFF',

  // Surface
  background:         '#FAFDF8',
  surface:            '#FFFFFF',
  surfaceVariant:     '#F1F8F7',
  onBackground:       '#1A2E2B',
  onSurface:          '#1A2E2B',
  onSurfaceVariant:   '#4A6560',
  subtitle:           '#6B8F8A',
  disabled:           '#B2CECA',
  divider:            '#E0ECEA',

  // Semantic
  success:     '#43A047',
  successLight:'#E8F5E9',
  warning:     '#FB8C00',
  warningLight:'#FFF3E0',
  error:       '#E53935',
  errorLight:  '#FFEBEE',
  info:        '#1E88E5',
  infoLight:   '#E3F2FD',

  // Emergency
  danger:      '#C62828',
  dangerLight: '#FFCDD2',
  dangerMid:   '#E53935',

  // Utility
  shadow:      'rgba(0,105,92,0.14)',
  overlay:     'rgba(26,46,43,0.55)',
  white:       '#FFFFFF',
  black:       '#000000',

  // Gradients
  gradientPrimary:   ['#00695C','#00897B','#26A69A'],
  gradientWarm:      ['#FF7043','#FFB300'],
  gradientSafe:      ['#E0F2F1','#FAFDF8'],
  gradientMilestone: ['#FFB300','#FF7043'],
  gradientDanger:    ['#C62828','#E53935'],
};

export const Typography = {
  displayLarge:   { fontFamily:'System', fontSize:52, lineHeight:60, fontWeight:'700', letterSpacing:-1.5 },
  displayMedium:  { fontFamily:'System', fontSize:42, lineHeight:50, fontWeight:'700', letterSpacing:-1   },
  headlineLarge:  { fontFamily:'System', fontSize:32, lineHeight:40, fontWeight:'700', letterSpacing:-0.5 },
  headlineMedium: { fontFamily:'System', fontSize:26, lineHeight:34, fontWeight:'700', letterSpacing:-0.3 },
  headlineSmall:  { fontFamily:'System', fontSize:22, lineHeight:30, fontWeight:'600', letterSpacing:-0.2 },
  titleLarge:     { fontFamily:'System', fontSize:20, lineHeight:28, fontWeight:'600', letterSpacing: 0   },
  titleMedium:    { fontFamily:'System', fontSize:16, lineHeight:24, fontWeight:'600', letterSpacing: 0.1 },
  titleSmall:     { fontFamily:'System', fontSize:14, lineHeight:20, fontWeight:'600', letterSpacing: 0.1 },
  bodyLarge:      { fontFamily:'System', fontSize:16, lineHeight:24, fontWeight:'400', letterSpacing: 0.3 },
  bodyMedium:     { fontFamily:'System', fontSize:14, lineHeight:20, fontWeight:'400', letterSpacing: 0.2 },
  bodySmall:      { fontFamily:'System', fontSize:12, lineHeight:16, fontWeight:'400', letterSpacing: 0.3 },
  labelLarge:     { fontFamily:'System', fontSize:14, lineHeight:20, fontWeight:'700', letterSpacing: 0.5 },
  labelMedium:    { fontFamily:'System', fontSize:12, lineHeight:16, fontWeight:'700', letterSpacing: 0.5 },
  labelSmall:     { fontFamily:'System', fontSize:11, lineHeight:16, fontWeight:'700', letterSpacing: 0.8 },
};

export const Spacing = {
  xxs: 2,  xs: 4,  sm: 8,  md: 16,
  lg:  24, xl: 32, xxl:48, xxxl:64,
};

export const Radius = {
  xs: 4, sm: 8, md: 12, lg: 16,
  xl: 20, xxl: 28, xxxl: 40, full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: Colors.shadow,
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius:  4,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.shadow,
    shadowOffset:  { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius:  8,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.shadow,
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius:  16,
    elevation: 8,
  },
  xl: {
    shadowColor: Colors.shadow,
    shadowOffset:  { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius:  24,
    elevation: 12,
  },
};
