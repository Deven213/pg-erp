import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppHeader, Screen } from '@/components';
import { ownerModules } from '@/constants/modules';
import type { OwnerStackParamList } from '@/navigation/types';
import { ModulePlaceholder } from '@/screens/shared/ModulePlaceholder';

type Props = NativeStackScreenProps<OwnerStackParamList, 'OwnerModule'>;

/** Stack screen opened from More for modules that aren't built yet. */
export function OwnerModuleScreen({ route, navigation }: Props) {
  const module = ownerModules[route.params.moduleKey];
  return (
    <Screen header={<AppHeader title={module.title} onBack={navigation.goBack} />}>
      <ModulePlaceholder module={module} />
    </Screen>
  );
}
