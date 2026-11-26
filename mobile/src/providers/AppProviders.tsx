import { useEffect, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';

import '@/i18n';
import { installAuthBridge, onSignOut } from '@/auth/session';
import { useUiPreview } from '@/dev/uiPreview';
import { previewPropertyStore } from '@/features/properties/previewPropertyStore';
import { setPropertyScopePersistence, usePropertyContext } from '@/store/propertyContext';
import { queryClient, wireQueryClientToDevice } from './queryClient';
import { ToastProvider } from './ToastProvider';

installAuthBridge();
wireQueryClientToDevice();
// Nothing from one account may survive into the next login.
onSignOut(() => {
  queryClient.clear();
  usePropertyContext.getState().reset();
  useUiPreview.getState().stop();
});
// Development UI preview: its property data and choices stay in memory and are dropped when it starts or ends.
useUiPreview.subscribe((state, prev) => {
  if (state.role === prev.role) return;
  setPropertyScopePersistence(state.role === null);
  usePropertyContext.getState().reset();
  previewPropertyStore.reset();
  queryClient.removeQueries({ queryKey: ['properties', 'preview'] });
});

export function AppProviders({ children }: { children: ReactNode }) {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  useEffect(() => {
    // Fall back to system fonts rather than blocking the app if Inter fails to load.
    if (fontError) console.warn('Inter font failed to load; using system font.');
  }, [fontError]);
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
