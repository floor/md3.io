// The components overview's cards: each visual is mtrl's own element, `<m-*>`
// from mtrl/elements, in the playground's defaults where they fit a card. The
// markup is rendered here; src/client/catalog.ts defines the elements.
//
// The overlay cards build theirs from the same factory in a live host
// (src/client/catalog/<slug>.ts): a trigger inside the card, and the real
// overlay, which opens in the top layer or as a modal and closes normally.
import { symbols } from '../shared/icons';
import { addonSlugs } from '../shared/addons';
import { components, componentSlugs, type ComponentSlug } from '../shared/components';
import { scopedTokens } from './tokens';
import { renderElement } from 'material/ssr';
import { renderStyles } from './playground-panel';

/** The visual's class, where mtrl's tokens are set. */
export const CATALOG_SCOPE = 'catalog-visual';
/** mtrl's non-colour tokens on the visuals: their colours inherit the page's
 * chosen theme from <html data-theme>, like every other surface. */
const tokenScope = `:is(.${CATALOG_SCOPE}, .catalog-status)`;
export const catalogTokens = scopedTokens(tokenScope, `:root[data-theme-mode=dark] ${tokenScope}`, undefined, false);

/** The surface elements of the overlays, by component. */
export const SURFACES = { dialog: 'md3-catalog-dialog', menu: 'md3-catalog-menu', snackbar: 'md3-catalog-snackbar', tooltip: 'md3-catalog-tooltip', timepicker: 'md3-catalog-timepicker', datepicker: 'md3-catalog-datepicker', toolbar: 'md3-catalog-toolbar', tabs: 'md3-catalog-tabs', carousel: 'md3-catalog-carousel' } as const;

const escape = (text: string) => text.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
type Attributes = Record<string, string | number | boolean | undefined>;
const attributes = (attrs: Attributes) => Object.entries(attrs)
  .map(([name, value]) => value === true ? ` ${name}` : value === false || value === undefined ? '' : ` ${name}="${escape(String(value))}"`).join('');
/** An mtrl element: `m('chip', { selected: true }, 'Hiking')`. `content` is markup. */
const m = (name: string, attrs: Attributes = {}, content = '', prefix = 'm') =>
  `<${prefix}-${name}${attributes(attrs)}>${content}</${prefix}-${name}>`;
const text = escape;
const div = (className: string, content: string) => `<div class="${className}">${content}</div>`;

const destinations = [{ value: 'inbox', label: 'Inbox', icon: symbols.inbox }, { value: 'favorites', label: 'Favorites', icon: symbols.heart }, { value: 'sent', label: 'Sent', icon: symbols.send }];
const card = components.card.config({ title: 'A little time outside', subtitle: 'Find your next escape', content: '', media: false, actions: true, variant: 'elevated' });

