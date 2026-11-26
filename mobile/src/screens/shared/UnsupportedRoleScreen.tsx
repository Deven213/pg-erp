import { useState } from 'react';
import { ShieldX } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/auth/session';
import { Button, MessageState, Screen } from '@/components';

/**
 * Shown when login succeeds but the role can't be matched to Owner or Resident (or is Super Admin).
 * Deliberately offers no way in — the user can only log out.
 */
export function UnsupportedRoleScreen() {
  const { t } = useTranslation();
  const logout = useSession((s) => s.logout);
  const [busy, setBusy] = useState(false);
  return (
    <Screen edges={['top', 'bottom']}>
      <MessageState icon={ShieldX} tone="warning" title={t('auth.unsupportedRoleTitle')} message={t('auth.unsupportedRoleMessage')} testID="unsupported-role" />
      <Button
        label={t('auth.logout')}
        variant="secondary"
        loading={busy}
        onPress={async () => {
          setBusy(true);
          await logout();
        }}
      />
    </Screen>
  );
}
