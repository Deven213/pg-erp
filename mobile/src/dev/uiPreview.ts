import { create } from 'zustand';

/**
 * DEVELOPMENT-ONLY UI PREVIEW — this is NOT authentication.
 *
 * Lets a developer open the Owner or Resident navigation trees to review screens before the
 * login response contract is confirmed. It creates no tokens and makes no API calls; any screen
 * that calls the API in preview gets the normal 401 handling.
 *
 * Enabled only when BOTH are true:
 *   • __DEV__ (a development bundle — Metro / Expo Go), and
 *   • EXPO_PUBLIC_ENABLE_UI_PREVIEW=true in .env
 * In a release build `__DEV__` is false, so this code path is removed by the bundler.
 */
export const isUiPreviewEnabled: boolean = __DEV__ && process.env.EXPO_PUBLIC_ENABLE_UI_PREVIEW === 'true';

export type PreviewRole = 'owner' | 'resident';

type UiPreviewState = {
  role: PreviewRole | null;
  start: (role: PreviewRole) => void;
  stop: () => void;
};

export const useUiPreview = create<UiPreviewState>((set) => ({
  role: null,
  start: (role) => {
    if (isUiPreviewEnabled) set({ role });
  },
  stop: () => set({ role: null }),
}));
