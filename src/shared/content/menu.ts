// The menu's playground content: its registry entry, moved from
// src/shared/components.ts.
import type { MenuConfig } from 'material/components/menu';
import { type ComponentState, bool, choose, iconByName, pick, section, string, text, toggle } from './types';

export const menuComponent = {
  group: 'Navigation', name: 'Menu', factory: 'createMenu', variable: 'menu',
  description: 'Open a menu of actions. Explore placement, color, supporting text, and nested choices.',
  summary: 'Actions and nested choices on demand.', styles: ['menu', 'button', 'progress'],
  scenarios: [],
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['standard', 'vibrant', 'gap', 'baseline'], 'standard', 'select'), toggle('dense', 'Dense')]),
    ...section('Layout', [choose('position', 'Position', ['bottom-start', 'bottom-end', 'top-start', 'top-end', 'right-start', 'left-start'], 'bottom-start', 'select')]),
    ...section('Content', [text('text', 'Button label', 'Open menu'), toggle('icons', 'Icons', true), toggle('supportingText', 'Supporting text'), toggle('submenu', 'Submenu')]),
    ...section('Behavior', [toggle('closeOnSelect', 'Close on selection', true), toggle('disableDownload', 'Disable download')]),
  ],
  config: (state: ComponentState): MenuConfig => ({ opener: '#menu-trigger', variant: state.variant === 'baseline' ? 'baseline' : 'vertical', color: state.variant === 'vibrant' ? 'vibrant' : 'standard', position: pick(state, 'position', ['bottom-start', 'bottom-end', 'top-start', 'top-end', 'right-start', 'left-start'], 'bottom-start'), dense: bool(state, 'dense'), closeOnSelect: bool(state, 'closeOnSelect'), items: [
    { id: 'save', text: 'Save', ...(state.icons ? { icon: iconByName('bookmark') } : {}), ...(state.supportingText ? { supportingText: 'Keep for later' } : {}) },
    { id: 'share', text: 'Share', ...(state.icons ? { icon: iconByName('send') } : {}), ...(state.submenu ? { hasSubmenu: true, submenu: [{ id: 'link', text: 'Copy link' }, { id: 'email', text: 'Email' }] } : {}) },
    { type: state.variant === 'gap' ? 'gap' : 'divider' }, { id: 'download', text: 'Download', disabled: bool(state, 'disableDownload'), ...(state.icons ? { icon: iconByName('download') } : {}) },
  ] }),
};
