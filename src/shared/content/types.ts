// The types and control helpers every content module builds on, extracted from
// src/shared/components.ts so a content module never imports the registry itself
// (components.ts imports the modules, never the other way round).
import { symbols } from '../icons';
import { sizes } from '../button';

export type ComponentState = Record<string, string | boolean>;
export interface Control {
  section?: 'Appearance' | 'Layout' | 'Content' | 'Behavior';
  key: string;
  label: string;
  kind: 'choice' | 'icons' | 'select' | 'toggle' | 'text' | 'range' | 'date' | 'time';
  initial: string | boolean;
  options?: readonly string[];
  labels?: Record<string, string>;
  enabledWhen?: string;
  min?: number;
  max?: number;
  step?: number;
}
export interface Scenario {
  /** `?scenario=` value. Lower case, unique for this component, stable. */
  id: string;
  /** The select entry. */
  name: string;
  /** One line, shown under the select. */
  description: string;
  /**
   * Playground state keys only. A toggle is boolean; every other control is a string.
   * Omitted keys stay at the control's `initial` when the scenario is applied.
   */
  options: Readonly<Record<string, string | boolean>>;
  /** The m3.material.io page this scenario follows. Not shown in the playground. */
  source: string;
}
/** What a content module exports for its component: one entry of the `components` registry. */
export interface ComponentDefinition {
  /** The playground group the component sits under (Actions, Navigation, ...). */
  group: string;
  name: string;
  /** The material factory the docs' Vanilla code calls (`createToolbar`). */
  factory: string;
  /** The Vanilla snippet's variable name. */
  variable: string;
  description: string;
  summary: string;
  styles: readonly string[];
  /** Styles only the preview adds beside the component's own (the carousel's remote). */
  previewStyles?: readonly string[];
  scenarios: readonly Scenario[];
  controls: Control[];
  config: (state: ComponentState) => unknown;
}
export const section = (title: NonNullable<Control['section']>, controls: Control[]): Control[] => controls.map(control => ({ ...control, section: title }));
export const choose = (key: string, label: string, options: readonly string[], initial: string, kind: 'choice' | 'select' | 'icons' = 'choice'): Control => ({ key, label, options, initial, kind });
export const toggle = (key: string, label: string, initial = false, enabledWhen?: string): Control => ({ key, label, initial, kind: 'toggle', enabledWhen });
export const text = (key: string, label: string, initial: string): Control => ({ key, label, initial, kind: 'text' });
export const range = (key: string, label: string, initial: string): Control => ({ key, label, initial, kind: 'range', min: 0, max: 100, step: 1 });
export const date = (key: string, label: string, initial: string): Control => ({ key, label, initial, kind: 'date' });
export const size = choose('size', 'Size', sizes, 's');
export const square = toggle('square', 'Square shape');
export const disabled = toggle('disabled', 'Disabled');
export const icon = (options: readonly string[], initial: string) => choose('icon', 'Icon', options, initial, 'icons');
export const pick = <const T extends readonly string[]>(state: ComponentState, key: string, values: T, fallback: T[number]): T[number] => values.find(value => value === state[key]) ?? fallback;
export const string = (state: ComponentState, key: string) => typeof state[key] === 'string' ? state[key] as string : '';
export const bool = (state: ComponentState, key: string) => state[key] === true;
export const shape = (state: ComponentState) => bool(state, 'square') ? 'square' as const : 'round' as const;
export const tones = ['primary-container', 'secondary-container', 'tertiary-container', 'primary', 'secondary', 'tertiary'] as const;
export const positions = ['center', 'bottom-right', 'bottom-left', 'top-right', 'top-left'] as const;
export const position = choose('position', 'Position', positions, 'center', 'select');
export const toneControl: Control = choose('variant', 'Color', tones, 'primary-container', 'select');
/**
 * An icon by the name an icons control stores. Every offered name is a `symbols` key —
 * the same map `componentIcons` reads from, so the value is the one the registry's map
 * gives — or `none`, which is no icon at all.
 */
export const iconByName = (name: string) => symbols[name as keyof typeof symbols] || '';
/** The icon an `icon` control offers, as markup: the state's chosen name, or none. */
export const iconMarkup = (state: ComponentState) => iconByName(string(state, 'icon'));
export const fabPosition = (state: ComponentState) => state.position === 'center' ? {} : { position: string(state, 'position') };
/** A config's `content` text, as the paragraph the components render. */
export const paragraph = (value: string) => `<p>${value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')}</p>`;
// Placeholder art as inline SVG markup: a framework tab's code is mounted on a scratch
// server that serves no assets (a fetched image URL would 404 there), and the library
// refuses every URL scheme but http(s) in a media `src` — inline art is the one
// placeholder that renders in the preview and in every tab.
import landscape1 from '../../../assets/playground/landscape-1.svg' with { type: 'text' };
import landscape2 from '../../../assets/playground/landscape-2.svg' with { type: 'text' };
import landscape3 from '../../../assets/playground/landscape-3.svg' with { type: 'text' };
import landscape4 from '../../../assets/playground/landscape-4.svg' with { type: 'text' };
import landscape5 from '../../../assets/playground/landscape-5.svg' with { type: 'text' };

const art = [landscape1, landscape2, landscape3, landscape4, landscape5].map(svg => svg.trim());
/** The landscape placeholder, as the URL the preview serves it on (a list's leading image). */
export const landscape = (index: number): string => `/assets/playground/landscape-${index + 1}.svg`;
/** The same placeholder as inline SVG markup. */
export const landscapeArt = (index: number): string => art[index] ?? art[0]!;

/** The media box ratios the playground's art can be framed for. */
export type ArtRatio = '16:9' | '4:3' | '1:1';

/**
 * Landscape art framed for a media box: the art covers the frame, centred, as
 * `object-fit: cover` would crop it, and named for assistive technology.
 */
export const framedLandscape = (index: number, ratio: ArtRatio, label: string): string => {
  const [wide, high] = ratio.split(':').map(Number) as [number, number];
  const width = 800;
  const height = Math.round((width * high) / wide);
  const scale = Math.max(width / 800, height / 600);
  const place = (value: number): number => Math.round(value * scale * 100) / 100;
  // The art's own root svg is the covering layer: placed centred in the frame.
  const inner = landscapeArt(index).replace('<svg ', `<svg x="${Math.round(((width - 800 * scale) / 2) * 100) / 100}" y="${Math.round(((height - 600 * scale) / 2) * 100) / 100}" width="${place(800)}" height="${place(600)}" `);
  return `<svg role="img" aria-label="${label}" viewBox="0 0 ${width} ${height}" width="100%" style="display: block">${inner}</svg>`;
};

/**
 * Markup as a live element, for a config the library takes an element for (card
 * media takes an `HTMLElement`, so the art rides in a host that carries its
 * accessible name — the sanitizer inside `setHTML` drops the svg's own). Called
 * from the preview only: the code panels print the markup itself.
 */
export const artElement = (markup: string): HTMLElement => {
  const host = document.createElement('div');
  // The browser's Sanitizer API (`Element.setHTML`); the DOM typings in use predate it.
  (host as unknown as Element & { setHTML(value: string): void }).setHTML(markup);
  host.setAttribute('role', 'img');
  host.setAttribute('aria-label', /aria-label="([^"]*)"/.exec(markup)?.[1] ?? '');
  return host;
};