const visuals: Record<ComponentSlug, string> = {
  autocomplete: m('autocomplete', { label: 'Destination', 'open-on-focus': true },
    ['Athens', 'Lisbon', 'Rome'].map(city => m('autocomplete-option', { value: city.toLowerCase() }, city)).join('')),
  avatar: m('avatar', { variant: 'text', text: 'AL', label: 'Ada Lovelace', 'supporting-text': 'Editor' }),
  colorpicker: '<div class="catalog-addon-fallback">Violet · Ocean · Forest · Rose</div>',
  'expansion-panel': m('expansion-panel', { label: 'Delivery details' }, '<p>Your order arrives in two to four business days.</p>'),
  form: '<div class="catalog-addon-fallback">Event registration</div>',
  skeleton: m('skeleton', { variant: 'text', lines: 3, motion: 'wave' }),
  stepper: m('stepper', { value: 'store', 'label-placement': 'bottom', 'aria-label': 'Order pickup' },
    m('step', { value: 'store', label: 'Store' }, 'Choose a shop.') +
    m('step', { value: 'time', label: 'Pickup' }, 'Choose a time.')),
  // Actions
  button: div('catalog-row', m('button', { variant: 'tonal', size: 's', icon: symbols.arrowBack }, 'Back')
    + m('button', { size: 'm', icon: symbols.edit }, 'Edit')
    + m('button', { variant: 'tonal', size: 's', icon: symbols.arrowForward }, 'Next')) + '<i class="catalog-gesture" aria-hidden="true"></i>',
  'icon-button': div('catalog-row', m('icon-button', { variant: 'outlined', size: 'm', width: 'narrow', icon: symbols.settings, 'aria-label': 'Settings' })
    + m('icon-button', { variant: 'tonal', size: 'm', icon: symbols.edit, 'aria-label': 'Edit' })
    + m('icon-button', { variant: 'filled', size: 'm', width: 'wide', icon: symbols.send, 'aria-label': 'Send' })),
  'button-group': div('catalog-column',
    m('button-group', { kind: 'connected', variant: 'tonal', selection: 'single', size: 's', 'equal-width': true, value: '4', 'aria-label': 'Cup size' },
      [['4', '4 oz'], ['8', '8 oz'], ['12', '12 oz']].map(([value, label]) => m('button-group-item', { value, selected: value === '4', 'selected-icon': symbols.check }, label!)).join(''))
    + div('catalog-row catalog-row--tight', m('icon-button', { variant: 'outlined', size: 'm', width: 'narrow', icon: symbols.accessibilityNew, 'aria-label': 'Accessibility' })
      + m('button', { size: 'm' }, 'Get started')
      + m('icon-button', { variant: 'outlined', size: 'm', width: 'narrow', icon: symbols.language, 'aria-label': 'Language' }))),
  'split-button': m('split-button', { label: 'Add to cart', icon: symbols.shoppingCart, size: 'm', 'trailing-label': 'More cart options' },
    ['Buy now', 'Save for later', 'Add to list'].map(label => m('menu-item', {}, text(label))).join('')),
  fab: div('catalog-row', m('fab', { variant: 'surface', icon: symbols.edit, 'aria-label': 'Edit, small' })
    + m('fab', { variant: 'primary-container', size: 'large', icon: symbols.edit, 'aria-label': 'Edit, large' })
    + m('fab', { variant: 'tertiary-container', size: 'medium', icon: symbols.edit, 'aria-label': 'Edit, medium' })),
  'extended-fab': m('extended-fab', { variant: 'primary-container', size: 'medium', icon: symbols.add }, 'New task'),
  'fab-menu': m('fab-menu', { open: true, icon: symbols.edit, 'aria-label': 'Create', presentation: 'list' },
    [['first', 'First'], ['second', 'Second'], ['third', 'Third']].map(([value, label]) => m('fab-menu-item', { value, icon: symbols.star }, text(label!))).join('')),
  // Selection & input
  checkbox: div('catalog-stack', m('checkbox', { 'data-indeterminate': true }, 'Additions')
    + div('catalog-stack catalog-stack--inset', m('checkbox', {}, 'Pickles') + m('checkbox', { checked: true }, 'Tomato'))),
  switch: m('switch', { checked: true, icon: symbols.check, 'supporting-text': 'Stay up to date' }, 'Notifications'),
  // A settings group: its heading, and two choices.
  radios: div('catalog-choice', `<span class="catalog-choice__title" aria-hidden="true">Delivery</span>`
    + m('radios', { value: 'standard', 'aria-label': 'Delivery' }, [['standard', 'Standard'], ['express', 'Express']].map(([value, label]) => m('radio', { value }, label!)).join(''))),
  chips: m('chips', { selection: 'multi', 'aria-label': 'Interests' },
    [['hiking', 'Hiking', true], ['music', 'Music', false], ['food', 'Food', false]].map(([value, label, selected]) => m('chip', { value: String(value), variant: 'filter', selected: selected === true }, String(label))).join('')),
  // A settings screen: Sound, with a slider for each volume beside its icon.
  slider: div('catalog-sound', `<div class="catalog-sound__bar" aria-hidden="true">${symbols.arrowBack}<span>Sound</span></div>`
    + ([[symbols.musicNote, 'Media volume', 60], [symbols.alarm, 'Alarm volume', 25]] as const).map(([icon, label, value]) =>
      `<div class="catalog-sound__row"><span class="catalog-sound__icon" aria-hidden="true">${icon}</span><div class="catalog-sound__control"><span class="catalog-sound__label" aria-hidden="true">${label}</span>${m('slider', { value, min: 0, max: 100, 'aria-label': label, 'show-value': true })}</div></div>`).join('')),
  'text-field': m('text-field', { variant: 'outlined', label: 'Name', placeholder: 'Enter your name', 'supporting-text': 'As you would like it displayed' }),
  select: m('select', { variant: 'outlined', label: 'Fruit', value: 'apple', 'supporting-text': 'Choose a favorite' },
    [['apple', 'Apple'], ['banana', 'Banana'], ['cherry', 'Cherry']].map(([value, label]) => m('select-option', { value }, label!)).join('')),
  // Focus opens the expanded view, with recent places as its suggestions.
  search: m('search', { placeholder: 'Search places', 'aria-label': 'Search places', 'trailing-icon': symbols.mic, 'trailing-label': 'Search by voice' },
    ['Lisbon', 'Kyoto', 'Valparaíso'].map(place => m('search-suggestion', { label: place, icon: symbols.schedule })).join('')),
  datepicker: `<${SURFACES.datepicker}></${SURFACES.datepicker}>`,
  timepicker: `<${SURFACES.timepicker}></${SURFACES.timepicker}>`,
  // Navigation
  'navigation-rail': m('navigation-rail', { value: 'inbox', 'no-toggle': true, 'aria-label': 'Mail navigation' },
    destinations.map(item => m('navigation-rail-item', { value: item.value, icon: item.icon, ...(item.value === 'inbox' ? { badge: 8 } : {}) }, item.label)).join('')),
  'navigation-bar': m('navigation-bar', { value: 'inbox', 'aria-label': 'Mail navigation' },
    destinations.map(item => m('navigation-bar-item', { value: item.value, icon: item.icon }, item.label)).join('')),
  'navigation-drawer': m('drawer', { open: true, dense: true, value: 'inbox', headline: 'Mail', width: 240, 'aria-label': 'Mail' },
    m('drawer-item', { type: 'section' }, 'Your mailbox', 'md3-catalog') + destinations.map(item => m('drawer-item', { value: item.value, icon: item.icon, ...(item.value === 'inbox' ? { badge: 8 } : {}) }, item.label, 'md3-catalog')).join(''), 'md3-catalog'),
  // A surface: M3's fixed tab row, which <m-tabs> has no attribute for.
  tabs: `<${SURFACES.tabs}></${SURFACES.tabs}>`,
  menu: `<${SURFACES.menu}></${SURFACES.menu}>`,
  'app-bar': m('top-app-bar', { headline: 'My library', 'no-scroll': true },
    m('icon-button', { slot: 'leading', icon: symbols.menu, 'aria-label': 'Open navigation' }) + m('icon-button', { slot: 'trailing', icon: symbols.heart, 'aria-label': 'Favorite' })),
  // A surface: <m-toolbar>'s item hosts take a tabindex, which a card's link must not hold.
  toolbar: `<${SURFACES.toolbar}></${SURFACES.toolbar}>`,
  // Containment
  card: m('card', { variant: 'elevated', headline: card.header?.title, subhead: card.header?.subtitle },
    (card.buttons ?? []).map(button => m('button', { slot: 'actions', variant: button.variant }, text(String(button.text)))).join('')),
  list: m('list', { selection: 'single', value: '1', 'aria-label': 'Ideas for today' },
    ['Morning walk', 'Read a chapter', 'Try a new recipe'].map((headline, index) => m('list-item', { value: String(index + 1), 'leading-icon': [symbols.heart, symbols.bookmark, symbols.download][index], 'trailing-text': `${(index + 1) * 5} min` }, headline)).join('')),
  // The factory, so it scrolls freely (snap: false): <m-carousel> takes no snap attribute.
  carousel: `<${SURFACES.carousel}></${SURFACES.carousel}>`,
  divider: div('catalog-divider', ['Ideas for today', 'Places to explore', 'Saved for later', 'Recently viewed'].map(label => `<p><i aria-hidden="true"></i>${label}</p>`).join(m('divider'))),
  dialog: `<${SURFACES.dialog}></${SURFACES.dialog}>`,
  'bottom-sheet': m('button', { variant: 'tonal', 'data-catalog-open': 'bottom-sheet' }, 'Show bottom sheet') + m('bottom-sheet', { headline: 'Plan your visit', 'peek-height': 120 }, '<p>Find a new trail, take in the view, and make time for a quiet moment.</p>'),
  'side-sheet': m('button', { variant: 'tonal', 'data-catalog-open': 'side-sheet' }, 'Show side sheet') + m('side-sheet', { headline: 'Details', width: 240 }, '<p>A place for useful context, related information, and supporting actions.</p>'),
  // Communication
  badge: m('navigation-bar', { value: 'inbox', 'aria-label': 'Mail navigation' },
    destinations.map((item, index) => m('navigation-bar-item', { value: item.value, icon: item.icon, badge: [3, undefined, 1][index] }, item.label)).join('')),
  // Wavy and indeterminate: the M3 Expressive form, and it shows the motion.
  progress: div('catalog-stack catalog-stack--progress', m('progress', { shape: 'wavy', indeterminate: true, 'aria-label': 'Uploading files' }) + m('progress', { variant: 'circular', shape: 'wavy', indeterminate: true, 'aria-label': 'Uploading files' })),
  'loading-indicator': m('loading-indicator', { size: 72, 'aria-label': 'Loading your content' }) + m('loading-indicator', { size: 72, contained: true, 'aria-label': 'Loading your content' }),
  snackbar: `<${SURFACES.snackbar}></${SURFACES.snackbar}>`,
  tooltip: `<${SURFACES.tooltip}></${SURFACES.tooltip}>`,
};

