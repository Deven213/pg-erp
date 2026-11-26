import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { CircleCheck, CircleX, Inbox, Lock, WifiOff, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { colors, radius, spacing, tones, type Tone } from '@/theme';
import { ApiError } from '@/api/errors';

type MessageStateProps = {
  icon: LucideIcon;
  tone?: Tone;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
  /** Optional quieter second action. */
  secondaryLabel?: string;
  onSecondary?: () => void;
  testID?: string;
};

/** Centered icon + title + message + actions. Base for empty, error, success and denied states. */
export function MessageState({ icon: Icon, tone = 'info', title, message, actionLabel, onAction, actionLoading, secondaryLabel, onSecondary, testID }: MessageStateProps) {
  const t = tones[tone];
  return (
    <View style={styles.wrap} testID={testID}>
      <View style={[styles.halo, { backgroundColor: t.bg }]}>
        <View style={[styles.big, { backgroundColor: colors.card }]}>
          <Icon size={30} color={t.fg} strokeWidth={1.9} />
        </View>
      </View>
      <AppText variant="bodyLarge" weight="bold" align="center" accessibilityRole="header">
        {title}
      </AppText>
      {message ? (
        <AppText color={colors.ink2} align="center" style={styles.msg}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} loading={actionLoading} fullWidth={false} style={styles.action} />
      ) : null}
      {secondaryLabel && onSecondary ? <Button label={secondaryLabel} variant="ghost" onPress={onSecondary} fullWidth={false} /> : null}
    </View>
  );
}

export function EmptyState(props: Omit<MessageStateProps, 'icon' | 'tone'> & { icon?: LucideIcon }) {
  return <MessageState icon={props.icon ?? Inbox} tone="info" {...props} />;
}

export function SuccessState(props: Omit<MessageStateProps, 'icon' | 'tone'>) {
  return <MessageState icon={CircleCheck} tone="success" {...props} />;
}

/** Error state that turns any thrown error into a friendly, translated message (never raw API text for 5xx/network). */
export function ErrorState({ error, title, onRetry, retrying }: { error: unknown; title?: string; onRetry?: () => void; retrying?: boolean }) {
  const { t } = useTranslation();
  const apiError = ApiError.from(error);
  const offline = apiError.kind === 'network';
  if (apiError.kind === 'forbidden') return <PermissionDeniedState />;
  return (
    <MessageState
      icon={offline ? WifiOff : CircleX}
      tone={offline ? 'neutral' : 'danger'}
      title={offline ? t('states.offlineTitle') : (title ?? t('states.errorTitle'))}
      message={apiError.displayMessage(t)}
      actionLabel={onRetry ? t('common.retry') : undefined}
      onAction={onRetry}
      actionLoading={retrying}
      testID="error-state"
    />
  );
}

export function PermissionDeniedState() {
  const { t } = useTranslation();
  return <MessageState icon={Lock} tone="neutral" title={t('states.deniedTitle')} message={t('states.deniedMessage')} />;
}

/** Shimmer-free pulsing skeleton that mirrors list layouts, so content doesn't jump when it loads. */
export function LoadingState({ rows = 4 }: { rows?: number }) {
  const [pulse] = useState(() => new Animated.Value(0.55));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.55, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const { t } = useTranslation();
  return (
    <Animated.View style={{ opacity: pulse, gap: spacing.md }} accessibilityLabel={t('states.loading')} accessibilityRole="progressbar" testID="loading-state">
      <View style={[styles.skel, { height: 104, borderRadius: radius.card }]} />
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={styles.row}>
          <View style={[styles.skel, styles.circle]} />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={[styles.skel, { height: 11, width: '60%' }]} />
            <View style={[styles.skel, { height: 9, width: '40%' }]} />
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl, gap: spacing.sm },
  halo: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  big: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  msg: { maxWidth: 300 },
  action: { marginTop: spacing.md, minWidth: 200 },
  skel: { backgroundColor: colors.slate100, borderRadius: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radius.card, padding: spacing.lg },
  circle: { width: 40, height: 40, borderRadius: 12 },
});
