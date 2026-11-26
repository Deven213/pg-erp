import { create, isAxiosError, type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';

import { accessTokenExpiresAt } from '@/auth/authContract';
import { env } from '@/config/env';
import { unauthenticatedPaths } from './endpoints';
import { ApiError } from './errors';
import { isApiEnvelope, type ApiEnvelope } from './types/envelope';

/**
 * Hooks the session layer plugs in at startup. Keeps the client free of any
 * import of the auth store (no circular dependency) and easy to test.
 */
export type AuthBridge = {
  getAccessToken: () => string | null;
  /** Returns a fresh access token, or throws if the session can't be renewed. */
  refreshAccessToken: () => Promise<string>;
  onSessionExpired: () => void;
};

let bridge: AuthBridge | null = null;
export function configureAuthBridge(next: AuthBridge | null): void {
  bridge = next;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

/** Refresh this long before the JWT `exp` time to allow for clock drift and slow networks. */
export const REFRESH_MARGIN_MS = 30_000;

const isAuthFree = (url?: string) => !!url && unauthenticatedPaths.some((p) => url.endsWith(p));

/** One refresh at a time: concurrent 401s wait for the same refresh call. */
let inFlightRefresh: Promise<string> | null = null;
function refreshOnce(): Promise<string> {
  if (!bridge) return Promise.reject(new ApiError('unauthorized'));
  if (!inFlightRefresh) {
    inFlightRefresh = bridge.refreshAccessToken().finally(() => {
      inFlightRefresh = null;
    });
  }
  return inFlightRefresh;
}

export function createApiClient(baseURL: string = env.apiBaseUrl): AxiosInstance {
  const instance = create({
    baseURL,
    timeout: env.apiTimeoutMs,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  });

  instance.interceptors.request.use(async (config) => {
    if (isAuthFree(config.url)) return config;
    let token = bridge?.getAccessToken() ?? null;
    // Renew a token that is about to expire, so the request doesn't need a 401 round trip.
    const expiresAt = token ? accessTokenExpiresAt(token) : null;
    if (token && expiresAt !== null && expiresAt - Date.now() < REFRESH_MARGIN_MS) {
      try {
        token = await refreshOnce();
      } catch {
        // Send with the current token; the 401 handler below decides whether the session is over.
      }
    }
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
    return config;
  });

  instance.interceptors.response.use(
    (response) => {
      // Some APIs return HTTP 200 with success:false — treat that as an error too.
      if (isApiEnvelope(response.data) && response.data.success === false) {
        return Promise.reject(
          new ApiError('business', { status: response.status, serverMessage: response.data.errorMessage ?? response.data.message }),
        );
      }
      return response;
    },
    async (error: unknown) => {
      const apiError = ApiError.from(error);
      const config = (isAxiosError(error) ? error.config : undefined) as RetriableConfig | undefined;

      if (apiError.kind === 'unauthorized' && config && !config._retried && !isAuthFree(config.url) && bridge) {
        config._retried = true;
        try {
          const token = await refreshOnce();
          config.headers.set('Authorization', `Bearer ${token}`);
          return instance.request(config);
        } catch {
          bridge.onSessionExpired();
          return Promise.reject(new ApiError('unauthorized', { status: 401 }));
        }
      }
      return Promise.reject(apiError);
    },
  );

  return instance;
}

export const apiClient = createApiClient();

/**
 * Performs a request and returns the envelope's `data`.
 * Throws ApiError for HTTP errors, success:false, or a body that isn't the documented envelope.
 */
export async function apiRequest<TData = unknown>(config: AxiosRequestConfig, client: AxiosInstance = apiClient): Promise<TData> {
  const response = await client.request<unknown>(config);
  if (!isApiEnvelope(response.data)) throw new ApiError('contract', { status: response.status });
  return (response.data as ApiEnvelope<TData>).data;
}
