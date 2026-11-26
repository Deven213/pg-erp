import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { accentFor, colors, radius, spacing, tones, type Tone } from '@/theme';
import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';
import { Card } from './Card';

/** Section title with an optional trailing link ("See all"). */
export function SectionHeader({ title, actionLabel, onAction, testID }: { title: string; actionLabel?: string; onAction?: () => void; testID?: string }) {
  return (
    <View style={styles.sectionHeader} testID={testID}>
      <AppText variant="heading" accessibilityRole="header" style={{ flex: 1 }}>
        {title}
      </AppText>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" accessibilityLabel={actionLabel} onPress={onAction} hitSlop={12}>
          <AppText variant="bodySmall" weight="semibold" color={colors.sage}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Rounded icon tile in a semantic tone. */
export function IconTile({ icon: Icon, tone = 'info', size = 40 }: { icon: LucideIcon; tone?: Tone; size?: number }) {
  const t = tones[tone];
  return (
    <View style={[styles.tile, { width: size, height: size, backgroundColor: t.bg }]}>
      <Icon size={Math.round(size * 0.48)} color={t.fg} strokeWidth={2} />
    </View>
  );
}

/** Two-letter initials tile with a stable accent colour per entity. */
export function InitialsTile({ name, id, size = 44 }: { name: string; id: string; size?: number }) {
  const a = accentFor(id);
  const initials =
    name
      .replace(/\(.*?\)/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join('') || '•';
  return (
    <View style={[styles.tile, { width: size, height: size, backgroundColor: a.bg }]}>
      <AppText weight="bold" color={a.fg} style={{ fontSize: size * 0.36, lineHeight: size * 0.46 }}>
        {initials}
      </AppText>
    </View>
  );
}

/** Thin progress bar (occupancy, collection). `value` 0–1. */
export function ProgressBar({ value, tone = 'info', color, style }: { value: number; tone?: Tone; color?: string; style?: StyleProp<ViewStyle> }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={[styles.track, style]} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}>
      <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color ?? tones[tone].fg }]} />
    </View>
  );
}

type StatTileProps = {
  label: string;
  /** null = this number is not available (no backend data). Never pass a made-up number. */
  value: string | null;
  hint?: string;
  icon?: LucideIcon;
  tone?: Tone;
  loading?: boolean;
  testID?: string;
};

/** Dashboard metric. Shows a dash and the hint when the value isn't available, instead of a fake zero. */
export function StatTile({ label, value, hint, icon, tone = 'info', loading, testID }: StatTileProps) {
  return (
    <Card style={styles.stat} testID={testID}>
      <View style={styles.statHead}>
        {icon ? <IconTile icon={icon} tone={value === null && !loading ? 'neutral' : tone} size={32} /> : null}
        <AppText variant="bodySmall" color={colors.ink2} numberOfLines={1} style={{ flex: 1 }}>
          {label}
        </AppText>
      </View>
      {loading ? (
        <View style={styles.skeleton} />
      ) : (
        <AppText variant="metric" numeric color={value === null ? colors.ink3 : colors.ink} accessibilityLabel={`${label}: ${value ?? 'not available'}`}>
          {value ?? '—'}
        </AppText>
      )}
      {hint ? (
        <AppText variant="caption" color={colors.ink3} numberOfLines={2}>
          {hint}
        </AppText>
      ) : null}
    </Card>
  );
}

export type ActionSheetItem = { label: string; icon?: LucideIcon; destructive?: boolean; onPress: () => void; testID?: string };

/** iOS-style action list in a bottom sheet (Edit / Delete / Share…). */
export function ActionSheet({ visible, onClose, title, items }: { visible: boolean; onClose: () => void; title?: string; items: ActionSheetItem[] }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <View style={styles.actions}>
        {items.map((item, i) => {
          const Icon = item.icon;
          const color = item.destructive ? colors.red : colors.ink;
          return (
            <Pressable
              key={item.label}
              testID={item.testID}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={() => {
                onClose();
                item.onPress();
              }}
              style={({ pressed }) => [styles.actionRow, i < items.length - 1 && styles.actionDivider, pressed && { backgroundColor: colors.slate50 }]}
            >
              {Icon ? <Icon size={20} color={color} /> : null}
              <AppText weight="semibold" color={color}>
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

/** Titled group of form fields. */
export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <View style={styles.formSection}>
      <View style={{ gap: 2 }}>
        <AppText variant="overline" color={colors.ink3}>
          {title}
        </AppText>
        {description ? (
          <AppText variant="caption" color={colors.ink3}>
            {description}
          </AppText>
        ) : null}
      </View>
      <Card style={styles.formCard}>{children}</Card>
    </View>
  );
}

/** Label + value row inside a card (property details, receipts). */
export function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.actionDivider]}>
      <AppText color={colors.ink2}>{label}</AppText>
      <AppText weight="semibold" align="right" style={{ flex: 1 }} numberOfLines={2}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  tile: { borderRadius: radius.tile, alignItems: 'center', justifyContent: 'center' },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.slate100, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  stat: { flex: 1, gap: 6, padding: spacing.md + 2 },
  statHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  skeleton: { height: 28, width: '55%', borderRadius: 8, backgroundColor: colors.slate100 },
  actions: { borderRadius: radius.card, backgroundColor: colors.card, overflow: 'hidden' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 52, paddingHorizontal: spacing.xs },
  actionDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.stroke },
  formSection: { gap: spacing.sm },
  formCard: { gap: spacing.lg },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48, paddingVertical: spacing.sm },
});
