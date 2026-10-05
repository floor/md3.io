// The switch's playground content: its registry entry, moved from
// src/shared/components.ts.
import type { SwitchConfig } from 'material/components/switch';
import { symbols } from '../icons';
import { type ComponentState, type Scenario, bool, choose, disabled, pick, section, string, text, toggle } from './types';

/**
 * The switch's scenarios, from m3.material.io (read 5 October 2026). Options name
 * playground controls only. Switches toggle settings on and off immediately. The handle
 * can show no icon, a checkmark when selected, or both on and off icons; the element
 * snippet omits the unselected icon because it is not yet exposed by <m-switch>.
 */
const switchScenarios: readonly Scenario[] = [
  {
    id: 'play-over-notifications', name: 'Play over notifications', source: 'https://m3.material.io/components/switch/guidelines',
    description: 'Toggling whether audio playback continues uninterrupted during incoming notifications.',
    options: { label: 'Play over notifications', supportingText: 'Keep listening while alerts sound', checked: true, icons: 'selected' },
  },
  {
    id: 'camera-access', name: 'Camera access', source: 'https://m3.material.io/components/switch/guidelines',
    description: 'Enabling or disabling camera sensor hardware permissions for an application.',
    options: { label: 'Camera access', supportingText: 'App has access to your camera', checked: true, icons: 'both' },
  },
  {
    id: 'show-password', name: 'Show password', source: 'https://m3.material.io/components/switch/guidelines',
    description: 'Toggling plaintext password character visibility in a login form.',
    options: { label: 'Show password', supportingText: '', checked: false, icons: 'none' },
  },
  {
    id: 'airplane-mode', name: 'Airplane mode', source: 'https://m3.material.io/components/switch/guidelines',
    description: 'Disabling wireless transmission functions in device system preferences.',
    options: { label: 'Airplane mode', supportingText: 'Turn off cellular, Wi-Fi, and Bluetooth', checked: false, icons: 'none' },
  },
];

export const switchComponent = {
  group: 'Selection & input', name: 'Switch', factory: 'createSwitch', variable: 'toggle',
  description: 'Turn a setting on or off. Try labels, supporting text, and interactive states.',
  summary: 'Settings that take effect immediately.', styles: ['switch'],
  scenarios: switchScenarios,
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
