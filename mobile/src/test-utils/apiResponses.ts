import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';

import { ApiError } from '@/api/errors';

/**
 * Error bodies captured from the live API (https://pg-erp.onrender.com, OpenAPI v0.1.0) on 24 Nov 2026,
 * using invalid tokens only — no credentials were sent. Copy new real responses here; never invent fields.
 */
export const realResponses = {
  noToken401: { success: false, message: 'Authentication required.', errorMessage: 'A valid Bearer access token is required.', data: [] },
  badAccessToken401: { success: false, message: 'Authentication failed.', errorMessage: 'The access token is invalid or expired.', data: [] },
  refreshRejected401: { success: false, message: 'Token refresh failed.', errorMessage: 'Refresh token is invalid, expired, or revoked.', data: null },
  logoutRejected401: { success: false, message: 'Logout failed.', errorMessage: 'Refresh token is invalid or already revoked.', data: null },
  /** POST /auth/login with a non-existent account (captured 25 Nov 2026). */
  loginRejected401: { success: false, message: 'Login failed.', errorMessage: 'Email or password is incorrect, or the account is inactive.', data: null },
  validation422: { success: false, message: 'Request validation failed.', errorMessage: 'Please check the request data and try again.', data: null },
  health200: { success: true, message: 'Service is healthy.', errorMessage: null, data: null },
} as const;

/** Builds the ApiError the client would throw for an HTTP error with this body. */
export function apiErrorFor(status: number, body: unknown): ApiError {
  const config = { headers: new AxiosHeaders() };
  const response = { status, data: body, statusText: '', headers: {}, config } as AxiosResponse;
  return ApiError.from(new AxiosError(`HTTP ${status}`, 'ERR_BAD_REQUEST', config, null, response));
}

export const networkError = () => ApiError.from(new AxiosError('Network Error', 'ERR_NETWORK'));
