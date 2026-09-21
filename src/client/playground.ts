import { buttonCode, defaults, normalizeState, type ButtonState } from '../shared/button';

const form = document.querySelector<HTMLFormElement>('#configuration')!;
const frame = document.querySelector<HTMLIFrameElement>('#preview')!;
const code = document.querySelector<HTMLElement>('#generated-code')!;
const status = document.querySelector<HTMLElement>('#playground-status')!;
const tabs = [...document.querySelectorAll<HTMLButtonElement>('.preview-tab')];
const hint = document.querySelector<HTMLElement>('#view-hint')!;
const copyButton = document.querySelector<HTMLButtonElement>('#copy-code')!;
const previewDot = document.querySelector<HTMLElement>('.preview-dot')!;
let state: ButtonState = { ...defaults };

function selectTab(selected: HTMLButtonElement) {
  for (const tab of tabs) {
    const active = tab === selected;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')!)!.hidden = !active;
  }
  const showingCode = selected.id === 'code-tab';
  copyButton.hidden = !showingCode;
  previewDot.hidden = showingCode;
  hint.textContent = showingCode ? 'JavaScript · updates live' : 'Click to try it';
}
for (const tab of tabs) {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    const index = tabs.indexOf(tab);
    const target = event.key === 'ArrowRight' ? tabs[(index + 1) % tabs.length]
      : event.key === 'ArrowLeft' ? tabs[(index + tabs.length - 1) % tabs.length]
      : event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs.at(-1) : undefined;
    if (!target) return;
    event.preventDefault();
    selectTab(target);
    target.focus();
  });
}

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
copyButton.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(buttonCode(state)); status.textContent = 'Code copied'; }
  catch {
    selectTab(document.querySelector<HTMLButtonElement>('#code-tab')!);
    const range = document.createRange(); range.selectNodeContents(code);
    const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(range);
    status.textContent = 'Code selected. Use your copy shortcut.';
  }
});
update();
