import { StyleSheet, View } from 'react-native';

import { bedStatusTone, radius, tones, type Tone } from '@/theme';
import { AppText } from './AppText';

type BadgeProps = { label: string; tone?: Tone; /** Leading status dot, for live states (Active, Occupied…). */ dot?: boolean };

export function Badge({ label, tone = 'neutral', dot }: BadgeProps) {
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: tone === 'brand' ? t.fg : t.fg }]} /> : null}
      <AppText variant="caption" weight="semibold" color={t.fg} style={styles.text}>
        {label}
      </AppText>
    </View>
  );
}

export type BedStatus = keyof typeof bedStatusTone;

const bedLabels: Record<BedStatus, string> = {
  available: 'Available',
  reserved: 'Reserved',
  occupied: 'Occupied',
  maintenance: 'Maintenance',
  inactive: 'Inactive',
};

/** Bed status badge using the wireframe colour legend. */
export function BedStatusBadge({ status }: { status: BedStatus }) {
  return <Badge label={bedLabels[status]} tone={bedStatusTone[status]} dot />;
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11.5, lineHeight: 15 },
});
