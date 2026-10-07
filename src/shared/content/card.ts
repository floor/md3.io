// The card's playground content: its named content sets and its registry entry.
import type { CardConfig } from 'material/components/card';
import { carouselPhoto, carouselPhotoUrl } from '../carousel-photos';
import { type ComponentState, type Control, type Scenario, bool, choose, framedLandscape, landscape, pick, section, string, text, toggle } from './types';

/**
 * The card's media as inline art: markup the preview resolves into the element the
 * library's media API takes, and the code panels print. The art itself carries the
 * chosen ratio, so every panel shows the same crop.
 */
type CardMediaArt = { markup: string; aspectRatio?: string; position?: string };

/** A named card: the header, body and buttons the guidelines figure shows. */
interface CardSet {
  name: string;
  header: { title: string; subtitle?: string };
  body?: string;
  buttons?: NonNullable<CardConfig['buttons']>;
}

/**
 * Named cards from m3.material.io/components/cards/guidelines (read 6 October
 * 2026). `default` is not here: today's mountain card stays exactly as it was.
 * The showtime figure's chips (4:00, 7:30, 11:00) are not a card capability —
 * see briefs/gaps.md.
 */
const cardSets: Record<string, CardSet> = {
  'concert-tour': {
    name: 'Concert tour',
    header: { title: "Glass Souls' World Tour", subtitle: 'From your recent favorites' },
    buttons: [{ text: 'Buy tickets', variant: 'filled' }],
  },
  'showtime-tickets': {
    name: 'Showtime tickets',
    header: { title: "See tonight's shows" },
    // The figure cuts this paragraph at the card's edge; "performer" and "show"
    // complete the two cut words.
    body: 'Come see the talented drag queen, performer, singer, and icon at a once in a lifetime show.',
    buttons: [{ text: 'Get tickets', variant: 'outlined' }],
  },
  'podcast-episode': {
    name: 'Podcast episode',
    header: { title: '90th minute', subtitle: '4.31 MB' },
  },
};

const cardSet = (state: ComponentState): CardSet | undefined => cardSets[string(state, 'cardSet')];

/**
 * A catalog photograph the site already loads, cropped by the card's own ratio.
 * 453 is the concert's stage. 39 is a turntable ("Vinyl Groove, Studio"): a
 * record can stand as a show's cover, and the podcast's square frame crops it.
 */
const catalogMedia = (state: ComponentState, id: number, variant: 'multi-browse' | 'hero'): CardConfig['media'] => {
  const photo = carouselPhoto(id);
  return {
    src: carouselPhotoUrl(variant, photo.id),
    alt: `${photo.title}, ${photo.location}`,
    aspectRatio: string(state, 'aspectRatio'),
    position: pick(state, 'mediaPosition', ['top', 'bottom'], 'top'),
  };
};

const namedMedia = (state: ComponentState): CardConfig['media'] | CardMediaArt => {
  const set = string(state, 'cardSet');
  if (set === 'concert-tour') return catalogMedia(state, 453, 'multi-browse');
  if (set === 'podcast-episode') return catalogMedia(state, 39, 'hero');
  const ratio = pick(state, 'aspectRatio', ['16:9', '4:3', '1:1'] as const, '16:9');
  return { markup: framedLandscape(0, ratio, 'Illustrated mountain landscape'), aspectRatio: string(state, 'aspectRatio'), position: pick(state, 'mediaPosition', ['top', 'bottom'], 'top') };
};

const cardSetControl: Control = {
  ...choose('cardSet', 'Card', ['default', 'concert-tour', 'showtime-tickets', 'podcast-episode'], 'default', 'select'),
  labels: { default: 'Default', ...Object.fromEntries(Object.entries(cardSets).map(([id, set]) => [id, set.name])) },
};

/**
 * The card's scenarios, from m3.material.io (read 6 October 2026). Options name
 * playground controls only.
 */
