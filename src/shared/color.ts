// Colour helpers the Color page shares between the server render and the client:
// WCAG contrast, and which role a swatch's text is drawn in.

/** `#rgb`, `#rrggbb` or `#rrggbbaa` (alpha dropped) as [r, g, b], else null. */
export function parseHex(value: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(value.trim());
  if (!match) return null;
  let hex = match[1]!;
  if (hex.length === 3) hex = [...hex].map(c => c + c).join('');
  return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

/** WCAG 2.x relative luminance of an sRGB colour. */
export function luminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two hex colours, 1 to 21; null when either is not a hex colour. */
export function contrastRatio(a: string, b: string): number | null {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return null;
  const [hi, lo] = [luminance(ca), luminance(cb)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** WCAG AA for normal text. */
export const AA_TEXT = 4.5;

/**
 * The role a swatch's text is drawn in, among the roles that exist: X ↔ on-X,
 * the surface family on on-surface, the inverse roles on inverse-surface.
 * Null when the role has no content colour (outline, shadow, scrim).
 */
export function pairOf(role: string, has: (role: string) => boolean): string | null {
  const pick = (candidate: string) => (has(candidate) ? candidate : null);
  if (role === 'inverse-on-surface' || role === 'inverse-primary') return pick('inverse-surface');
  if (role === 'inverse-surface') return pick('inverse-on-surface');
  if (role === 'on-surface' || role === 'on-surface-variant') return pick('surface');
  if (/^surface(-|$)/.test(role)) return pick('on-surface');
  // The fixed roles: on-X-fixed and on-X-fixed-variant sit on X-fixed.
  const fixed = /^on-([a-z]+)-fixed(?:-variant)?$/.exec(role);
  if (fixed) return pick(`${fixed[1]}-fixed`);
  if (/^[a-z]+-fixed(-dim)?$/.test(role)) return pick(`on-${role.replace(/-dim$/, '')}`);
  if (role.startsWith('on-')) return pick(role.slice(3));
  return pick(`on-${role}`);
}
