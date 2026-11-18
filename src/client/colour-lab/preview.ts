// Build the library components once. Applying a scheme changes their inherited
// tokens in place, preserving field values, selections and focus.
import createCard from 'material/components/card';
import createButton from 'material/components/button';
import createIconButton from 'material/components/icon-button';
import createFab from 'material/components/fab';
import createTextField from 'material/components/text-field';
import createCheckbox from 'material/components/checkbox';
import createRadios from 'material/components/radios';
import createSwitch from 'material/components/switch';
import createSlider from 'material/components/slider';
import { createChips, createAssistChip } from 'material/components/chips';
import createBadge from 'material/components/badge';
import { symbols } from '../../shared/icons';

const block = (className: string, ...children: HTMLElement[]): HTMLDivElement => {
  const node = document.createElement('div');
  node.className = className;
  node.append(...children);
  return node;
};
const text = (tag: string, className: string, content: string): HTMLElement => {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = content;
  return node;
};
export const LAB_STATUSES = [
  { role: 'error', label: 'Error', message: 'Something needs your attention.', chip: 'Review' },
  { role: 'success', label: 'Success', message: 'Your changes are saved.', chip: 'Saved' },
  { role: 'warning', label: 'Warning', message: 'You’re close to your limit.', chip: 'Check limit' },
  { role: 'info', label: 'Info', message: 'A little help along the way.', chip: 'Learn more' },
] as const;

export function buildLabPreview(root: HTMLElement, tell: (message: string) => void): () => void {
  const cleanups: (() => void)[] = [];
  const keep = <T extends { element: HTMLElement; destroy?: () => unknown; lifecycle?: { destroy: () => unknown } }>(component: T): T => {
    cleanups.push(() => component.destroy ? component.destroy() : component.lifecycle?.destroy());
    return component;
  };
  const feedback = text('p', 'lab-preview-feedback', 'Try a component. Make yourself at home.');
  feedback.setAttribute('role', 'status');
  const action = (message: string) => { feedback.textContent = message; };
  const art = block('lab-showcase-art', text('span', '', 'YOUR COLOUR STORY'));
  art.setAttribute('aria-hidden', 'true');
  const actions = (['filled', 'tonal', 'outlined', 'text'] as const).map((variant, index) => {
    const button = keep(createButton({ variant, text: ['Create project', 'Explore', 'Save', 'Learn more'][index], size: 's' }));
    button.on('click', () => action(['Project created. A fresh start!', 'There’s a whole palette to explore.', 'Saved to your collection.', 'Every component reads the same colour tokens.'][index]!));
    return button.element;
  });
  const icons = [
    ['Save collection', symbols.bookmark], ['Share collection', symbols.share], ['Unavailable action', symbols.archive],
  ].map(([label, icon], index) => {
    const button = keep(createIconButton({ icon: icon!, ariaLabel: label!, variant: 'tonal', disabled: index === 2 }));
    button.on('click', () => action(index === 0 ? 'Collection saved.' : 'Ready to share.'));
    return button.element;
  });
  const fab = keep(createFab({ icon: symbols.add, ariaLabel: 'Add a project', placement: 'none' }));
  fab.on('click', () => action('A new idea starts here.'));
  const chips = keep(createChips({ label: 'Collection type', multiSelect: false, selectionRequired: true, chips: [
    { label: 'Personal', value: 'personal', type: 'filter', selected: true },
    { label: 'Shared', value: 'shared', type: 'filter' },
  ] }));
  const showcase = keep(createCard({ variant: 'elevated', content: { children: [
    art,
    text('h3', 'lab-showcase-title', 'A fresh perspective.'),
    text('p', 'lab-showcase-description', 'A place for your next idea, in a palette that feels like you.'),
    chips.element,
    block('lab-preview-actions', ...actions),
    block('lab-preview-tools', block('', ...icons), fab.element),
    feedback,
  ] } }));
  root.querySelector('#lab-showcase')!.append(showcase.element);

  const name = keep(createTextField({ label: 'Project name', variant: 'outlined', value: 'Something good', density: 'compact' }));
  const note = keep(createTextField({ label: 'A little description', variant: 'filled', value: 'Room for a new idea', density: 'compact' }));
  const notifications = keep(createCheckbox({ label: 'Email updates', checked: true }));
  const unavailable = keep(createCheckbox({ label: 'Coming soon', checked: true, disabled: true }));
  const autosave = keep(createSwitch({ label: 'Auto-save', checked: true, icon: symbols.check }));
  const visibility = keep(createRadios({ name: 'lab-preview-visibility', direction: 'horizontal', value: 'private', options: [
    { label: 'Private', value: 'private' }, { label: 'Public', value: 'public' },
  ] }));
  const capacity = keep(createSlider({ label: 'Creative energy', ariaLabel: 'Creative energy', value: 65, min: 0, max: 100, step: 1, size: 'S' }));
  const form = keep(createCard({ variant: 'filled', content: { children: [
    text('h3', 'lab-form-title', 'The little details'),
    block('lab-form-fields', name.element, note.element),
    block('lab-selection-row', block('lab-checks', notifications.element, unavailable.element), autosave.element),
    visibility.element,
    block('lab-form-slider', capacity.element),
  ] } }));
  root.querySelector('#lab-form')!.append(form.element);

  for (const status of LAB_STATUSES) {
    const badge = keep(createBadge({ color: status.role, variant: 'small', label: status.label }));
    const chip = keep(createAssistChip({ label: status.chip, ariaLabel: status.label + ': ' + status.chip }));
    chip.element.style.backgroundColor = 'transparent';
    chip.element.style.color = 'inherit';
    chip.element.style.borderColor = 'currentColor';
    chip.on('click', () => tell(status.message));
    const ratio = text('p', 'lab-status-ratio', '—');
    ratio.dataset.statusRatio = status.role;
    const banner = block('lab-status', block('lab-status-top', badge.element, text('strong', '', status.label)), text('p', 'lab-status-message', status.message), ratio, chip.element);
    banner.dataset.status = status.role;
    banner.style.backgroundColor = 'var(--mtrl-sys-color-' + status.role + ')';
    banner.style.color = 'var(--mtrl-sys-color-on-' + status.role + ')';
    root.querySelector('#lab-status-grid')!.append(banner);
  }
  return () => { for (const cleanup of cleanups.reverse()) cleanup(); };
}
