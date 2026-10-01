// The Styles pages' frames of real mtrl, created once. The default view is the preview's
// screen, a small trip-planning app; `?view=gallery` is the Shape page's components
// grouped under the corner step each one reads. The page sends the base theme, the
// mode and the overridden custom properties; they go on the root, so everything
// inside follows, the dialog in the top layer included, without re-creating a component.
import createTopAppBar from 'mtrl/components/top-app-bar';
import createIconButton from 'mtrl/components/icon-button';
import { createChips } from 'mtrl/components/chips';
import createCard from 'mtrl/components/card';
import createTextfield from 'mtrl/components/textfield';
import createSwitch from 'mtrl/components/switch';
import createSlider from 'mtrl/components/slider';
import createButton from 'mtrl/components/button';
import createFab from 'mtrl/components/fab';
import createDialog from 'mtrl/components/dialog';
import createCheckbox from 'mtrl/components/checkbox';
import { symbols } from '../shared/icons';
import { SHAPE_GALLERY } from '../shared/shape-gallery';

const root = document.documentElement;
const screen = document.querySelector<HTMLElement>('#screen')!;
const section = (className: string, ...children: HTMLElement[]) => {
  const element = document.createElement('div');
  element.className = className;
  element.append(...children);
  return element;
};

function buildScreen() {
  const bar = createTopAppBar({ type: 'small', title: 'Weekend trips', scrollable: false });
  bar.addLeadingElement(createIconButton({ icon: symbols.menu, ariaLabel: 'Open navigation' }).element);
  bar.addTrailingElement(createIconButton({ icon: symbols.heart, ariaLabel: 'Favorites' }).element);
  bar.addTrailingElement(createIconButton({ icon: symbols.accountCircle, ariaLabel: 'Account' }).element);

  const chips = createChips({ label: 'Trip type', multiSelect: false, chips: ['Hiking', 'Coast', 'City'].map((label, index) => ({ label, value: label.toLowerCase(), type: 'filter', selected: index === 0 })) });
  const card = createCard({
    variant: 'filled',
    header: { title: 'Lakeside cabin', subtitle: '2 nights · from €240' },
    content: { text: 'A quiet shore, a trail to the ridge, and a sauna by the water.' },
    media: { src: '/assets/playground/landscape-1.svg', alt: 'Illustrated mountain landscape', aspectRatio: '16:9', position: 'top' },
    buttons: [{ text: 'Details', variant: 'text' }, { text: 'Book', variant: 'tonal' }],
  });
  const where = createTextfield({ variant: 'outlined', label: 'Where to?', value: 'Lake Annecy' });
  const flexible = createSwitch({ label: 'Flexible dates', checked: true, icon: symbols.check });
  const budget = createSlider({ min: 0, max: 100, value: 40, step: 5, label: 'Budget', ariaLabel: 'Budget' });
  // Square buttons: their corners are shape tokens. A round button is half its height
  // whatever the scale says, as M3's round shape is.
  const actions = [createButton({ text: 'Search', variant: 'filled', shape: 'square' }), createButton({ text: 'Save', variant: 'tonal', shape: 'square' }), createButton({ text: 'Share', variant: 'outlined', shape: 'square' })];
  actions[0]!.element.dataset.preview = 'button';
  const fab = createFab({ icon: symbols.add, ariaLabel: 'New trip' });

  const dialog = createDialog({
    title: 'Book Lakeside cabin?', content: '<p>Two nights, Friday to Sunday. You can cancel for free until Thursday.</p>', ariaLabel: 'Book Lakeside cabin?',
    closeOnEscape: true, closeOnOverlayClick: true,
    buttons: [{ text: 'Cancel', variant: 'text', closeDialog: true }, { text: 'Book', variant: 'filled', closeDialog: true }],
  });
  card.element.addEventListener('click', event => {
    const button = (event.target as Element).closest('button');
    if (button?.textContent?.trim() === 'Book') dialog.open();
  });

  screen.append(
    bar.element,
    section('screen__body',
      chips.element,
      card.element,
      where.element,
      section('screen__row', flexible.element),
      budget.element,
      section('screen__actions', ...actions.map(button => button.element)),
    ),
    fab.element,
  );
}

