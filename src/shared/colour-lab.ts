import type { ThemeVariant } from 'material/theme/variants';
import type { SchemeMode } from 'material/theme';

export const LAB_SEEDS = [
  ['#6750A4', 'Baseline purple'], ['#006A6A', 'Teal'], ['#8F4C38', 'Terracotta'],
  ['#3B6939', 'Forest'], ['#7D5260', 'Rose'], ['#0061A4', 'Cobalt'],
] as const;
export const LAB_VARIANTS = [
  ['tonal-spot', 'Tonal spot', 'tonalSpot'], ['vibrant', 'Vibrant', 'vibrant'],
  ['expressive', 'Expressive', 'expressive'], ['fidelity', 'Fidelity', 'fidelity'],
  ['content', 'Content', 'content'], ['neutral', 'Neutral', 'neutral'], ['monochrome', 'Monochrome', 'monochrome'],
] as const;
export const LAB_SAMPLES = [
  { name: 'Alpine', src: '/assets/playground/landscape-1.svg' },
  { name: 'Lagoon', src: '/assets/playground/landscape-2.svg' },
  { name: 'Canyon', src: '/assets/playground/landscape-3.svg' },
] as const;

// The 40 roles applyScheme emits in material 3.10.0 (dist/theme/index.js).
export const LAB_ROLE_GROUPS = [
  { name: 'Primary', roles: ['primary', 'on-primary', 'primary-container', 'on-primary-container'] },
  { name: 'Secondary', roles: ['secondary', 'on-secondary', 'secondary-container', 'on-secondary-container'] },
  { name: 'Tertiary', roles: ['tertiary', 'on-tertiary', 'tertiary-container', 'on-tertiary-container'] },
  { name: 'Neutral / surface', roles: ['surface', 'surface-dim', 'surface-bright', 'surface-container-lowest', 'surface-container-low', 'surface-container', 'surface-container-high', 'surface-container-highest', 'surface-variant', 'on-surface', 'on-surface-variant'] },
  { name: 'Outline / utility', roles: ['outline', 'outline-variant', 'shadow', 'scrim', 'inverse-surface', 'inverse-on-surface', 'inverse-primary'] },
  { name: 'Error', roles: ['error', 'on-error', 'error-container', 'on-error-container'] },
  { name: 'Status', roles: ['success', 'on-success', 'warning', 'on-warning', 'info', 'on-info'] },
] as const;
export const LAB_ROLES = LAB_ROLE_GROUPS.flatMap(group => [...group.roles]);
export interface LabState { seed: string; variant: ThemeVariant; mode: SchemeMode; contrast: number }
export const LAB_DEFAULT: LabState = { seed: '#6750a4', variant: 'tonal-spot', mode: 'light', contrast: 0 };

export const labSeed = (value: string): string | null => /^#?[\da-f]{6}$/i.test(value.trim()) ? '#' + value.trim().replace('#', '').toLowerCase() : null;
export const labHex = (argb: number): string => '#' + (argb >>> 0).toString(16).padStart(8, '0').slice(-6);

/** Normal-text thresholds; compare the unrounded ratio (W3C, read 2026-11-09).
 * https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
 * https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html
 */
export const contrastGrade = (ratio: number): string => ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'Below AA';

export function labJavaScript(state: LabState): string {
  const factory = LAB_VARIANTS.find(([name]) => name === state.variant)![2];
  return [
    'import { createScheme, applyScheme, ' + factory + ' } from "material/theme";',
    'const scheme = createScheme("' + state.seed + '", { variant: ' + factory + ', mode: "' + state.mode + '", contrast: ' + state.contrast + ' });',
    'applyScheme(scheme);',
  ].join('\n');
}

export function labCss(tokens: Record<string, string>): string {
  return ':root {\n' + LAB_ROLES.map(role => '  --mtrl-sys-color-' + role + ': ' + tokens[role] + ';').join('\n') + '\n}';
}
