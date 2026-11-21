import type { SkeletonConfig } from 'material-addons/components/skeleton';
import { choose, pick, section, type ComponentDefinition } from './types';

const variants = ['text', 'circle', 'rect'] as const;
const motions = ['wave', 'pulse'] as const;
const sizes = ['small', 'medium', 'large'] as const;

export const skeletonComponent: ComponentDefinition<SkeletonConfig> = {
  group: 'Add-ons', name: 'Skeleton', factory: 'createSkeleton', variable: 'skeleton',
  description: 'Reserve space for content while it loads.',
  summary: 'Show a placeholder with the same shape as the incoming content.',
  styles: [],
  controls: [
    ...section('Appearance', [choose('variant', 'Shape', variants, 'text'), choose('size', 'Size', sizes, 'medium'), choose('motion', 'Motion', motions, 'wave')]),
  ],
  scenarios: [
    { id: 'headline-loading', name: 'Article loading', description: 'Hold room for the first lines of an article.', options: { variant: 'text', size: 'large', motion: 'wave' }, source: 'https://github.com/floor/material-addons/tree/v3.2.0#skeleton' },
    { id: 'avatar-loading', name: 'Avatar loading', description: 'Reserve the profile picture’s footprint.', options: { variant: 'circle', size: 'large', motion: 'pulse' }, source: 'https://github.com/floor/material-addons/tree/v3.2.0#skeleton' },
  ],
  config: state => {
    const variant = pick(state, 'variant', variants, 'text');
    return { variant, size: pick(state, 'size', sizes, 'medium'), motion: pick(state, 'motion', motions, 'wave'), ...(variant === 'text' ? { lines: 3 } : {}) };
  },
};
