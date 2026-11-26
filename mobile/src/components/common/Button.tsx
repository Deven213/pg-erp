import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { colors, radius, spacing, touchTarget } from '@/theme';
import { AppText } from './AppText';

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger' | 'dangerSoft' | 'success' | 'whatsapp';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  icon?: LucideIcon;
  /** Shows a spinner and blocks presses — use it for in-flight requests to stop double submits. */
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityHint?: string;
};

const palette: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.brand, fg: colors.white, border: colors.brand },
  secondary: { bg: colors.card, fg: colors.ink, border: colors.slate100 },
  soft: { bg: colors.sageSoft, fg: colors.brand, border: colors.sageSoft },
  ghost: { bg: 'transparent', fg: colors.sage, border: 'transparent' },
  danger: { bg: colors.red, fg: colors.white, border: colors.red },
  dangerSoft: { bg: colors.red50, fg: colors.red, border: colors.red50 },
  success: { bg: colors.green, fg: colors.white, border: colors.green },
  whatsapp: { bg: colors.whatsapp, fg: colors.white, border: colors.whatsapp },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  testID,
  accessibilityHint,
}: ButtonProps) {
  const inactive = disabled || loading;
  const p = inactive && variant !== 'ghost' ? { bg: colors.disabled, fg: colors.white, border: colors.disabled } : palette[variant];
  const height = size === 'sm' ? 38 : 50;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      hitSlop={size === 'sm' ? (touchTarget - height) / 2 : undefined}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: height,
          backgroundColor: p.bg,
          borderColor: p.border,
          borderRadius: size === 'sm' ? 10 : radius.button,
          paddingHorizontal: size === 'sm' ? spacing.md : spacing.lg,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={styles.row}>
          {Icon ? <Icon size={size === 'sm' ? 16 : 18} color={p.fg} strokeWidth={2} /> : null}
          <AppText variant={size === 'sm' ? 'bodySmall' : 'body'} weight="semibold" color={p.fg}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
