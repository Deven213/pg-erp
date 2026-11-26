import { useNavigation, type NavigationProp } from '@react-navigation/native';

import { PropertySwitcher } from '@/components/property/PropertySwitcher';
import type { OwnerStackParamList } from '@/navigation/types';
import { propertySubtitle, usePropertyScope } from './usePropertyScope';

/** The switcher wired to the real property list and the shared property context. Used in Owner screen headers. */
export function OwnerPropertySwitcher() {
  const navigation = useNavigation<NavigationProp<OwnerStackParamList>>();
  const { properties, scope, setScope } = usePropertyScope();
  return (
    <PropertySwitcher
      properties={properties.map((p) => ({ id: p.id, name: p.name, subtitle: propertySubtitle(p) || undefined }))}
      scope={scope}
      onChange={setScope}
      onAddProperty={() => navigation.navigate('PropertyForm', {})}
    />
  );
}
