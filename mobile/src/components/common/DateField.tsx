import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { colors, radius, spacing } from '@/theme';
import { formatDate } from '@/utils/format';
import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';

type DateFieldProps = {
  label?: string;
  required?: boolean;
  value: Date | null;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  placeholder?: string;
  error?: string;
};

/** Date input showing Indian format ("5 Dec 2026"). Android uses the system dialog; iOS shows an inline calendar in a sheet. */
export function DateField({ label, required, value, onChange, minimumDate, maximumDate, placeholder, error }: DateFieldProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(value ?? new Date());
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
        accessibilityValue={{ text: value ? formatDate(value) : undefined }}
        onPress={() => {
          setDraft(value ?? new Date());
          setOpen(true);
        }}
        style={[styles.box, errorText ? styles.error : null]}
      >
        <AppText color={value ? colors.ink : colors.ink3} style={{ flex: 1 }}>
          {value ? formatDate(value) : (placeholder ?? '')}
        </AppText>
        <Calendar size={16} color={colors.ink3} />
      </Pressable>
      {errorText ? (
        <AppText variant="caption" color={colors.red}>
          {errorText}
        </AppText>
      ) : null}

      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={draft}
          mode="date"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onValueChange={(_e, date) => {
            setOpen(false);
            onChange(date);
          }}
          onDismiss={() => setOpen(false)}
        />
      ) : null}
      {Platform.OS !== 'android' ? (
        <BottomSheet visible={open} onClose={() => setOpen(false)} title={label}>
          <DateTimePicker
            value={draft}
            mode="date"
            display="inline"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onValueChange={(_e, date) => setDraft(date)}
          />
          <Button
            label={t('common.confirm')}
            onPress={() => {
              onChange(draft);
              setOpen(false);
            }}
          />
        </BottomSheet>
      ) : null}
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
