// The carousel's playground content: its slides builder and its registry entry, moved
// from src/shared/components.ts. The photographs themselves live in
// src/shared/carousel-photos.ts.
import type { CarouselConfig } from 'material/components/carousel';
import { carouselPhotos, carouselPhotoUrl } from '../carousel-photos';
import { type ComponentState, bool, choose, pick, range, section, toggle } from './types';

/** Twenty-four photos per layout, enough for each to scroll as it does with a real collection. */
const carouselSlides = (state: ComponentState) => {
  const variant = pick(state, 'variant', ['multi-browse', 'uncontained', 'hero', 'hero-center', 'full-screen'], 'multi-browse');
  return carouselPhotos(variant).map(photo => ({ image: carouselPhotoUrl(variant, photo.id), alt: `${photo.title}, ${photo.location}`, ...(state.captions ? { title: photo.title, description: photo.location } : {}) }));
};

export const carouselComponent = {
  group: 'Containment', name: 'Carousel', factory: 'createCarousel', variable: 'carousel',
  description: 'Browse a collection with Material carousel layouts. Swipe, scroll, or use the arrow keys.',
  summary: 'Five ways to browse a visual collection.', styles: ['carousel'],
  // The preview's remote (icon buttons and a slider), which the copied code does not build.
  previewStyles: ['icon-button', 'slider'],
  previewOnly: ['.carousel-remote'],
  scenarios: [],
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['multi-browse', 'uncontained', 'hero', 'hero-center', 'full-screen'], 'multi-browse', 'select'), { ...range('cornerRadius', 'Corner radius', '28'), max: 48 }]),
    ...section('Layout', [{ ...range('itemWidth', 'Item width', '280'), min: 120, max: 480, step: 20 }, { ...range('gap', 'Gap', '8'), max: 32 }, { ...range('padding', 'Padding', '16'), max: 48 }]),
    ...section('Content', [toggle('captions', 'Captions', true), choose('initialSlide', 'Current slide', Array.from({ length: 24 }, (_, index) => String(index)), '0', 'select')]),
    ...section('Behavior', [toggle('snap', 'Snap to items', true)]),
  ],
  config: (state: ComponentState): CarouselConfig => ({ variant: pick(state, 'variant', ['multi-browse', 'uncontained', 'hero', 'hero-center', 'full-screen'], 'multi-browse'), itemWidth: Number(state.itemWidth), gap: Number(state.gap), padding: Number(state.padding), cornerRadius: Number(state.cornerRadius), snap: bool(state, 'snap'), initialSlide: Number(state.initialSlide), ariaLabel: 'Places to explore', slides: carouselSlides(state) }),
};
