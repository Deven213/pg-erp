/**
 * Brand palette: forest green (primary), sage (secondary), warm terracotta (accent) on warm ivory.
 * Use `brand` for primary actions and key surfaces, `sage` for links/active states/progress,
 * `accent` sparingly for highlights. Surfaces separate by tone, not by heavy borders or shadows.
 */
export const colors = {
  brand: '#173F35',
  brand2: '#21564A',
  brandSoft: '#E4ECE7',
  sage: '#39745D',
  sageSoft: '#E6EFE9',
  accent: '#E5A36B',
  accentDark: '#B06A2E',
  accentSoft: '#FBEDE0',
  ink: '#202923',
  ink2: '#747D75',
  ink3: '#A2A8A1',
  background: '#F5F1E8',
  card: '#FFFFFF',
  stroke: '#E7E1D4',
  hairline: '#EEE9DE',
  slate50: '#F1EDE4',
  slate100: '#E5DFD2',
  green: '#2F7D55',
  green50: '#E5F1EA',
  amber: '#A8621F',
  amber50: '#FBEEDD',
  red: '#B4362B',
  red50: '#F9E6E3',
  violet: '#5E5A8C',
  violet50: '#ECEBF3',
  teal: '#2E6F73',
  teal50: '#E2EEEE',
  whatsapp: '#1DA851',
  disabled: '#C9CEC6',
  scrim: 'rgba(20, 28, 23, 0.5)',
  white: '#FFFFFF',
} as const;

export type ColorName = keyof typeof colors;

/** Semantic tones used by badges, banners, icon tiles and state views. */
export const tones = {
  success: { fg: colors.green, bg: colors.green50 },
  warning: { fg: colors.amber, bg: colors.amber50 },
  danger: { fg: colors.red, bg: colors.red50 },
  info: { fg: colors.sage, bg: colors.sageSoft },
  neutral: { fg: colors.ink2, bg: colors.slate50 },
  brand: { fg: colors.white, bg: colors.brand },
  accent: { fg: colors.accentDark, bg: colors.accentSoft },
  violet: { fg: colors.violet, bg: colors.violet50 },
  teal: { fg: colors.teal, bg: colors.teal50 },
} as const;

export type Tone = keyof typeof tones;

/** Bed status → tone. Values match BedUpsert.status. */
export const bedStatusTone = {
  available: 'success',
  reserved: 'accent',
  occupied: 'brand',
  maintenance: 'warning',
  inactive: 'neutral',
} as const satisfies Record<string, Tone>;

/** Deterministic, earthy accent for an entity's initials tile (properties, people). */
const accentPairs = [
  { bg: '#E4ECE7', fg: '#173F35' },
  { bg: '#FBEDE0', fg: '#9A5A24' },
  { bg: '#E6EFE9', fg: '#39745D' },
  { bg: '#ECEBF3', fg: '#4E4A7A' },
  { bg: '#E2EEEE', fg: '#2E6F73' },
  { bg: '#F3E7E1', fg: '#8C4A3A' },
] as const;

export function accentFor(key: string): { bg: string; fg: string } {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return accentPairs[h % accentPairs.length]!;
}
