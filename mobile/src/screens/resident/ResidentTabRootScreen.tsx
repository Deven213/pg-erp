import { AppHeader, Screen } from '@/components';
import { residentModules } from '@/constants/modules';
import type { ResidentModuleKey } from '@/navigation/types';
import { ModulePlaceholder } from '@/screens/shared/ModulePlaceholder';
import { LogoutAction } from '@/screens/shared/LogoutAction';

/** Placeholder for Resident tabs until resident APIs exist (all resident modules are blocked on backend). */
export function ResidentTabRootScreen({ moduleKey, title, showLogout }: { moduleKey: ResidentModuleKey; title: string; showLogout?: boolean }) {
  return (
    <Screen header={<AppHeader title={title} />}>
      <ModulePlaceholder module={residentModules[moduleKey]} />
      {showLogout ? <LogoutAction /> : null}
    </Screen>
  );
}
