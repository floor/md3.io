import createButton from 'mtrl/components/button';
import createIconButton from 'mtrl/components/icon-button';
import createButtonGroup from 'mtrl/components/button-group';
import createSplitButton from 'mtrl/components/split-button';
import createFab from 'mtrl/components/fab';
import createExtendedFab from 'mtrl/components/extended-fab';
import { actions, initialActionState, isAction, normalizeActionState, type ActionState } from '../shared/actions';

const componentSlug = document.documentElement.dataset.component!;
if (!isAction(componentSlug)) throw new Error('Unknown component');
const slug = componentSlug;
let component: { element: HTMLElement; destroy: () => void } | undefined;
let current: ActionState | undefined;
let clicks = 0;
const stage = document.querySelector<HTMLElement>('#stage')!;
const post = (data: Record<string, unknown>) => parent.postMessage(data, location.origin);
const clicked = () => post({ type: 'md3:click', count: ++clicks });
const message = (value: string) => post({ type: 'md3:event', message: value });

function create(state: ActionState) {
  switch (slug) {
    case 'button': {
      const button = createButton(actions.button.config(state));
      button.on('click', clicked);
      return button;
    }
    case 'icon-button': {
      const button = createIconButton(actions['icon-button'].config(state));
      button.on('click', clicked);
      button.element.addEventListener('toggle', event => {
        if (!(event instanceof CustomEvent) || typeof event.detail?.selected !== 'boolean') return;
        const selected: boolean = event.detail.selected;
        if (current) current.selected = selected;
        post({ type: 'md3:selected', selected });
        message(selected ? 'Icon button selected' : 'Icon button deselected');
      });
      return button;
    }
    case 'button-group': {
      const group = createButtonGroup(actions['button-group'].config(state));
      group.on('click', event => message(`${event.button.element.getAttribute('aria-label') || 'Action'} clicked`));
      group.on('change', event => message(event.values.length ? `Selected: ${event.values.join(', ')}` : 'Selection cleared'));
      return group;
    }
    case 'split-button': {
      const button = createSplitButton(actions['split-button'].config(state));
      button.on('click', clicked);
      button.on('expand', () => message('Menu opened'));
      button.on('collapse', () => message('Menu closed'));
      button.on('select', event => message(event.item && 'text' in event.item ? `Selected: ${event.item.text}` : 'Menu option selected'));
      return button;
    }
    case 'fab': {
      const button = createFab(actions.fab.config(state));
      if (state.lowered) button.lower();
      button.on('click', clicked);
      return button;
    }
    case 'extended-fab': {
      const button = createExtendedFab(actions['extended-fab'].config(state));
      if (state.collapsed) button.collapse();
      if (state.lowered) button.lower();
      button.on('click', clicked);
      return button;
    }
  }
}
const fingerprint = (state: ActionState) => JSON.stringify([actions[slug].config(state), state.collapsed, state.lowered]);
function render(state: ActionState) {
  document.documentElement.dataset.theme = String(state.theme);
  document.documentElement.dataset.themeMode = String(state.mode);
  document.documentElement.style.colorScheme = String(state.mode);
  if (current && fingerprint(current) === fingerprint(state)) { current = state; return; }
  component?.destroy();
  component = create(state);
  stage.replaceChildren(component.element);
  current = state;
}
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'md3:configure') return;
  try { render(normalizeActionState(slug, event.data.state)); }
  catch (error) { console.error(error); post({ type: 'md3:error' }); }
});
window.addEventListener('pagehide', () => component?.destroy());
// Preserve the appearance applied before paint instead of briefly rendering the light defaults.
render(normalizeActionState(slug, {
  ...initialActionState(slug),
  theme: document.documentElement.dataset.theme,
  mode: document.documentElement.dataset.themeMode,
}));
post({ type: 'md3:ready' });
