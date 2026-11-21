import type { AvatarConfig } from 'material-addons/components/avatar';
import { choose, pick, section, string, text, type ComponentDefinition } from './types';

const sizes = ['small', 'medium', 'large'] as const;
const shapes = ['round', 'square'] as const;

export const avatarComponent: ComponentDefinition<AvatarConfig> = {
  group: 'Add-ons',
  name: 'Avatar',
  factory: 'createAvatar',
  variable: 'avatar',
  description: 'Identify a person with an avatar, a name, and supporting text.',
  summary: 'Show a person with a monogram, name, and supporting text.',
  styles: [],
  controls: [
    ...section('Content', [text('text', 'Initials', 'AL'), text('label', 'Name', 'Ada Lovelace'), text('supportingText', 'Supporting text', 'Editor')]),
    ...section('Appearance', [choose('size', 'Size', sizes, 'large'), choose('shape', 'Shape', shapes, 'round')]),
  ],
  scenarios: [
    { id: 'team-profile', name: 'Team profile', description: 'Identify an editor in a shared workspace.', options: { text: 'AL', label: 'Ada Lovelace', supportingText: 'Editor' }, source: 'https://github.com/floor/material-addons/tree/v3.2.0#avatar' },
    { id: 'mail-sender', name: 'Mail sender', description: 'Identify a sender in a compact inbox row.', options: { text: 'GH', label: 'Grace Hopper', supportingText: 'Operations', size: 'small', shape: 'square' }, source: 'https://github.com/floor/material-addons/tree/v3.2.0#avatar' },
  ],
  config: (state): AvatarConfig => ({
    variant: 'text',
    text: [...string(state, 'text')].slice(0, 2).join(''),
    label: string(state, 'label') || 'Team member',
    supportingText: string(state, 'supportingText'),
    size: pick(state, 'size', sizes, 'large'),
    shape: pick(state, 'shape', shapes, 'round'),
  }),
};