const cardScenarios: readonly Scenario[] = [
  {
    id: 'concert-tour', name: 'Concert tour', source: 'https://m3.material.io/components/cards/guidelines',
    description: "A tour to buy tickets for, surfaced by the music the listener already plays.",
    options: { cardSet: 'concert-tour', variant: 'elevated', media: true, aspectRatio: '16:9', mediaPosition: 'top', actions: true },
  },
  {
    id: 'showtime-tickets', name: 'Showtime tickets', source: 'https://m3.material.io/components/cards/guidelines',
    description: "See tonight's shows, with Get tickets at the end.",
    options: { cardSet: 'showtime-tickets', variant: 'outlined', media: false, actions: true },
  },
  {
    id: 'podcast-episode', name: 'Podcast episode', source: 'https://m3.material.io/components/cards/guidelines',
    description: 'A saved podcast episode, listed by name and file size with no actions.',
    options: { cardSet: 'podcast-episode', variant: 'outlined', media: true, aspectRatio: '1:1', mediaPosition: 'top', actions: false },
  },
];

export const cardComponent = {
  group: 'Containment', name: 'Card', factory: 'createCard', variable: 'card',
  description: 'Bring content and actions together. Explore surfaces, media, and interactive cards.',
  summary: 'Content and actions on one surface.', styles: ['progress', 'button', 'card'],
  scenarios: cardScenarios,
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['elevated', 'filled', 'outlined'], 'elevated'), toggle('media', 'Show image', true), choose('aspectRatio', 'Image ratio', ['16:9', '4:3', '1:1'], '16:9'), choose('mediaPosition', 'Image position', ['top', 'bottom'], 'top')]),
    ...section('Content', [cardSetControl, { ...text('title', 'Title', 'A little time outside'), enabledWhen: 'cardContentDefault', replaced: true }, { ...text('subtitle', 'Subtitle', 'Find your next escape'), enabledWhen: 'cardContentDefault', replaced: true }, { ...text('content', 'Body', 'Take the scenic route. There is always something new to discover.'), enabledWhen: 'cardContentDefault', replaced: true }, toggle('actions', 'Show actions', true)]),
    ...section('Behavior', [toggle('clickable', 'Clickable'), toggle('draggable', 'Draggable')]),
  ],
  config: (state: ComponentState): Omit<CardConfig, 'media'> & { media?: CardConfig['media'] | CardMediaArt } => {
    const named = cardSet(state);
    // A named card carries the figure's own words. The concert and the podcast each
    // take a catalog photograph; the default stays today's mountain card, its title,
    // subtitle and body controls driving it.
    if (named) {
      return {
        variant: pick(state, 'variant', ['elevated', 'filled', 'outlined'], 'elevated'),
        clickable: bool(state, 'clickable'),
        interactive: bool(state, 'clickable'),
        draggable: bool(state, 'draggable'),
        ...(state.media ? { media: namedMedia(state) } : {}),
        header: named.header,
        ...(named.body ? { content: { text: named.body } } : {}),
        // Buy tickets sits at the start of the figure's action row. The factory's
        // buttons path aligns end unless `actions.align` says otherwise
        // (material/src/components/card/config.ts). A named card whose stage keeps
        // that end says so, and the element tabs state the gap: the element has no
        // attribute for the side. The default card does not set this key.
        ...(state.actions && named.buttons ? { buttons: named.buttons, actions: { align: (string(state, 'cardSet') === 'concert-tour' ? 'start' : 'end') as 'start' | 'end' } } : {}),
      };
    }
    return {
      variant: pick(state, 'variant', ['elevated', 'filled', 'outlined'], 'elevated'),
      clickable: bool(state, 'clickable'),
      interactive: bool(state, 'clickable'),
      draggable: bool(state, 'draggable'),
      header: { title: string(state, 'title'), subtitle: string(state, 'subtitle') },
      content: { text: string(state, 'content') },
      ...(state.media ? { media: {
        src: landscape(0),
        alt: 'Illustrated mountain landscape',
        aspectRatio: string(state, 'aspectRatio'),
        position: pick(state, 'mediaPosition', ['top', 'bottom'], 'top'),
      } } : {}),
      ...(state.actions ? { buttons: [{ text: 'Explore', variant: 'text' }, { text: 'Save', variant: 'tonal' }] } : {}),
    };
  },
};
