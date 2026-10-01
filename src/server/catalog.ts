// The components overview's cards: each visual is mtrl's own element, `<m-*>`
// from mtrl/elements, in the playground's defaults where they fit a card. The
// markup is rendered here; src/client/catalog.ts defines the elements.
//
// Dialogs, menus, snackbars, tooltips and the time picker open in the top layer
// or as modals, which a card must not do: their cards hold a surface element
// (`<md3-catalog-*>`) that src/client/catalog.ts builds from the same factory,
// with mtrl's CSS in its shadow root, and shows open in place.
import { symbols } from '../shared/icons';
import { components, componentSlugs, type ComponentSlug } from '../shared/components';
import { scopedTokens } from './tokens';

/** The visual's class, where mtrl's tokens are set. */
export const CATALOG_SCOPE = 'catalog-visual';
/** mtrl's baseline tokens on the visuals: light, and dark when the site is. */
export const catalogTokens = scopedTokens(`.${CATALOG_SCOPE}`, `:root[data-theme-mode=dark] .${CATALOG_SCOPE}`);

/** The surface elements of the overlays, by component. */
export const SURFACES = { dialog: 'md3-catalog-dialog', menu: 'md3-catalog-menu', snackbar: 'md3-catalog-snackbar', tooltip: 'md3-catalog-tooltip', timepicker: 'md3-catalog-timepicker', toolbar: 'md3-catalog-toolbar', tabs: 'md3-catalog-tabs' } as const;

const escape = (text: string) => text.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
type Attributes = Record<string, string | number | boolean | undefined>;
const attributes = (attrs: Attributes) => Object.entries(attrs)
  .map(([name, value]) => value === true ? ` ${name}` : value === false || value === undefined ? '' : ` ${name}="${escape(String(value))}"`).join('');
/** An mtrl element: `m('chip', { selected: true }, 'Hiking')`. `content` is markup. */
const m = (name: string, attrs: Attributes = {}, content = '') => `<m-${name}${attributes(attrs)}>${content}</m-${name}>`;
const text = escape;
const div = (className: string, content: string) => `<div class="${className}">${content}</div>`;

const destinations = [{ value: 'inbox', label: 'Inbox', icon: symbols.inbox }, { value: 'favorites', label: 'Favorites', icon: symbols.heart }, { value: 'sent', label: 'Sent', icon: symbols.send }];
// Lorem Picsum photos, from vlist.io's carousel demo (src/data/carousel.js), at twice
// the card's 200 × 148 slide. The card's element loads only as it nears the viewport,
// so the photos do too.
const places = [
  { id: 29, title: 'Himalayan Peaks', location: 'Nepal' },
  { id: 49, title: 'Santorini Village', location: 'Greece' },
  { id: 62, title: 'Tuscan Sunrise', location: 'Tuscany' },
  { id: 506, title: 'Gullfoss Falls', location: 'Iceland' },
  { id: 122, title: 'Millennium Bridge', location: 'London' },
  { id: 984, title: 'Highland Drama', location: 'Scotland' },
];
const picsum = (id: number) => `https://picsum.photos/id/${id}/400/296`;
const card = components.card.config({ title: 'A little time outside', subtitle: 'Find your next escape', content: '', media: false, actions: true, variant: 'elevated' });

