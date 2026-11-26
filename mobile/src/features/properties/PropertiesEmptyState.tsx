import { StyleSheet, View } from 'react-native';
import { BedDouble, Building2, ChartPie, Plus, Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react-native';

import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { colors, spacing } from '@/theme';

/**
 * First-run state when the owner has no properties. Compact and top-aligned so the
 * primary action is visible immediately on small Android screens without scrolling.
 */
export function PropertiesEmptyState({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap} testID="properties-empty">
      <View style={styles.art}>
        <View style={styles.artInner}>
          <Building2 size={30} color={colors.brand} strokeWidth={1.8} />
        </View>
        <View style={styles.artDot} />
      </View>
      <AppText variant="title" align="center" accessibilityRole="header">
        {t('properties.emptyTitle')}
      </AppText>
      <AppText color={colors.ink2} align="center" style={styles.message}>
        {t('properties.emptyMessage')}
      </AppText>
      <Button label={t('properties.addFirst')} icon={Plus} onPress={onAdd} style={styles.cta} testID="add-first-property" />
      <View style={styles.benefits}>
        <Benefit icon={BedDouble} text={t('properties.benefitBeds')} />
        <Benefit icon={ChartPie} text={t('properties.benefitOccupancy')} />
        <Benefit icon={Users} text={t('properties.benefitResidents')} />
      </View>
    </View>
  );
}

function Benefit({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <View style={styles.benefit}>
      <Icon size={16} color={colors.sage} />
      <AppText variant="bodySmall" color={colors.ink2} style={{ flex: 1 }}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: spacing.xl, gap: spacing.sm },
  art: { width: 76, height: 76, marginBottom: spacing.sm },
  artInner: { flex: 1, borderRadius: 24, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  artDot: { position: 'absolute', right: -4, top: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.accent, borderWidth: 3, borderColor: colors.background },
  message: { maxWidth: 320 },
  cta: { alignSelf: 'stretch', marginTop: spacing.md },
  benefits: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.stroke },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
