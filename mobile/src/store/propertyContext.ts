import { create } from 'zustand';

import { tokenStorage } from '@/auth/tokenStorage';

/** 'all' = consolidated business view; otherwise a property UUID. */
export type PropertyScope = 'all' | string;

type PropertyContextState = {
  scope: PropertyScope;
  /** True once the saved choice has been read from the device. */
  hydrated: boolean;
  setScope: (scope: PropertyScope) => void;
  /** Reads the saved choice. Safe to call more than once. */
  hydrate: () => Promise<void>;
  reset: () => void;
};

/** Persisting is switched off in the development UI preview, so preview choices never reach a real session. */
let persist = true;
export function setPropertyScopePersistence(enabled: boolean): void {
  persist = enabled;
}

/**
 * The owner's current property scope (the switcher chip in the wireframe, D-01/D-02).
 * Include `scope` in every TanStack Query key for property-scoped data so switching never shows another property's cache.
 * Saved on the device (cleared on sign-out) so the choice survives restarts, as the wireframe specifies.
 */
export const usePropertyContext = create<PropertyContextState>((set, get) => ({
  scope: 'all',
  hydrated: false,
  setScope: (scope) => {
    set({ scope });
    // Saving is best effort: a storage failure must never block switching.
    if (persist) void Promise.resolve().then(() => tokenStorage.setPropertyScope(scope)).catch(() => undefined);
  },
  async hydrate() {
    if (get().hydrated) return;
    let saved: string | null = null;
    if (persist) {
      try {
        saved = await tokenStorage.getPropertyScope();
      } catch {
        // Unreadable storage: fall back to All Properties.
      }
    }
    // Don't overwrite a choice the user made while storage was being read.
    set((s) => ({ hydrated: true, scope: s.scope === 'all' && saved ? saved : s.scope }));
  },
  reset: () => set({ scope: 'all', hydrated: false }),
}));