const visuals: Record<ComponentSlug, string> = {
  // Actions
  button: m('button', {}, 'Button') + m('button', { variant: 'outlined' }, 'Button'),
  'icon-button': ['standard', 'filled', 'tonal', 'outlined'].map(variant => m('icon-button', { variant, icon: symbols.heart, 'aria-label': 'Add to favorites' })).join(''),
  // Connected, M3's replacement for the segmented button: formatting toggles, Bold on.
  'button-group': m('button-group', { kind: 'connected', variant: 'tonal', selection: 'multi', 'aria-label': 'Text formatting' },
    ['Bold', 'Italic', 'Underline'].map(label => m('button-group-item', { value: label.toLowerCase(), selected: label === 'Bold' }, label)).join('')),
  'split-button': m('split-button', { label: 'Save', 'trailing-label': 'More save options' },
    ['Save as…', 'Save a copy', 'Download'].map(label => m('menu-item', {}, text(label))).join('')),
  fab: m('fab', { icon: symbols.add, 'aria-label': 'Create new item' }),
  'extended-fab': m('extended-fab', { icon: symbols.edit }, 'Compose'),
  'fab-menu': m('fab-menu', { icon: symbols.edit, 'aria-label': 'Reply options', presentation: 'list' },
    [['reply', 'Reply'], ['forward', 'Forward']].map(([value, label]) => m('fab-menu-item', { value, icon: symbols.send }, text(label!))).join('')),
  // Selection & input
  checkbox: div('catalog-stack', m('checkbox', { 'data-indeterminate': true }, 'Additions')
    + div('catalog-stack catalog-stack--inset', m('checkbox', {}, 'Pickles') + m('checkbox', { checked: true }, 'Tomato'))),
  switch: m('switch', { checked: true, icon: symbols.check, 'supporting-text': 'Stay up to date' }, 'Notifications'),
  radios: m('radios', { value: 'standard', 'aria-label': 'Delivery method' },
    [['standard', 'Standard'], ['express', 'Express'], ['pickup', 'Pick up']].map(([value, label]) => m('radio', { value }, label!)).join('')),
  chips: m('chips', { selection: 'multi', 'aria-label': 'Interests' },
    [['hiking', 'Hiking', true], ['music', 'Music', false], ['food', 'Food', false]].map(([value, label, selected]) => m('chip', { value: String(value), variant: 'filter', selected: selected === true }, String(label))).join('')),
  slider: m('slider', { value: 40, min: 0, max: 100, step: 10, ticks: true, label: 'Volume', 'aria-label': 'Volume' }),
  textfield: m('textfield', { variant: 'outlined', label: 'Name', placeholder: 'Enter your name', 'supporting-text': 'As you would like it displayed' }),
  select: m('select', { variant: 'outlined', label: 'Fruit', value: 'apple', 'supporting-text': 'Choose a favorite' },
    [['apple', 'Apple'], ['banana', 'Banana'], ['cherry', 'Cherry']].map(([value, label]) => m('select-option', { value }, label!)).join('')),
  search: m('search', { placeholder: 'Search places', 'aria-label': 'Search places' }),
  datepicker: m('datepicker', { variant: 'docked', label: 'Choose a date', value: '2026-09-21' }),
  timepicker: `<${SURFACES.timepicker}></${SURFACES.timepicker}>`,
  // Navigation
  'navigation-rail': m('navigation-rail', { value: 'inbox', 'no-toggle': true, 'aria-label': 'Mail navigation' },
    destinations.map(item => m('navigation-rail-item', { value: item.value, icon: item.icon, ...(item.value === 'inbox' ? { badge: 8 } : {}) }, item.label)).join('')),
  drawer: m('drawer', { open: true, dense: true, value: 'inbox', headline: 'Mail', width: 240, 'aria-label': 'Mail' },
    m('drawer-item', { type: 'section' }, 'Your mailbox') + destinations.map(item => m('drawer-item', { value: item.value, icon: item.icon, ...(item.value === 'inbox' ? { badge: 8 } : {}) }, item.label)).join('')),
  // A surface: M3's fixed tab row, which <m-tabs> has no attribute for.
  tabs: `<${SURFACES.tabs}></${SURFACES.tabs}>`,
  menu: `<${SURFACES.menu}></${SURFACES.menu}>`,
  'top-app-bar': m('top-app-bar', { headline: 'My library', 'no-scroll': true },
    m('icon-button', { slot: 'leading', icon: symbols.menu, 'aria-label': 'Open navigation' }) + m('icon-button', { slot: 'trailing', icon: symbols.heart, 'aria-label': 'Favorite' })),
  // A surface: <m-toolbar>'s item hosts take a tabindex, which a card's link must not hold.
  toolbar: `<${SURFACES.toolbar}></${SURFACES.toolbar}>`,
  'bottom-app-bar': m('bottom-app-bar', {},
    m('icon-button', { icon: symbols.heart, 'aria-label': 'Favorite' }) + m('icon-button', { icon: symbols.bookmark, 'aria-label': 'Bookmark' })
    + m('fab', { slot: 'fab', icon: symbols.add, 'aria-label': 'Compose' })),
  // Containment
  card: m('card', { variant: 'elevated', headline: card.header?.title, subhead: card.header?.subtitle },
    (card.buttons ?? []).map(button => m('button', { slot: 'actions', variant: button.variant }, text(String(button.text)))).join('')),
  list: m('list', { selection: 'single', value: '1', 'aria-label': 'Ideas for today' },
    ['Morning walk', 'Read a chapter', 'Try a new recipe'].map((headline, index) => m('list-item', { value: String(index + 1), 'leading-icon': [symbols.heart, symbols.bookmark, symbols.download][index], 'trailing-text': `${(index + 1) * 5} min` }, headline)).join('')),
  carousel: m('carousel', { 'aria-label': 'Places to explore', 'item-width': 200, gap: 8, padding: 0, 'corner-radius': 28 },
    places.map(place => m('carousel-item', { src: picsum(place.id), alt: `${place.title}, ${place.location}`, description: place.location }, text(place.title))).join('')),
  divider: div('catalog-divider', `<p>Ideas for today</p>${m('divider')}<p>Places to explore</p>`),
  dialog: `<${SURFACES.dialog}></${SURFACES.dialog}>`,
  'bottom-sheet': m('bottom-sheet', { open: true, headline: 'Plan your visit', 'peek-height': 120 }, '<p>Find a new trail, take in the view, and make time for a quiet moment.</p>'),
  'side-sheet': m('side-sheet', { open: true, headline: 'Details', width: 240 }, '<p>A place for useful context, related information, and supporting actions.</p>'),
  // Communication
  badge: ['inbox', 'heart'].map((icon, index) => div('catalog-badge',
    m('icon-button', { variant: 'tonal', icon: symbols[icon as 'inbox' | 'heart'], 'aria-label': index ? 'Favorites' : 'Inbox' }) + m('badge', index ? { variant: 'small' } : { label: 8 }))).join(''),
  // Wavy and indeterminate: the M3 Expressive form, and it shows the motion.
  progress: div('catalog-stack catalog-stack--progress', m('progress', { shape: 'wavy', indeterminate: true, 'aria-label': 'Uploading files' }) + m('progress', { variant: 'circular', shape: 'wavy', indeterminate: true, 'aria-label': 'Uploading files' })),
  'loading-indicator': m('loading-indicator', { size: 72, 'aria-label': 'Loading your content' }) + m('loading-indicator', { size: 72, contained: true, 'aria-label': 'Loading your content' }),
  snackbar: `<${SURFACES.snackbar}></${SURFACES.snackbar}>`,
  tooltip: `<${SURFACES.tooltip}></${SURFACES.tooltip}>`,
};

/**
 * A card's visual: decorative, so `aria-hidden` and `inert` keep the card one
 * link with one name, and nothing inside takes focus or a click.
 */
export function catalogVisual(slug: ComponentSlug): string {
  return `<div class="${CATALOG_SCOPE} ${CATALOG_SCOPE}--${slug}" aria-hidden="true" inert>${visuals[slug]}</div>`;
}

/** Every visual, for the checks. */
export const catalogVisuals = Object.fromEntries(componentSlugs.map(slug => [slug, catalogVisual(slug)])) as Record<ComponentSlug, string>;
