// The switch's playground content: its registry entry, moved from
// src/shared/components.ts.
import type { SwitchConfig } from 'material/components/switch';
import { symbols } from '../icons';
import { type ComponentState, bool, choose, disabled, pick, section, string, text, toggle } from './types';

export const switchComponent = {
  group: 'Selection & input', name: 'Switch', factory: 'createSwitch', variable: 'toggle',
  description: 'Turn a setting on or off. Try labels, supporting text, and interactive states.',
  summary: 'Settings that take effect immediately.', styles: ['switch'],
  scenarios: [],
  controls: [
    ...section('Appearance', [choose('icons', 'Icons', ['none', 'selected', 'both'], 'selected'), choose('labelPosition', 'Label position', ['start', 'end'], 'start')]),
    ...section('Content', [text('label', 'Label', 'Notifications'), text('supportingText', 'Supporting text', 'Stay up to date'), text('name', 'Name', 'notifications')]),
    ...section('Behavior', [toggle('checked', 'Checked', true), toggle('error', 'Error'), toggle('required', 'Required'), disabled]),
  ],
  config: (state: ComponentState): SwitchConfig => ({ label: string(state, 'label'), ariaLabel: string(state, 'label').trim() || 'Notifications',
    labelPosition: pick(state, 'labelPosition', ['start', 'end'], 'start'),
    // M3's three configurations: no icons, an icon when on, icons on both.
    ...(state.icons === 'none' ? { icon: 'none' } : { icon: symbols.check }), ...(state.icons === 'both' ? { unselectedIcon: symbols.close } : {}),
    supportingText: string(state, 'supportingText'), name: string(state, 'name'), checked: bool(state, 'checked'), error: bool(state, 'error'),
    ...(bool(state, 'required') ? { required: true } : {}), ...(bool(state, 'disabled') ? { disabled: true } : {}) }),
};
