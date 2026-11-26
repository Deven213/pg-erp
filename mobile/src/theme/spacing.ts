import type { ViewStyle } from 'react-native';

/** 4-pt spacing scale. Screen gutter 16, card padding 16, gap between sections 20–24. */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  badge: 6,
  input: 12,
  button: 12,
  card: 16,
  tile: 12,
  sheet: 24,
  pill: 999,
} as const;

/** Minimum touch target from the design rules. */
export const touchTarget = 44;

export const layout = {
  screenGutter: spacing.lg,
  /** Vertical rhythm between screen sections. */
  sectionGap: spacing.xl,
} as const;

/** Soft elevation used instead of heavy borders. */
export const elevation: { card: ViewStyle; raised: ViewStyle } = {
  /** Cards sit on the ivory background with no shadow; tone does the separating. */
  card: {},
  raised: {
    shadowColor: '#1B241E',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
};
