// The Styles preview's screen, inside its frame: a small trip-planning app made of real
// mtrl components, created once. The page sends the base theme, the mode and the
// overridden custom properties; they go on the root, so everything inside follows,
// the dialog in the top layer included, without re-creating a component.
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
import { symbols } from '../shared/icons';

const root = document.documentElement;
const screen = document.querySelector<HTMLElement>('#screen')!;
const section = (className: string, ...children: HTMLElement[]) => {
  const element = document.createElement('div');
  element.className = className;
  element.append(...children);
  return element;
};

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
}
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'md3:theme') return;
  apply(event.data);
});
// Standalone (opened on its own), show the saved appearance.
if (parent === window) screen.hidden = false;
else parent.postMessage({ type: 'md3:frame-ready' }, location.origin);
