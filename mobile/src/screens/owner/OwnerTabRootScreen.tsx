import { Layers, MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { AppHeader, AppText, Card, Screen } from '@/components';
import { ownerModules } from '@/constants/modules';
import { OwnerPropertySwitcher } from '@/features/properties/OwnerPropertySwitcher';
import { usePropertyScope } from '@/features/properties/usePropertyScope';
import type { OwnerModuleKey } from '@/navigation/types';
import { ModulePlaceholder } from '@/screens/shared/ModulePlaceholder';
import { colors, spacing } from '@/theme';

/**
 * Temporary root for an Owner tab whose module isn't built yet (Home, Residents, Finance).
 * It already follows the shared property context: the switcher sits in the header and the
 * current selection is shown, so these modules plug into the same scope when they are built.
 */
export function OwnerTabRootScreen({ moduleKey, title }: { moduleKey: OwnerModuleKey; title: string }) {
  const { t } = useTranslation();
  const isHome = moduleKey === 'dashboard';
  return (
    <Screen
      header={
        <AppHeader large top={<OwnerPropertySwitcher />} title={isHome ? t('dashboard.title') : title} />
      }
    >
      <ScopeNotice />
      <ModulePlaceholder module={ownerModules[moduleKey]} />
    </Screen>
  );
}

/** States which property the screen is showing, so the context is visible on every Owner tab. */
function ScopeNotice() {
  const { t } = useTranslation();
  const { selected, properties } = usePropertyScope();
  if (properties.length === 0) return null;
  const Icon = selected ? MapPin : Layers;
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }} testID="scope-notice">
      <Icon size={16} color={colors.sage} />
      <AppText variant="bodySmall" color={colors.ink2} style={{ flex: 1 }}>
        {t('properties.showing', { name: selected ? selected.name : t('common.allProperties') })}
      </AppText>
    </Card>
  );
}