/** The Shape page's gallery: each step's components, small and at rest. */
function buildGallery() {
  screen.classList.add('gallery');
  const make: Record<string, () => HTMLElement> = {
    'extra-small:textfield': () => createTextfield({ variant: 'outlined', label: 'Text field', value: 'Lake Annecy' }).element,
    'small:chips': () => createChips({ label: 'Chips', multiSelect: false, chips: ['Hiking', 'Coast'].map((label, index) => ({ label, value: label.toLowerCase(), type: 'filter', selected: index === 0 })) }).element,
    'medium:card': () => createCard({ variant: 'filled', header: { title: 'Card', subtitle: 'Medium corners' } }).element,
    'medium:button': () => createButton({ text: 'Square button', variant: 'filled', shape: 'square' }).element,
    'large:fab': () => createFab({ icon: symbols.add, ariaLabel: 'FAB' }).element,
    'large-increased:fab': () => createFab({ icon: symbols.edit, ariaLabel: 'Medium FAB', size: 'medium' }).element,
    'extra-large:fab': () => createFab({ icon: symbols.send, ariaLabel: 'Large FAB', size: 'large' }).element,
    'extra-large:dialog': () => {
      const dialog = createDialog({ title: 'Dialog', content: '<p>Extra-large corners, as every M3 dialog.</p>', ariaLabel: 'Dialog', closeOnEscape: true, closeOnOverlayClick: true, buttons: [{ text: 'Close', variant: 'text', closeDialog: true }] });
      const open = createButton({ text: 'Open dialog', variant: 'tonal' });
      open.on('click', () => dialog.open());
      return open.element;
    },
    'full:switch': () => createSwitch({ ariaLabel: 'Switch', checked: true, icon: symbols.check }).element,
    'full:slider': () => createSlider({ min: 0, max: 100, value: 60, ariaLabel: 'Slider' }).element,
  };
  for (const { step, items } of SHAPE_GALLERY) {
    const row = section('gallery__step');
    row.dataset.step = step;
    const name = document.createElement('p');
    name.className = 'gallery__name';
    name.innerHTML = `<span>${step.replaceAll('-', ' ')}</span> <output></output>`;
    const cells = items.map(item => {
      const cell = section('gallery__item', make[`${step}:${item.component}`]!());
      cell.dataset.component = item.component;
      cell.title = `${item.label}: ${step.replaceAll('-', ' ')}`;
      return cell;
    });
    row.append(name, section('gallery__items', ...cells));
    // Hovering a step's components tells the page which step they read.
    row.addEventListener('pointerenter', () => post({ type: 'md3:step-hover', step }));
    row.addEventListener('pointerleave', () => post({ type: 'md3:step-hover', step: null }));
    screen.append(row);
  }
  // The page sizes the frame to the gallery.
  new ResizeObserver(() => post({ type: 'md3:frame-size', height: Math.ceil(document.documentElement.scrollHeight) })).observe(screen);
}
const post = (data: Record<string, unknown>) => { if (parent !== window) parent.postMessage(data, location.origin); };
const gallery = new URLSearchParams(location.search).get('view') === 'gallery';
if (gallery) buildGallery(); else buildScreen();

let applied: string[] = [];
function apply(data: { base?: unknown; mode?: unknown; tokens?: unknown }) {
  if (typeof data.base === 'string') root.dataset.theme = data.base;
  root.dataset.themeMode = root.style.colorScheme = data.mode === 'dark' ? 'dark' : 'light';
  const tokens = data.tokens && typeof data.tokens === 'object' ? data.tokens as Record<string, unknown> : {};
  for (const name of applied) if (!(name in tokens)) root.style.removeProperty(name);
  applied = Object.keys(tokens).filter(name => name.startsWith('--mtrl-') && typeof tokens[name] === 'string');
  for (const name of applied) root.style.setProperty(name, tokens[name] as string);
  // Shown once the first theme is in, so it never paints mtrl's defaults first.
  screen.hidden = false;
  // The gallery names each step's value as the tokens now have it.
  for (const row of screen.querySelectorAll<HTMLElement>('.gallery__step')) row.querySelector('output')!.value = getComputedStyle(root).getPropertyValue(`--mtrl-sys-shape-corner-${row.dataset.step}`).trim();
}
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== parent) return;
  if (event.data?.type === 'md3:theme') apply(event.data);
  // The page highlights a step: its components are outlined.
  if (event.data?.type === 'md3:highlight') for (const row of screen.querySelectorAll<HTMLElement>('.gallery__step')) row.classList.toggle('gallery__step--active', row.dataset.step === event.data.step);
});
// Standalone (opened on its own), show the saved appearance.
if (parent === window) screen.hidden = false;
else post({ type: 'md3:frame-ready' });
