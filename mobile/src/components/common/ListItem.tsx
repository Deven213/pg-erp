import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';

import { colors, elevation, radius, spacing, tones, type Tone } from '@/theme';
import { AppText } from './AppText';

type ListItemProps = {
  title: string;
  subtitle?: string;
  meta?: string;
  icon?: LucideIcon;
  iconTone?: Tone;
  /** Avatar initials instead of an icon. */
  avatar?: string;
  right?: ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  last?: boolean;
  testID?: string;
};

/** The wireframe's list row: leading icon/avatar, title, up to two meta lines, optional trailing content. */
export function ListItem({ title, subtitle, meta, icon: Icon, iconTone = 'neutral', avatar, right, onPress, showChevron, last, testID }: ListItemProps) {
  const tone = tones[iconTone];
  const content = (
    <>
      {Icon ? (
        <View style={[styles.tile, { backgroundColor: tone.bg }]}>
          <Icon size={18} color={tone.fg} />
        </View>
      ) : avatar ? (
        <View style={styles.avatar}>
          <AppText variant="bodySmall" weight="bold" color={colors.sage}>
            {avatar}
          </AppText>
        </View>
      ) : null}
      <View style={styles.text}>
        <AppText weight="semibold" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color={colors.ink2} numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
        {meta ? (
          <AppText variant="caption" color={colors.ink3} numberOfLines={1}>
            {meta}
          </AppText>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
      {(showChevron ?? (!!onPress && !right)) ? <ChevronRight size={16} color={colors.ink3} /> : null}
    </>
  );
  const rowStyle = [styles.row, !last && styles.divider];
  if (!onPress) return <View style={rowStyle} testID={testID}>{content}</View>;
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [...rowStyle, pressed && { backgroundColor: colors.slate50 }]}>
      {content}
    </Pressable>
  );
}

/** Rounded container that groups ListItems, as in the wireframe. */
export function ListGroup({ children }: { children: ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

const styles = StyleSheet.create({
  group: { backgroundColor: colors.card, borderRadius: radius.card, overflow: 'hidden', ...elevation.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 60 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.stroke },
  tile: { width: 40, height: 40, borderRadius: radius.tile, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sageSoft },
  text: { flex: 1, minWidth: 0, gap: 2 },
  right: { alignItems: 'flex-end', gap: 3 },
});
