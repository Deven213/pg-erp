import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { colors, radius, spacing } from '@/theme';
import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';
import { ListGroup, ListItem } from './ListItem';

export type SelectOption<T extends string> = { value: T; label: string; description?: string };

type SelectProps<T extends string> = {
  label?: string;
  required?: boolean;
  placeholder?: string;
  options: SelectOption<T>[];
  value: T | null | undefined;
  onChange: (value: T) => void;
  error?: string;
  disabled?: boolean;
};

/** Dropdown that opens a bottom sheet list — easier one-handed than a native picker. */
export function Select<T extends string>({ label, required, placeholder, options, value, onChange, error, disabled }: SelectProps<T>) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  const errorText = error ? t(error, { defaultValue: error }) : undefined;

  return (
    <View style={{ gap: 5 }}>
      {label ? (
        <AppText variant="caption" weight="semibold" color={colors.ink2}>
          {label}
          {required ? ' *' : ''}
        </AppText>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: current?.label }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.box, errorText ? styles.error : null, disabled && { backgroundColor: colors.slate50 }]}
      >
        <AppText color={current ? colors.ink : colors.ink3} style={{ flex: 1 }} numberOfLines={1}>
          {current?.label ?? placeholder ?? ''}
        </AppText>
        <ChevronDown size={16} color={colors.ink3} />
      </Pressable>
      {errorText ? (
        <AppText variant="caption" color={colors.red}>
          {errorText}
        </AppText>
      ) : null}
      <BottomSheet visible={open} onClose={() => setOpen(false)} title={label}>
        <ListGroup>
          {options.map((o, i) => (
            <ListItem
              key={o.value}
              title={o.label}
              subtitle={o.description}
              last={i === options.length - 1}
              right={o.value === value ? <Check size={18} color={colors.sage} /> : undefined}
              showChevron={false}
              onPress={() => {
                onChange(o.value);
                setOpen(false);
              }}
            />
          ))}
        </ListGroup>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.stroke,
    borderRadius: radius.input,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  error: { borderColor: colors.red, borderWidth: 1.5 },
});