/** Which part of a device each scene shows: components that live in a screen sit in one. */
type FrameKind = 'picker' | 'floor' | 'top' | 'bottom' | 'middle' | 'left' | 'right' | 'drawer' | 'side';
const frames: Partial<Record<ComponentSlug, FrameKind>> = {
  button: 'floor', 'icon-button': 'side', datepicker: 'picker', timepicker: 'picker',
  'app-bar': 'top', search: 'top', tabs: 'top',
  'navigation-bar': 'bottom', badge: 'bottom', snackbar: 'bottom', toolbar: 'bottom', 'bottom-sheet': 'bottom',
  divider: 'middle', slider: 'middle', 'text-field': 'middle', select: 'middle',
  checkbox: 'left', radios: 'left', chips: 'left', 'navigation-rail': 'left',
  switch: 'right',
  'navigation-drawer': 'drawer', 'side-sheet': 'side',
};
export const statusBar = '<div class="catalog-frame__status" aria-hidden="true"><span data-clock>9:30</span><svg viewBox="0 0 34 12" width="34" height="12"><path d="M0 2h12L6 10zM15 10 25 1v9z"/><rect x="28" y="2" width="6" height="9" rx="1"/></svg></div>';
const frame = (kind: FrameKind, content: string) =>
  `<div class="catalog-frame catalog-frame--${kind}">${kind === 'top' ? statusBar : ''}<div class="catalog-frame__screen">${content}</div></div>`;

