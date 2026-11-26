import { Pressable, StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { colors, elevation, radius, spacing } from '@/theme';

type CardProps = ViewProps & {
  onPress?: () => void;
  /** Highlighted (selected) border, as used for chosen options. */
  selected?: boolean;
  padded?: boolean;
  /** 'elevated' (default): white with soft shadow. 'flat': tinted surface, no shadow, for nested content. */
  variant?: 'elevated' | 'flat';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
};

export function Card({ onPress, selected, padded = true, variant = 'elevated', style, children, accessibilityLabel, testID, ...rest }: CardProps) {
  const cardStyle = [styles.base, variant === 'elevated' ? styles.elevated : styles.flat, padded && styles.padded, selected && styles.selected, style];
  if (onPress) {
    return (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected: !!selected }}
        onPress={onPress}
        style={({ pressed }) => [...cardStyle, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View {...rest} testID={testID} style={cardStyle}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.card },
  elevated: { backgroundColor: colors.card, ...elevation.card },
  flat: { backgroundColor: colors.slate50 },
  padded: { padding: spacing.lg },
  selected: { borderColor: colors.sage, borderWidth: 1.5 },
  pressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
});
