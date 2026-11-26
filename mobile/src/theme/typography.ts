import type { TextStyle } from 'react-native';

/** Inter is loaded in AppProviders; React Native needs one family name per weight. */
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export type FontWeightName = keyof typeof fontFamily;

/**
 * Type scale. Large titles for tab roots, heading for stack screens and sections,
 * metric for dashboard numbers. Body is 15 for comfortable reading on phones.
 */
export const typeScale = {
  display: { fontSize: 28, lineHeight: 34, fontFamily: fontFamily.bold, letterSpacing: -0.4 },
  metric: { fontSize: 24, lineHeight: 30, fontFamily: fontFamily.bold, letterSpacing: -0.3 },
  title: { fontSize: 20, lineHeight: 26, fontFamily: fontFamily.bold, letterSpacing: -0.2 },
  heading: { fontSize: 17, lineHeight: 22, fontFamily: fontFamily.semibold, letterSpacing: -0.1 },
  bodyLarge: { fontSize: 16, lineHeight: 22, fontFamily: fontFamily.semibold },
  body: { fontSize: 15, lineHeight: 21, fontFamily: fontFamily.regular },
  bodySmall: { fontSize: 13.5, lineHeight: 19, fontFamily: fontFamily.regular },
  caption: { fontSize: 12, lineHeight: 16, fontFamily: fontFamily.medium },
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fontFamily.semibold,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof typeScale;
