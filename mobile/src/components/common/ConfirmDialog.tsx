import { Modal, Pressable, StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { colors, spacing, tones } from '@/theme';
import { AppText } from './AppText';
import { Button } from './Button';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  /** Button label should repeat the action, e.g. "Delete" or "Log out". */
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: LucideIcon;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({ visible, title, message, confirmLabel, cancelLabel, destructive, icon: Icon, loading, onConfirm, onCancel }: ConfirmDialogProps) {
  const { t } = useTranslation();
  const tone = destructive ? tones.danger : tones.info;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={[StyleSheet.absoluteFill, styles.scrim]} onPress={loading ? undefined : onCancel} accessibilityLabel={cancelLabel ?? t('common.cancel')} />
        <View style={styles.dialog} accessibilityRole="alert" accessibilityViewIsModal>
          {Icon ? (
            <View style={[styles.tile, { backgroundColor: tone.bg }]}>
              <Icon size={20} color={tone.fg} />
            </View>
          ) : null}
          <AppText variant="bodyLarge" weight="bold">
            {title}
          </AppText>
          <AppText color={colors.ink2}>{message}</AppText>
          <View style={styles.row}>
            <Button label={cancelLabel ?? t('common.cancel')} variant="secondary" onPress={onCancel} disabled={loading} style={{ flex: 1 }} />
            <Button label={confirmLabel} variant={destructive ? 'danger' : 'primary'} onPress={onConfirm} loading={loading} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', padding: 22 },
  scrim: { backgroundColor: colors.scrim },
  dialog: { backgroundColor: colors.card, borderRadius: 18, padding: 18, gap: spacing.md },
  tile: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});
