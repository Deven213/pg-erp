import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Badge, Card } from '@/components';
import type { ApiStatus, ModuleInfo } from '@/constants/modules';
import { colors, spacing, type Tone } from '@/theme';

const statusTone: Record<ApiStatus, Tone> = { available: 'success', partial: 'warning', missing: 'neutral' };
const statusKey: Record<ApiStatus, string> = { available: 'modules.apiAvailable', partial: 'modules.apiPartial', missing: 'modules.apiMissing' };
const bodyKey: Record<ApiStatus, string> = {
  available: 'modules.placeholderAvailable',
  partial: 'modules.placeholderPartial',
  missing: 'modules.placeholderMissing',
};

/**
 * Compact, honest placeholder for modules not built yet. States the backend readiness instead of showing
 * fake data, so testers can tell "not built" apart from "broken".
 */
export function ModulePlaceholder({ module }: { module: ModuleInfo }) {
  const { t } = useTranslation();
  const Icon = module.icon;
  return (
    <View style={styles.wrap} testID={`placeholder-${module.key}`}>
      <View style={styles.art}>
        <Icon size={28} color={colors.brand} strokeWidth={1.8} />
      </View>
      <AppText variant="title" align="center" accessibilityRole="header">
        {t('modules.placeholderTitle', { name: module.title })}
      </AppText>
      <AppText color={colors.ink2} align="center" style={styles.msg}>
        {t(bodyKey[module.apiStatus])}
      </AppText>
      <Card style={styles.card}>
        <View style={styles.row}>
          <AppText variant="bodySmall" weight="semibold">
            {t('modules.backendStatus')}
          </AppText>
          <Badge label={t(statusKey[module.apiStatus])} tone={statusTone[module.apiStatus]} />
        </View>
        <AppText variant="bodySmall" color={colors.ink2}>
          {module.apiNote}
        </AppText>
      </Card>
    </View>
  );
}

export { statusKey, statusTone };

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.xl },
  art: { width: 68, height: 68, borderRadius: 22, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  msg: { maxWidth: 320 },
  card: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
