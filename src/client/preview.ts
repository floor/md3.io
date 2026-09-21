import createButton from 'mtrl/components/button';
import { buttonConfig, normalizeState, type ButtonState } from '../shared/button';

let button: ReturnType<typeof createButton> | undefined;
let current: ButtonState | undefined;
let clicks = 0;
const stage = document.querySelector<HTMLElement>('#stage')!;
function render(state: ButtonState) {
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.dataset.themeMode = state.mode;
  if (current && JSON.stringify(buttonConfig(current)) === JSON.stringify(buttonConfig(state))) { current = state; return; }
  button?.destroy();
  button = createButton(buttonConfig(state));
  button.on('click', () => parent.postMessage({ type: 'md3:click', count: ++clicks }, location.origin));
  stage.replaceChildren(button.element);
  current = state;
}
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'md3:configure') return;
  try { render(normalizeState(event.data.state)); }
  catch (error) { console.error(error); parent.postMessage({ type: 'md3:error' }, location.origin); }
});
window.addEventListener('pagehide', () => button?.destroy());
render(normalizeState({}));
parent.postMessage({ type: 'md3:ready' }, location.origin);
