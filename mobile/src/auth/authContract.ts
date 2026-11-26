/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LOGIN / REFRESH RESPONSE CONTRACT — UNVERIFIED
 * ─────────────────────────────────────────────────────────────────────────────
 * The OpenAPI spec documents the *requests* for /auth/login and /auth/refresh but
 * types the response `data` as `any`. This file is the ONLY place that reads
 * token and role values out of those responses, so it is the single thing to
 * adjust once a real response has been seen.
 *
 * What is grounded in the spec:
 *   • `refresh_token` — the documented field name in RefreshRequest/logout bodies.
 *   • JWT access tokens — security scheme `BearerAuth`, bearerFormat "JWT".
 * What is an assumption to confirm:
 *   • the access token is returned as `data.access_token` (same snake_case style as `refresh_token`);
 *   • where the user's role appears (checked below in the response, then in the JWT claims).
 * If a value can't be found, nothing is guessed: login fails with a "contract" error,
 * or the user lands on the "role not recognised" screen.
 */
import { ApiError } from '@/api/errors';

export type AppRole = 'owner' | 'resident' | 'unknown';

export type SessionTokens = { accessToken: string; refreshToken: string | null };

/**
 * Backend role names → app experience. The spec has a Roles resource (`name`) but no fixed list.
 * TODO(verify): replace with the real role names from GET /api/v1/roles.
 */
export const ROLE_NAME_MAP: Record<string, Exclude<AppRole, 'unknown'>> = {
  owner: 'owner',
  resident: 'resident',
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/** Reads tokens from a login/refresh `data` payload. Throws ApiError('contract') if the access token is missing. */
export function parseTokenData(data: unknown): SessionTokens {
  const d = asRecord(data);
  const accessToken = d?.access_token;
  const refreshToken = d?.refresh_token;
  if (typeof accessToken !== 'string' || accessToken.length === 0) {
    throw new ApiError('contract', { serverMessage: undefined });
  }
  return { accessToken, refreshToken: typeof refreshToken === 'string' && refreshToken.length > 0 ? refreshToken : null };
}

/** Decodes a JWT payload without verifying it — used only to choose screens; the server enforces access. */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const json = base64UrlDecode(part);
    return asRecord(JSON.parse(json));
  } catch {
    return null;
  }
}

/**
 * Expiry time (ms since epoch) from the standard JWT `exp` claim (RFC 7519 §4.1.4), or null if absent.
 * Lets the client renew a token just before it expires instead of waiting for a 401.
 */
export function accessTokenExpiresAt(token: string): number | null {
  const exp = decodeJwtPayload(token)?.exp;
  return typeof exp === 'number' && Number.isFinite(exp) ? exp * 1000 : null;
}

/** Extracts role names from a value that may be a string, a list of strings or a list of { name }. */
function roleNamesFrom(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) {
    return value.flatMap((x) => (typeof x === 'string' ? [x] : typeof asRecord(x)?.name === 'string' ? [asRecord(x)!.name as string] : []));
  }
  return [];
}

/** Decides which app (Owner/Resident) to show. Returns 'unknown' rather than guessing. */
export function resolveRole(data: unknown, accessToken: string): AppRole {
  const d = asRecord(data);
  const user = asRecord(d?.user);
  const claims = decodeJwtPayload(accessToken);
  const candidates = [d?.role, d?.roles, user?.role, user?.roles, claims?.role, claims?.roles].flatMap(roleNamesFrom);
  for (const name of candidates) {
    const mapped = ROLE_NAME_MAP[name.trim().toLowerCase()];
    if (mapped) return mapped;
  }
  return 'unknown';
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The owner's business (tenant) id, needed by PropertyUpsert.tenant_id.
 * TODO(verify): `tenant_id` is the spec's field name on UserUpsert/UserRoleUpsert, but where it appears in the
 * login/refresh response is unconfirmed. Returns null rather than guessing — creating a property is then blocked.
 */
export function resolveTenantId(data: unknown, accessToken: string): string | null {
  const d = asRecord(data);
  const user = asRecord(d?.user);
  const claims = decodeJwtPayload(accessToken);
  for (const v of [d?.tenant_id, user?.tenant_id, claims?.tenant_id]) {
    if (typeof v === 'string' && UUID_RE.test(v)) return v;
  }
  return null;
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Small base64url → UTF-8 decoder so we don't depend on `atob` being present. */
export function base64UrlDecode(input: string): string {
  const s = input.replace(/-/g, '+').replace(/_/g, '/');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of s) {
    if (ch === '=') break;
    const val = B64.indexOf(ch);
    if (val < 0) throw new Error('Invalid base64');
    buffer = (buffer << 6) | val;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return decodeURIComponent(bytes.map((b) => `%${b.toString(16).padStart(2, '0')}`).join(''));
}
