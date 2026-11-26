import { StyleSheet, View } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/common/AppText';
import { useIsOnline } from '@/hooks/useNetworkStatus';
import { colors, spacing } from '@/theme';

/** Dark strip shown at the top of every screen while the device is offline. */
export function OfflineBanner() {
  const online = useIsOnline();
  const { t } = useTranslation();
  if (online !== false) return null;
  return (
    <View style={styles.bar} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <WifiOff size={14} color={colors.white} />
      <AppText variant="caption" color={colors.white}>
        {t('states.offlineBanner')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.ink, paddingHorizontal: spacing.lg, paddingVertical: 7 },
});
