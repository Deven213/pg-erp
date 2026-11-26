import { useRef } from 'react';
import { StyleSheet, View, type TextInputInstance } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { BedDouble, Lock, Mail } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { ApiError } from '@/api/errors';
import { useSession } from '@/auth/session';
import { AppText, Button, Screen, TextField } from '@/components';
import { UiPreviewEntry } from '@/dev/UiPreviewEntry';
import { colors, spacing, tones } from '@/theme';
import { loginSchema, type LoginForm } from './loginSchema';

/**
 * Email + password login, matching POST /api/v1/auth/login (the only login the API offers in v0.1.0).
 * Styled after wireframe A-06.
 */
export function LoginScreen() {
  const { t } = useTranslation();
  const login = useSession((s) => s.login);
  const expired = useSession((s) => s.expired);
  const passwordRef = useRef<TextInputInstance>(null);

  const { control, handleSubmit, formState } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  const mutation = useMutation({
    mutationFn: (values: LoginForm) => login({ email: values.email.trim(), password: values.password }),
  });

  // isPending blocks the button, so a double tap can't send two logins.
  const submit = handleSubmit((values) => {
    if (!mutation.isPending) mutation.mutate(values);
  });

  const error = mutation.error ? ApiError.from(mutation.error) : null;
  // 401 on login means wrong credentials, not an expired session.
  const errorText = error ? (error.kind === 'unauthorized' && error.serverMessage ? error.serverMessage : error.displayMessage(t)) : null;

  return (
    <Screen edges={['top', 'bottom']} footer={<Button label={t('auth.loginButton')} onPress={() => void submit()} loading={mutation.isPending} testID="login-submit" />}>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <BedDouble size={30} color={colors.white} />
        </View>
        <AppText variant="title" accessibilityRole="header">
          {t('auth.loginTitle')}
        </AppText>
        <AppText color={colors.ink2}>{t('auth.loginSubtitle')}</AppText>
      </View>

      {expired && !mutation.isError ? <Banner tone="warning" text={t('auth.sessionExpired')} /> : null}
      {errorText ? <Banner tone="danger" text={errorText} testID="login-error" /> : null}

      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField
            testID="login-email"
            label={t('auth.email')}
            required
            leftIcon={Mail}
            placeholder={t('auth.emailPlaceholder')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="username"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            maxLength={255}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <TextField
            ref={passwordRef}
            testID="login-password"
            label={t('auth.password')}
            required
            leftIcon={Lock}
            placeholder={t('auth.passwordPlaceholder')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            secureToggle
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={() => void submit()}
            maxLength={128}
          />
        )}
      />
      {formState.submitCount > 0 && !formState.isValid ? (
        <AppText variant="caption" color={colors.red}>
          {t('validation.fixFields')}
        </AppText>
      ) : null}
      <AppText variant="caption" color={colors.ink3} align="center">
        {t('auth.forgotPassword')}
      </AppText>
      <UiPreviewEntry />
    </Screen>
  );
}

function Banner({ tone, text, testID }: { tone: 'warning' | 'danger'; text: string; testID?: string }) {
  const c = tones[tone];
  return (
    <View style={[styles.banner, { backgroundColor: c.bg }]} accessibilityRole="alert" testID={testID}>
      <AppText variant="bodySmall" color={c.fg}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.sm, paddingTop: spacing.xxxl, paddingBottom: spacing.sm },
  logo: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  banner: { borderRadius: 12, padding: spacing.md },
});
