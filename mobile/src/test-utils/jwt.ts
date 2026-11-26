const B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** UTF-8 → base64url without padding (no Node Buffer needed). */
function base64Url(text: string): string {
  const bytes = Array.from(unescape(encodeURIComponent(text)), (c) => c.charCodeAt(0));
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const [a = 0, b = 0, c = 0] = bytes.slice(i, i + 3);
    const n = (a << 16) | (b << 8) | c;
    out += [18, 12, 6, 0]
      .map((s) => B64URL[(n >> s) & 63])
      .slice(0, Math.min(4, bytes.length - i + 1))
      .join('');
  }
  return out;
}

/** Unsigned JWT-shaped string for tests only. The app never trusts these claims for security. */
export function testJwt(claims: Record<string, unknown>): string {
  return `${base64Url('{"alg":"none"}')}.${base64Url(JSON.stringify(claims))}.test`;
}
