import { useEffect, type ReactNode } from 'react';
import { DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import { useSession } from '@/auth/session';
import { isUiPreviewEnabled, useUiPreview } from '@/dev/uiPreview';
import { RestoreFailedScreen } from '@/screens/auth/RestoreFailedScreen';
import { SplashScreen } from '@/screens/auth/SplashScreen';
import { UnsupportedRoleScreen } from '@/screens/shared/UnsupportedRoleScreen';
import { colors } from '@/theme';
import { AuthNavigator } from './AuthNavigator';
import { OwnerNavigator } from './OwnerNavigator';
import { ResidentNavigator } from './ResidentNavigator';

const navTheme: Theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.background, card: colors.card, primary: colors.sage, text: colors.ink, border: colors.stroke },
};

/**
 * Chooses ONE navigation tree from the session. Trees for other roles are not mounted at all,
 * so a resident can't navigate to an owner screen even by deep link. The server still enforces permissions.
 */
export function RootNavigator() {
  const { status, role, restore } = useSession();
  useEffect(() => {
    void restore();
  }, [restore]);

  // Development-only UI preview (see src/dev/uiPreview.ts). Never applies to a real session.
  const previewRole = useUiPreview((s) => s.role);

  let tree: ReactNode;
  if (status === 'restoring') tree = <SplashScreen />;
  else if (status === 'restoreFailed') tree = <RestoreFailedScreen />;
  else if (status === 'signedOut' && isUiPreviewEnabled && previewRole === 'owner') tree = <OwnerNavigator />;
  else if (status === 'signedOut' && isUiPreviewEnabled && previewRole === 'resident') tree = <ResidentNavigator />;
  else if (status === 'signedOut') tree = <AuthNavigator />;
  else if (role === 'owner') tree = <OwnerNavigator />;
  else if (role === 'resident') tree = <ResidentNavigator />;
  else tree = <UnsupportedRoleScreen />;

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={status === 'restoring' ? 'light' : 'dark'} />
      {tree}
    </NavigationContainer>
  );
}
