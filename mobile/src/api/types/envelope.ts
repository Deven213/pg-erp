/**
 * Standard response envelope (OpenAPI schema `ApiResponse`, verified against the live server on 24 Nov 2026):
 *   200 → { success: true,  message: "...", errorMessage: null, data: ... }
 *   401 → { success: false, message: "Authentication required.", errorMessage: "A valid Bearer access token is required.", data: [] }
 *   422 → { success: false, message: "Request validation failed.", errorMessage: "Please check the request data and try again.", data: null }
 *
 * `data` is typed `any` in the spec, so it stays `unknown` until a real response confirms its shape.
 */
export type ApiEnvelope<TData = unknown> = {
  success: boolean;
  message: string;
  errorMessage: string | null;
  data: TData;
};

export function isApiEnvelope(value: unknown): value is ApiEnvelope {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.success === 'boolean' && typeof v.message === 'string' && 'data' in v;
}
