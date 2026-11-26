import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';
import { AppText } from './AppText';

export type ChipOption<T extends string> = { value: T; label: string; count?: number };

type ChipGroupProps<T extends string> = {
  options: ChipOption<T>[];
  value: T | T[];
  onChange: (value: T) => void;
  /** Horizontal scroll instead of wrapping (used for filter rows). */
  scroll?: boolean;
  accessibilityLabel?: string;
};

/** Filter / choice chips. Selected chips are navy, as in the wireframe. Pass an array for multi-select. */
export function ChipGroup<T extends string>({ options, value, onChange, scroll, accessibilityLabel }: ChipGroupProps<T>) {
  const selected = Array.isArray(value) ? value : [value];
  const chips = options.map((o) => {
    const on = selected.includes(o.value);
    return (
      <Pressable
        key={o.value}
        accessibilityRole={Array.isArray(value) ? 'checkbox' : 'radio'}
        accessibilityState={{ checked: on }}
        accessibilityLabel={o.label}
        onPress={() => onChange(o.value)}
        style={[styles.chip, on && styles.on]}
      >
        <AppText variant="caption" weight="semibold" color={on ? colors.white : colors.ink2}>
          {o.label}
          {o.count !== undefined ? `  ${o.count}` : ''}
        </AppText>
      </Pressable>
    );
  });
  if (scroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} accessibilityLabel={accessibilityLabel}>
        {chips}
      </ScrollView>
    );
  }
  return (
    <View style={[styles.row, styles.wrap]} accessibilityLabel={accessibilityLabel}>
      {chips}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  wrap: { flexWrap: 'wrap' },
  chip: {
    minHeight: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.stroke,
    backgroundColor: colors.card,
    justifyContent: 'center',
  },
  on: { backgroundColor: colors.brand, borderColor: colors.brand },
});
