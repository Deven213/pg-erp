import { useState } from 'react';
import { LogOut } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/auth/session';
import { ConfirmDialog, ListGroup, ListItem } from '@/components';
import { useToast } from '@/providers/ToastProvider';

/** "Log out" row + confirmation dialog, shared by the Owner More tab and the Resident Profile tab. */
export function LogoutAction() {
  const { t } = useTranslation();
  const logout = useSession((s) => s.logout);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <ListGroup>
        <ListItem icon={LogOut} iconTone="danger" title={t('auth.logout')} onPress={() => setOpen(true)} last testID="logout-row" />
      </ListGroup>
      <ConfirmDialog
        visible={open}
        icon={LogOut}
        destructive
        title={t('auth.logoutTitle')}
        message={t('auth.logoutMessage')}
        confirmLabel={t('auth.logout')}
        loading={busy}
        onCancel={() => setOpen(false)}
        onConfirm={async () => {
          setBusy(true);
          await logout();
          toast.show(t('auth.loggedOut'));
        }}
      />
    </>
  );
}
