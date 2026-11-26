import { useState } from 'react';
import { ServerCrash } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/auth/session';
import { Button, MessageState, Screen } from '@/components';

/** Shown when a saved session exists but the server can't be reached to renew it (offline or cold start). */
export function RestoreFailedScreen() {
  const { t } = useTranslation();
  const { restore, logout } = useSession();
  const [busy, setBusy] = useState(false);
  return (
    <Screen edges={['top', 'bottom']}>
      <MessageState
        icon={ServerCrash}
        tone="neutral"
        title={t('auth.restoreFailed')}
        message={t('errors.timeout')}
        actionLabel={t('common.retry')}
        actionLoading={busy}
        onAction={async () => {
          setBusy(true);
          await restore();
          setBusy(false);
        }}
      />
      <Button label={t('auth.logout')} variant="ghost" onPress={() => void logout()} disabled={busy} />
    </Screen>
  );
}
