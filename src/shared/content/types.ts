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
/** The playground's landscape placeholders, one per carousel slide or list leading image. */
export const landscape = (index: number) => `/assets/playground/landscape-${index + 1}.svg`;
