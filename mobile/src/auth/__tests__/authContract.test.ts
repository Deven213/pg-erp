import { ApiError } from '@/api/errors';
import { base64UrlDecode, decodeJwtPayload, parseTokenData, resolveRole, resolveTenantId } from '../authContract';

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** Minimal UTF-8 → base64url encoder so the test doesn't depend on Node's Buffer. */
function base64Url(text: string): string {
  const bytes = Array.from(unescape(encodeURIComponent(text)), (c) => c.charCodeAt(0));
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const [a = 0, b = 0, c = 0] = bytes.slice(i, i + 3);
    const n = (a << 16) | (b << 8) | c;
    const chars = [18, 12, 6, 0].map((s) => B64[(n >> s) & 63]);
    out += chars.slice(0, Math.min(4, bytes.length - i + 1)).join('');
  }
  return out;
}

function fakeJwt(payload: object): string {
  return `header.${base64Url(JSON.stringify(payload))}.signature`;
}

describe('parseTokenData', () => {
  it('reads access and refresh tokens', () => {
    expect(parseTokenData({ access_token: 'a.b.c', refresh_token: 'r'.repeat(30) })).toEqual({ accessToken: 'a.b.c', refreshToken: 'r'.repeat(30) });
  });

  it('allows a refresh response without a new refresh token', () => {
    expect(parseTokenData({ access_token: 'a.b.c' }).refreshToken).toBeNull();
  });

  it('throws a contract error instead of guessing when the access token is missing', () => {
    expect(() => parseTokenData({ token: 'x' })).toThrow(ApiError);
    expect(() => parseTokenData(null)).toThrow(ApiError);
  });
});

describe('resolveRole', () => {
  it('uses a role in the response body', () => {
    expect(resolveRole({ user: { roles: [{ name: 'Owner' }] } }, 'x.y.z')).toBe('owner');
  });

  it('falls back to JWT claims', () => {
    expect(resolveRole({}, fakeJwt({ role: 'resident' }))).toBe('resident');
  });

  it('returns unknown for roles it does not recognise (e.g. super admin)', () => {
    expect(resolveRole({ role: 'super_admin' }, fakeJwt({}))).toBe('unknown');
    expect(resolveRole(undefined, 'not-a-jwt')).toBe('unknown');
  });
});

describe('resolveTenantId', () => {
  const tenant = '3f2b8c1e-0d4a-4c3b-9a51-2e7f6d8c9b10';
  it('reads tenant_id from the body, the user object or the JWT claims', () => {
    expect(resolveTenantId({ tenant_id: tenant }, 'x.y.z')).toBe(tenant);
    expect(resolveTenantId({ user: { tenant_id: tenant } }, 'x.y.z')).toBe(tenant);
    expect(resolveTenantId({}, fakeJwt({ tenant_id: tenant }))).toBe(tenant);
  });
  it('returns null instead of guessing', () => {
    expect(resolveTenantId({ tenantId: tenant }, fakeJwt({ tid: tenant }))).toBeNull();
    expect(resolveTenantId({ tenant_id: 'not-a-uuid' }, 'x.y.z')).toBeNull();
  });
});

describe('JWT decoding', () => {
  it('decodes UTF-8 payloads', () => {
    expect(decodeJwtPayload(fakeJwt({ name: 'रोहन', sub: '1' }))).toEqual({ name: 'रोहन', sub: '1' });
    expect(base64UrlDecode('aGk')).toBe('hi');
  });
  it('returns null for malformed tokens', () => {
    expect(decodeJwtPayload('abc')).toBeNull();
    expect(decodeJwtPayload('a.!!!.c')).toBeNull();
  });
});
