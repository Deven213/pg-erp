const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Groups digits the Indian way: 1234567 → "12,34,567".
 * Implemented by hand so it doesn't depend on the device's Intl locale data.
 */
export function groupIndian(integerDigits: string): string {
  if (integerDigits.length <= 3) return integerDigits;
  const lastThree = integerDigits.slice(-3);
  const rest = integerDigits.slice(0, -3);
  return `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${lastThree}`;
}

/**
 * Formats rupees with Indian grouping. Paise are shown only when non-zero.
 * formatINR(142000) → "₹1,42,000"; formatINR(2948.82) → "₹2,948.82"; formatINR(-500) → "−₹500".
 * Accepts strings because the API types money as `number | string`.
 */
export function formatINR(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '—';
  const negative = n < 0;
  const abs = Math.abs(n);
  const rounded = Math.round(abs * 100) / 100;
  const [intPart = '0', decPart = '00'] = rounded.toFixed(2).split('.');
  const paise = decPart === '00' ? '' : `.${decPart}`;
  return `${negative ? '−' : ''}₹${groupIndian(intPart)}${paise}`;
}

/** Indian date style used throughout the wireframe: "5 Dec 2026". Returns "—" for invalid input. */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "9825041736" → "+91 98250 41736". Leaves anything that isn't a 10-digit Indian mobile untouched. */
export function formatIndianMobile(value: string | null | undefined): string {
  if (!value) return '—';
  const digits = value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  if (!/^[6-9]\d{9}$/.test(digits)) return value;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

/** Up to two initials for avatars: "Rohan Sharma" → "RS". */
export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}
