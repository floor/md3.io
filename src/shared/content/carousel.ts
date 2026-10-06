// The carousel's playground content: its slides builders and its registry entry, moved
// from src/shared/components.ts. The photographs themselves live in
// src/shared/carousel-photos.ts.
import type { CarouselConfig, CarouselSlide } from 'material/components/carousel';
import { type CarouselVariant, carouselPhoto, carouselPhotos, carouselPhotoUrl } from '../carousel-photos';
import { type ComponentState, type Control, type Scenario, bool, choose, pick, range, section, string, toggle } from './types';

/** Twenty-four photos per layout, enough for each to scroll as it does with a real collection. */
const carouselSlides = (state: ComponentState) => {
  const variant = pick(state, 'variant', ['multi-browse', 'uncontained', 'hero', 'hero-center', 'full-screen'], 'multi-browse');
  return carouselPhotos(variant).map(photo => ({ image: carouselPhotoUrl(variant, photo.id), alt: `${photo.title}, ${photo.location}`, ...(state.captions ? { title: photo.title, description: photo.location } : {}) }));
};

/** One photo of a named collection, by catalog id; the caption it carries, if it carries one. */
type SetPhoto = readonly [id: number, title?: string];

/** A named collection: catalog photos with the captions the set fixes. */
interface CarouselSet {
  name: string;
  /** The carousel's accessible name; the default stays "Places to explore". */
  ariaLabel: string;
  /** The layout whose photo size the set's image URLs ask for. */
  size: CarouselVariant;
  photos: readonly SetPhoto[];
}

/**
 * Named collections from m3.material.io/components/carousel/guidelines (read 6
 * October 2026); each photo was opened and checked to be what its figure shows.
 * `default` is not here: today's twenty-four photos per layout stay exactly as
 * they were. The figures' trailing "Show all" is in neither set: the carousel
 * offers no place for one action after the last item
 * (material/src/components/carousel/types.ts, CarouselConfig), so it is
 * recorded as a gap rather than faked.
 */
const carouselSets: Record<string, CarouselSet> = {
  // The figure: one large plant photo, a narrow second, and no captions of any kind.
  'featured-collection': {
    name: 'Featured collection',
    ariaLabel: 'Featured collection',
    size: 'hero',
    photos: [[958], [530], [106], [803], [55]],
  },
  // The figure: three items, widest first, "79 Events" and "12 Cities" on the
  // first two and nothing visible on the third.
  'curated-lists': {
    name: 'Curated lists',
    ariaLabel: 'Curated lists',
    size: 'multi-browse',
    photos: [[453, '79 Events'], [348, '12 Cities'], [832]],
  },
};

const carouselSet = (state: ComponentState): CarouselSet | undefined => carouselSets[string(state, 'carouselSet')];

const setSlides = (set: CarouselSet): CarouselSlide[] => set.photos.map(([id, title]) => {
  const photo = carouselPhoto(id);
  return { image: carouselPhotoUrl(set.size, id), alt: `${photo.title}, ${photo.location}`, ...(title ? { title } : {}) };
});

const carouselSetControl: Control = {
  ...choose('carouselSet', 'Collection', ['default', 'featured-collection', 'curated-lists'], 'default', 'select'),
  labels: { default: 'Default', ...Object.fromEntries(Object.entries(carouselSets).map(([id, set]) => [id, set.name])) },
};

/**
 * The carousel's scenarios, from m3.material.io (read 6 October 2026). Options
 * name playground controls only; a named collection fixes its own captions.
 */
const carouselScenarios: readonly Scenario[] = [
  {
    id: 'featured-collection', name: 'Featured collection', source: 'https://m3.material.io/components/carousel/guidelines',
    description: 'A garden features its plants: one large photo, narrow previews of more of the same kind.',
    options: { carouselSet: 'featured-collection', variant: 'hero' },
  },
  {
    id: 'curated-lists', name: 'Curated lists', source: 'https://m3.material.io/components/carousel/guidelines',
    description: 'Browsing saved lists: 79 Events, 12 Cities, and a third with no label of its own.',
    options: { carouselSet: 'curated-lists', variant: 'multi-browse' },
  },
];

export const carouselComponent = {
  group: 'Containment', name: 'Carousel', factory: 'createCarousel', variable: 'carousel',
  description: 'Browse a collection with Material carousel layouts. Swipe, scroll, or use the arrow keys.',
  summary: 'Five ways to browse a visual collection.', styles: ['carousel'],
  scenarios: carouselScenarios,
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['multi-browse', 'uncontained', 'hero', 'hero-center', 'full-screen'], 'multi-browse', 'select'), { ...range('cornerRadius', 'Corner radius', '28'), max: 48 }]),
    ...section('Layout', [{ ...range('itemWidth', 'Item width', '280'), min: 120, max: 480, step: 20 }, { ...range('gap', 'Gap', '8'), max: 32 }, { ...range('padding', 'Padding', '16'), max: 48 }]),
    ...section('Content', [carouselSetControl, toggle('captions', 'Captions', true, 'slidesDefault'), { ...choose('initialSlide', 'Current slide', Array.from({ length: 24 }, (_, index) => String(index)), '0', 'select'), enabledWhen: 'slidesDefault' }]),
    ...section('Behavior', [toggle('snap', 'Snap to items', true)]),
  ],
  config: (state: ComponentState): CarouselConfig => {
    const set = carouselSet(state);
    const slides = set ? setSlides(set) : carouselSlides(state);
    return {
      variant: pick(state, 'variant', ['multi-browse', 'uncontained', 'hero', 'hero-center', 'full-screen'], 'multi-browse'),
      itemWidth: Number(state.itemWidth), gap: Number(state.gap), padding: Number(state.padding), cornerRadius: Number(state.cornerRadius), snap: bool(state, 'snap'),
      // A named collection is shorter than the default's twenty-four photos.
      initialSlide: Math.min(Number(state.initialSlide), slides.length - 1),
      ariaLabel: set?.ariaLabel ?? 'Places to explore',
      slides,
    };
  },
};
