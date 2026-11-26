import { AppState, type AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/api/errors';

const RETRYABLE = new Set(['network', 'timeout', 'server']);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Retry only problems that can fix themselves; never retry 4xx.
      retry: (count, error) => count < 2 && RETRYABLE.has(ApiError.from(error).kind),
    },
    mutations: { retry: false },
  },
});

let wired = false;
/** Pauses queries while offline and refetches stale data when the app comes back to the foreground. */
export function wireQueryClientToDevice(): void {
  if (wired) return;
  wired = true;
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((s) => setOnline(s.isConnected !== false && s.isInternetReachable !== false)),
  );
  AppState.addEventListener('change', (status: AppStateStatus) => focusManager.setFocused(status === 'active'));
}
