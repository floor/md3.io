import { buttonCode, defaults, normalizeState, type ButtonState } from '../shared/button';

const form = document.querySelector<HTMLFormElement>('#configuration')!;
const frame = document.querySelector<HTMLIFrameElement>('#preview')!;
const code = document.querySelector<HTMLElement>('#generated-code')!;
const status = document.querySelector<HTMLElement>('#playground-status')!;
let state: ButtonState = { ...defaults };

function readForm(): ButtonState {
  const values = Object.fromEntries(new FormData(form));
  return normalizeState({ ...values, disabled: values.disabled === 'on', shape: values.square === 'on' ? 'square' : 'round' });
}
function update() {
  state = readForm();
  code.textContent = buttonCode(state);
  frame.contentWindow?.postMessage({ type: 'md3:configure', state }, location.origin);
}
form.addEventListener('input', update);
form.addEventListener('submit', event => event.preventDefault());
form.addEventListener('reset', () => { setTimeout(() => { update(); status.textContent = 'Configuration reset'; }, 0); });
frame.addEventListener('load', update);
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
  if (event.data?.type === 'md3:ready') { update(); status.textContent = 'Ready to try'; }
  if (event.data?.type === 'md3:click') status.textContent = `Button clicked · ${event.data.count}`;
  if (event.data?.type === 'md3:error') status.textContent = 'Preview could not load. Please reload the page.';
});
document.querySelector<HTMLButtonElement>('#copy-code')!.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(buttonCode(state)); status.textContent = 'Code copied'; }
  catch {
    document.querySelector<HTMLDetailsElement>('#code-details')!.open = true;
    const range = document.createRange(); range.selectNodeContents(code);
    const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(range);
    status.textContent = 'Code selected. Use your copy shortcut.';
  }
});
update();
