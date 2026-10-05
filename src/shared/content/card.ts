// The card's playground content: its registry entry, moved from
// src/shared/components.ts.
import type { CardConfig } from 'material/components/card';
import { type ComponentState, bool, choose, landscape, pick, section, string, text, toggle } from './types';

export const cardComponent = {
  group: 'Containment', name: 'Card', factory: 'createCard', variable: 'card',
  description: 'Bring content and actions together. Explore surfaces, media, and interactive cards.',
  summary: 'Content and actions on one surface.', styles: ['progress', 'button', 'card'],
  scenarios: [],
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['elevated', 'filled', 'outlined'], 'elevated'), toggle('media', 'Show image', true), choose('aspectRatio', 'Image ratio', ['16:9', '4:3', '1:1'], '16:9'), choose('mediaPosition', 'Image position', ['top', 'bottom'], 'top')]),
    ...section('Content', [text('title', 'Title', 'A little time outside'), text('subtitle', 'Subtitle', 'Find your next escape'), text('content', 'Body', 'Take the scenic route. There is always something new to discover.'), toggle('actions', 'Show actions', true)]),
    ...section('Behavior', [toggle('clickable', 'Clickable'), toggle('draggable', 'Draggable')]),
  ],
  config: (state: ComponentState): CardConfig => ({ variant: string(state, 'variant'), clickable: bool(state, 'clickable'), interactive: bool(state, 'clickable'), draggable: bool(state, 'draggable'), header: { title: string(state, 'title'), subtitle: string(state, 'subtitle') }, content: { text: string(state, 'content') }, ...(state.media ? { media: { src: landscape(0), alt: 'Illustrated mountain landscape', aspectRatio: string(state, 'aspectRatio'), position: pick(state, 'mediaPosition', ['top', 'bottom'], 'top') } } : {}), ...(state.actions ? { buttons: [{ text: 'Explore', variant: 'text' }, { text: 'Save', variant: 'tonal' }] } : {}) }),
};
