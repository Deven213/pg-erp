import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { CircleX, Database, Eye, LogOut, Trash2 } from 'lucide-react-native';

import { AppText } from '@/components/common/AppText';
import { ActionSheet } from '@/components/common/Blocks';
import { previewPropertyStore } from '@/features/properties/previewPropertyStore';
import { colors, spacing } from '@/theme';
import { useUiPreview } from './uiPreview';

/**
 * DEVELOPMENT ONLY. Slim strip shown on every screen while in UI preview, so preview is never mistaken for a
 * real session. Its "Dev tools" sheet holds the preview-data controls, keeping them out of the product UI.
 * Never rendered in release builds: preview can only start when __DEV__ is true.
 */
export function UiPreviewBanner() {
  const { role, stop } = useUiPreview();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  if (!role) return null;
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['properties', 'preview'] });
    void qc.invalidateQueries({ queryKey: ['inventory', 'preview'] });
  };

  return (
    <View style={styles.bar} accessibilityRole="alert" testID="ui-preview-banner">
      <Eye size={12} color={colors.accentDark} />
      <AppText variant="caption" weight="semibold" color={colors.accentDark} style={[styles.flex, styles.small]} numberOfLines={1}>
        Dev preview · sample data
      </AppText>
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} hitSlop={12} testID="preview-dev-tools">
        <AppText variant="caption" weight="bold" color={colors.brand} style={styles.small}>
          Dev tools
        </AppText>
      </Pressable>
      <ActionSheet
        visible={open}
        onClose={() => setOpen(false)}
        title="Development preview"
        items={[
          {
            label: 'Add 3 sample properties',
            icon: Database,
            testID: 'preview-add-samples',
            onPress: () => {
              previewPropertyStore.addSamples(3);
              refresh();
            },
          },
          { label: 'Fail the next request', icon: CircleX, testID: 'preview-fail-next', onPress: () => previewPropertyStore.failNextRequest() },
          {
            label: 'Clear sample data',
            icon: Trash2,
            testID: 'preview-clear',
            onPress: () => {
              previewPropertyStore.reset();
              refresh();
            },
          },
          { label: 'Exit preview', icon: LogOut, destructive: true, onPress: stop },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.accentSoft, paddingHorizontal: spacing.lg, height: 26 },
  flex: { flex: 1 },
  small: { fontSize: 11, lineHeight: 14 },
});
