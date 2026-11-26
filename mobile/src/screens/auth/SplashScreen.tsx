import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { BedDouble } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components';
import { colors, spacing } from '@/theme';

/** Wireframe A-01: navy splash while the stored session is checked. */
export function SplashScreen() {
  const { t } = useTranslation();
  return (
    <View style={styles.root} testID="splash">
      <View style={styles.logo}>
        <BedDouble size={40} color={colors.brand} />
      </View>
      <AppText variant="display" color={colors.white}>
        {t('common.appName')}
      </AppText>
      <AppText color="#CFE0D6">{t('common.tagline')}</AppText>
      <View style={{ height: spacing.xxl }} />
      <ActivityIndicator color={colors.white} accessibilityLabel={t('auth.restoring')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  logo: { width: 84, height: 84, borderRadius: 24, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
});
