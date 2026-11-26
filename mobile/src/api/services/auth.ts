import { apiRequest } from '../client';
import { endpoints } from '../endpoints';
import type { LoginRequest, LogoutRequest, RefreshRequest } from '../types/models';

/**
 * Authentication endpoints (OpenAPI tag "Authentication"). Return values are the raw envelope `data`;
 * reading tokens/role out of it is done only in src/auth/authContract.ts.
 */
export const authService = {
  login: (body: LoginRequest) => apiRequest<unknown>({ method: 'POST', url: endpoints.auth.login, data: body }),
  refresh: (body: RefreshRequest) => apiRequest<unknown>({ method: 'POST', url: endpoints.auth.refresh, data: body }),
  logout: (body: LogoutRequest) => apiRequest<unknown>({ method: 'POST', url: endpoints.auth.logout, data: body }),
};

export const healthService = {
  check: () => apiRequest<unknown>({ method: 'GET', url: endpoints.health }),
};
