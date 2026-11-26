import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronLeft, X } from 'lucide-react-native';

import { colors, spacing } from '@/theme';
import { AppText } from './AppText';

type AppHeaderProps = {
  title?: string;
  subtitle?: string;
  /** Shows a back (or close) button. */
  onBack?: () => void;
  backIcon?: 'back' | 'close';
  /** Content above the title, e.g. the property switcher on tab roots. */
  top?: ReactNode;
  right?: ReactNode;
  /** Large title for tab root screens; compact title for pushed screens. */
  large?: boolean;
};

/** One header for every screen: large on tab roots, compact with back/close on pushed screens. */
export function AppHeader({ title, subtitle, onBack, backIcon = 'back', top, right, large }: AppHeaderProps) {
  const BackIcon = backIcon === 'close' ? X : ChevronLeft;
  return (
    <View style={[styles.bar, large && styles.barLarge]}>
      {onBack ? (
        <IconButton label={backIcon === 'close' ? 'Close' : 'Back'} onPress={onBack} variant="plain">
          <BackIcon size={22} color={colors.ink} />
        </IconButton>
      ) : null}
      <View style={styles.titles}>
        {top}
        {title ? (
          <AppText variant={large ? 'title' : 'heading'} numberOfLines={1} accessibilityRole="header">
            {title}
          </AppText>
        ) : null}
        {subtitle ? (
          <AppText variant="bodySmall" color={colors.ink2} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

type IconButtonProps = {
  label: string;
  onPress?: () => void;
  children: ReactNode;
  badge?: boolean;
  /** 'surface' = white rounded button; 'plain' = no background (back arrows); 'primary' = filled blue. */
  variant?: 'surface' | 'plain' | 'primary';
  testID?: string;
};

/** 44 pt icon button used in headers and toolbars. */
export function IconButton({ label, onPress, children, badge, variant = 'surface', testID }: IconButtonProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.iconBtn, styles[variant], pressed && { opacity: 0.7 }]}
    >
      {children}
      {badge ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, minHeight: 56, paddingVertical: spacing.sm, backgroundColor: colors.background },
  barLarge: { paddingTop: spacing.md, paddingBottom: spacing.sm },
  titles: { flex: 1, minWidth: 0, gap: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  surface: { backgroundColor: colors.card },
  plain: { marginLeft: -8 },
  primary: { backgroundColor: colors.brand },
  dot: { position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red, borderWidth: 1.5, borderColor: colors.white },
});
