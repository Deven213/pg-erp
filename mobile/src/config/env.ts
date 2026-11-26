/**
 * Runtime configuration. Only public, non-secret values belong here —
 * everything in EXPO_PUBLIC_* is bundled into the app and readable by anyone.
 */
const DEFAULT_API_BASE_URL = 'https://pg-erp.onrender.com';

function normaliseBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export const env = {
  apiBaseUrl: normaliseBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL),
  /** Default timeout for API calls. The Render host can take ~30–60 s to wake from sleep. */
  apiTimeoutMs: 30_000,
} as const;
