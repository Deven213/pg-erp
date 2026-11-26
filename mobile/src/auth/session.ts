import { create } from 'zustand';

import { configureAuthBridge } from '@/api/client';
import { ApiError } from '@/api/errors';
import { authService } from '@/api/services/auth';
import type { LoginRequest } from '@/api/types/models';
import { parseTokenData, resolveRole, resolveTenantId, type AppRole } from './authContract';
import { tokenStorage } from './tokenStorage';

export type SessionStatus = 'restoring' | 'signedOut' | 'signedIn' | 'restoreFailed';

type SessionState = {
  status: SessionStatus;
  role: AppRole;
  /** In memory only — never persisted. */
  accessToken: string | null;
  /** The owner's business id, if the login/refresh response carries one (unverified — see resolveTenantId). In memory only. */
  tenantId: string | null;
  /** Set when the session ended on its own (refresh rejected), so the login screen can explain why. */
  expired: boolean;
  restore: () => Promise<void>;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  /** Called by the API client when a refresh fails. */
  expire: () => Promise<void>;
};

/** Side effects other modules register on sign-out (clear query cache, reset property scope). */
const signOutListeners = new Set<() => void>();
export function onSignOut(listener: () => void): () => void {
  signOutListeners.add(listener);
  return () => signOutListeners.delete(listener);
}

async function applyTokens(data: unknown, fallbackRole: AppRole | null): Promise<{ accessToken: string; role: AppRole; tenantId: string | null }> {
  const tokens = parseTokenData(data);
  if (tokens.refreshToken) await tokenStorage.setRefreshToken(tokens.refreshToken);
  let role = resolveRole(data, tokens.accessToken);
  if (role === 'unknown' && fallbackRole) role = fallbackRole;
  if (role !== 'unknown') await tokenStorage.setRole(role);
  return { accessToken: tokens.accessToken, role, tenantId: resolveTenantId(data, tokens.accessToken) };
}

/** Clears stored tokens and app caches. Never throws: a storage failure must not trap the user in a session. */
async function clearLocalSession(): Promise<void> {
  try {
    await tokenStorage.clear();
  } catch {
    // Keychain/Keystore unavailable — the in-memory session is still cleared below.
  }
  signOutListeners.forEach((l) => l());
}

/** Rejections that mean the stored refresh token is no longer usable (verified responses, 24 Nov 2026):
 *  401 "Refresh token is invalid, expired, or revoked." · 422 "Request validation failed." */
const isDeadRefreshToken = (e: ApiError) => e.kind === 'unauthorized' || e.kind === 'validation';
const isTransient = (e: ApiError) => e.kind === 'network' || e.kind === 'timeout' || e.kind === 'server';

export const useSession = create<SessionState>((set, get) => ({
  status: 'restoring',
  role: 'unknown',
  accessToken: null,
  tenantId: null,
  expired: false,

  async restore() {
    set({ status: 'restoring' });
    let refreshToken: string | null;
    let storedRole: AppRole | null;
    try {
      refreshToken = await tokenStorage.getRefreshToken();
      storedRole = (await tokenStorage.getRole()) as AppRole | null;
    } catch {
      // Secure storage unreadable (e.g. keystore reset after a device restore): start clean instead of hanging on splash.
      await clearLocalSession();
      set({ status: 'signedOut', accessToken: null, tenantId: null, role: 'unknown', expired: false });
      return;
    }
    if (!refreshToken) {
      set({ status: 'signedOut', accessToken: null, tenantId: null, role: 'unknown' });
      return;
    }
    try {
      const data = await authService.refresh({ refresh_token: refreshToken });
      const { accessToken, role, tenantId } = await applyTokens(data, storedRole);
      set({ status: 'signedIn', accessToken, tenantId, role, expired: false });
    } catch (e) {
      const err = ApiError.from(e);
      if (isTransient(err)) {
        // Keep the stored token: the session may still be valid once the server is reachable.
        set({ status: 'restoreFailed' });
        return;
      }
      await clearLocalSession();
      // Only say "session expired" when the server actually rejected the token.
      set({ status: 'signedOut', accessToken: null, tenantId: null, role: 'unknown', expired: isDeadRefreshToken(err) });
    }
  },

  async login(credentials) {
    const data = await authService.login(credentials);
    // Drop anything left from a previous account before saving the new session.
    await clearLocalSession();
    const { accessToken, role, tenantId } = await applyTokens(data, null);
    set({ status: 'signedIn', accessToken, tenantId, role, expired: false });
  },

  async logout() {
    let refreshToken: string | null = null;
    try {
      refreshToken = await tokenStorage.getRefreshToken();
    } catch {
      // Can't read it — still sign out locally.
    }
    // Best effort: revoke on the server (a 401 "already revoked" is fine), but always sign out locally even if offline.
    if (refreshToken) await authService.logout({ refresh_token: refreshToken }).catch(() => undefined);
    await clearLocalSession();
    set({ status: 'signedOut', accessToken: null, tenantId: null, role: 'unknown', expired: false });
  },

  async expire() {
    if (get().status !== 'signedIn') return;
    await clearLocalSession();
    set({ status: 'signedOut', accessToken: null, tenantId: null, role: 'unknown', expired: true });
  },
}));

/** Connects the API client to this store. Call once at startup. */
export function installAuthBridge(): void {
  configureAuthBridge({
    getAccessToken: () => useSession.getState().accessToken,
    async refreshAccessToken() {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) throw new ApiError('unauthorized');
      const data = await authService.refresh({ refresh_token: refreshToken });
      const { accessToken, tenantId } = await applyTokens(data, useSession.getState().role);
      useSession.setState(tenantId ? { accessToken, tenantId } : { accessToken });
      return accessToken;
    },
    onSessionExpired: () => void useSession.getState().expire(),
  });
}
