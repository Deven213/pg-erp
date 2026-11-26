import { forwardRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';
import { CircleX, Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { colors, fontFamily, radius, spacing } from '@/theme';
import { AppText } from './AppText';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  required?: boolean;
  /** Text shown before the input, e.g. "+91" or "₹". */
  prefix?: string;
  leftIcon?: LucideIcon;
  right?: ReactNode;
  helperText?: string;
  /** Error message or i18n key (validation keys are translated automatically). */
  error?: string;
  /** Adds a show/hide toggle for passwords. */
  secureToggle?: boolean;
  readOnly?: boolean;
};

export const TextField = forwardRef<TextInputInstance, TextFieldProps>(function TextField(
  { label, required, prefix, leftIcon: LeftIcon, right, helperText, error, secureToggle, readOnly, secureTextEntry, multiline, ...input },
  ref,
) {
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const errorText = error ? t(error, { defaultValue: error }) : undefined;

  return (
    <View style={styles.wrap}>
      {label ? (
        <AppText variant="bodySmall" weight="medium" color={colors.ink2}>
          {label}
          {required ? <AppText variant="bodySmall" color={colors.red}> *</AppText> : null}
        </AppText>
      ) : null}
      <View
        style={[
          styles.box,
          multiline && styles.multiline,
          readOnly && { backgroundColor: colors.slate50 },
          focused && styles.focused,
          errorText ? styles.error : null,
        ]}
      >
        {prefix ? (
          <View style={styles.prefix}>
            <AppText weight="semibold">{prefix}</AppText>
          </View>
        ) : null}
        {LeftIcon ? <LeftIcon size={16} color={colors.ink3} /> : null}
        <TextInput
          ref={ref}
          {...input}
          editable={!readOnly && input.editable !== false}
          multiline={multiline}
          secureTextEntry={secureToggle ? hidden : secureTextEntry}
          placeholderTextColor={colors.ink3}
          accessibilityLabel={input.accessibilityLabel ?? label}
          onFocus={(e) => {
            setFocused(true);
            input.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            input.onBlur?.(e);
          }}
          style={[styles.input, multiline && { textAlignVertical: 'top', minHeight: 80 }]}
        />
        {secureToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? t('auth.showPassword') : t('auth.hidePassword')}
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
          >
            {hidden ? <Eye size={18} color={colors.ink3} /> : <EyeOff size={18} color={colors.ink3} />}
          </Pressable>
        ) : null}
        {right}
      </View>
      {errorText ? (
        <View style={styles.helperRow} accessibilityLiveRegion="polite">
          <CircleX size={13} color={colors.red} />
          <AppText variant="caption" color={colors.red} style={{ flex: 1 }}>
            {errorText}
          </AppText>
        </View>
      ) : helperText ? (
        <AppText variant="caption" color={colors.ink3}>
          {helperText}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  box: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.slate100,
    borderRadius: radius.input,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  multiline: { alignItems: 'flex-start', paddingVertical: spacing.sm },
  focused: { borderColor: colors.sage, borderWidth: 1.5 },
  error: { borderColor: colors.red, borderWidth: 1.5 },
  prefix: { paddingRight: spacing.sm, borderRightWidth: 1, borderRightColor: colors.stroke },
  input: { flex: 1, fontFamily: fontFamily.regular, fontSize: 15, color: colors.ink, paddingVertical: 12 },
  helperRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
});