/**
 * A card's visual: the live component itself, so people can use it where it
 * stands; the card's title, not the visual, is the link to its playground.
 * Its colours inherit the page's chosen theme from <html data-theme>:
 * catalogTokens above carries only mtrl's non-colour tokens on the scope, so
 * nothing here pins Baseline over the theme (layout step 8).
 */
export function catalogVisual(slug: ComponentSlug): string {
  const kind = frames[slug];
  const scene = kind ? frame(kind, visuals[slug]) : visuals[slug];
  return `<div class="${CATALOG_SCOPE} ${CATALOG_SCOPE}--${slug}">${scene}</div>`;
}

/** An overview card: a real <m-card>, the live visual as its media, the text as its content. */
/** A card's actions: links to the component's pages (Playground, Develop, Accessibility), as material's small buttons. */
export type CardTab = { label: string; href: string; icon?: string };
export function catalogCard(slug: ComponentSlug, href: string, deprecated: boolean, tabs: readonly CardTab[] = []): string {
  const { name, summary } = components[slug];
  const status = deprecated ? '<span class="catalog-status"><m-badge variant="small" label="Deprecated" color="secondary" aria-hidden="true"></m-badge> Deprecated</span>' : '';
  // The card itself is not a link (its stage stays live to try): the title and the actions are.
  const actions = tabs.length ? `<div class="component-card__actions">${tabs.map(({ label, href: to, icon }) => icon
    // Develop and Accessibility: standard icon buttons, named and titled by their tab.
    ? `<a class="mtrl-icon-button mtrl-icon-button--standard mtrl-icon-button--s mtrl-icon-button--round" href="${escape(to)}" aria-label="${escape(`${name}: ${label}`)}" title="${escape(label)}"><span class="mtrl-icon-button__icon">${icon}</span></a>`
    : `<a class="mtrl-button mtrl-button--tonal mtrl-button--s mtrl-button--round" href="${escape(to)}" aria-label="${escape(`${name}: ${label}`)}"><span class="mtrl-button__text">${escape(label)}</span></a>`).join('')}</div>` : '';
  const body = `<div class="component-card__body"><h3><a href="${escape(href)}">${escape(name)}</a></h3><p>${escape(summary)}</p>${status}${actions}</div>`;
  // Rendering the card renders the elements in its scene. A demo app bar's headline is not
  // the page's title, so it is not a heading (src/client/catalog/app-bar.ts, once upgraded).
  return renderElement('m-card', { variant: 'filled', class: 'component-card' }, `${catalogVisuals[slug].replace('<div class="', '<div slot="media" class="')}${body}`, renderStyles)
    .replaceAll('<h1 part="headline"', '<h1 part="headline" role="presentation"');
}

/** A docs overview card: the same <m-card> as a component's, without the visual. */
export function docCard({ name, href, summary }: { name: string; href: string; summary: string }): string {
  const body = `<div class="doc-card__body"><h3><a href="${escape(href)}">${escape(name)}</a></h3><p>${escape(summary)}</p></div>`;
  return renderElement('m-card', { variant: 'filled', class: 'doc-card' }, body, renderStyles);
}

/** Every visual, for the checks. */
export const catalogVisuals = Object.fromEntries([...componentSlugs, ...addonSlugs].map(slug => [slug, catalogVisual(slug)])) as Record<ComponentSlug, string>;
