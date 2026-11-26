import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { colors, radius, spacing } from '@/theme';
import { AppText } from './AppText';
import { IconButton } from './AppHeader';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
};

/**
 * Modal bottom sheet for pickers, filters and the property switcher.
 * Built on RN Modal to avoid extra native dependencies in the foundation;
 * can be swapped for a gesture-driven sheet later without changing callers.
 */
export function BottomSheet({ visible, onClose, title, subtitle, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Close" onPress={onClose}>
          <View style={styles.scrim} />
        </Pressable>
        <View style={[styles.sheet, { paddingBottom: spacing.xl + insets.bottom }]} accessibilityViewIsModal>
          <View style={styles.grab} />
          {title ? (
            <View style={styles.head}>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyLarge" weight="bold">
                  {title}
                </AppText>
                {subtitle ? (
                  <AppText variant="caption" color={colors.ink2}>
                    {subtitle}
                  </AppText>
                ) : null}
              </View>
              <IconButton label="Close" onPress={onClose}>
                <X size={18} color={colors.ink} />
              </IconButton>
            </View>
          ) : null}
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { flex: 1, backgroundColor: colors.scrim },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    maxHeight: '86%',
  },
  grab: { width: 40, height: 4, borderRadius: 9, backgroundColor: colors.stroke, alignSelf: 'center', marginBottom: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  body: { gap: spacing.md },
});
