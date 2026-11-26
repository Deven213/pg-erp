import { Pressable, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';
import { AppText } from './AppText';

type Segment<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ segments, value, onChange }: SegmentedControlProps<T>) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {segments.map((s) => {
        const on = s.value === value;
        return (
          <Pressable
            key={s.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(s.value)}
            style={[styles.segment, on && styles.on]}
          >
            <AppText variant="caption" weight="semibold" color={on ? colors.ink : colors.ink2}>
              {s.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', backgroundColor: colors.slate100, borderRadius: 11, padding: 3, gap: 3 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: 9 },
  on: {
    backgroundColor: colors.card,
    shadowColor: '#101828',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
});
