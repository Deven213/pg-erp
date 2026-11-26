import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { colors, radius, spacing } from '@/theme';
import { isUiPreviewEnabled, useUiPreview } from './uiPreview';

/** Shown under the login form in development builds only. Clearly separate from real login. */
export function UiPreviewEntry() {
  const start = useUiPreview((s) => s.start);
  if (!isUiPreviewEnabled) return null;
  return (
    <View style={styles.box} testID="ui-preview-entry">
      <AppText variant="overline" color={colors.amber}>
        Development only · UI preview
      </AppText>
      <AppText variant="caption" color={colors.ink2}>
        Browse the screens without logging in. Not authentication: nothing is loaded from the server.
      </AppText>
      <View style={styles.row}>
        <Button label="Preview Owner app" variant="secondary" size="sm" onPress={() => start('owner')} style={{ flex: 1 }} testID="preview-owner" />
        <Button label="Preview Resident app" variant="secondary" size="sm" onPress={() => start('resident')} style={{ flex: 1 }} testID="preview-resident" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#F2D9A6', backgroundColor: colors.amber50, borderRadius: radius.card, padding: spacing.md, gap: spacing.sm, marginTop: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
});
