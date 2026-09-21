import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import { actions, actionCode, initialActionState, isAction, normalizeActionState, type ActionState } from '../shared/actions';

hljs.registerLanguage('javascript', javascript);

const componentSlug = document.querySelector<HTMLElement>('[data-component]')!.dataset.component!;
if (!isAction(componentSlug)) throw new Error('Unknown component');
const slug = componentSlug;

const form = document.querySelector<HTMLFormElement>('#configuration')!;
const frame = document.querySelector<HTMLIFrameElement>('#preview')!;
const code = document.querySelector<HTMLElement>('#generated-code')!;
const status = document.querySelector<HTMLElement>('#playground-status')!;
const tabs = [...document.querySelectorAll<HTMLButtonElement>('.preview-tab')];
const copyButton = document.querySelector<HTMLButtonElement>('#copy-code')!;
const previewDot = document.querySelector<HTMLElement>('.preview-dot')!;
let state: ActionState = initialActionState(slug);
const appearanceKey = 'md3-preview-appearance';
const themeSelect = document.querySelector<HTMLSelectElement>('#preview-theme')!;
const modeInputs = [...document.querySelectorAll<HTMLInputElement>('.preview-appearance input[name="mode"]')];

function applyAppearance(appearance: ActionState) {
  document.documentElement.dataset.previewMode = String(appearance.mode);
  // Keep the user's appearance as the reset defaults, too.
  for (const option of themeSelect.options) option.defaultSelected = option.value === appearance.theme;
  themeSelect.value = String(appearance.theme);
  for (const input of modeInputs) input.checked = input.defaultChecked = input.value === appearance.mode;
}
try {
  applyAppearance(normalizeActionState(slug, JSON.parse(localStorage.getItem(appearanceKey) || '{}')));
} catch { /* Keep the default appearance when storage is unavailable or invalid. */ }

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

function readForm(): ActionState {
  const values = Object.fromEntries(new FormData(form));
  const input: Record<string, unknown> = { ...values };
  for (const control of actions[slug].controls) if (control.kind === 'toggle') input[control.key] = values[control.key] === 'on';
  return normalizeActionState(slug, input);
}
function update(send = true) {
  state = readForm();
  for (const input of form.querySelectorAll<HTMLInputElement>('[data-enabled-when]')) input.disabled = state[input.dataset.enabledWhen!] !== true;
  code.innerHTML = hljs.highlight(actionCode(slug, state), { language: 'javascript' }).value;
  if (send) frame.contentWindow?.postMessage({ type: 'md3:configure', state }, location.origin);
}
form.addEventListener('input', () => update());
// Form-associated footer controls participate in FormData/reset, but events bubble through the footer.
document.querySelector('.preview-appearance')!.addEventListener('input', () => {
  update();
  applyAppearance(state);
  try { localStorage.setItem(appearanceKey, JSON.stringify({ theme: state.theme, mode: state.mode })); }
  catch { /* The controls still work when storage is unavailable. */ }
});
form.addEventListener('submit', event => event.preventDefault());
form.addEventListener('reset', () => { setTimeout(() => { update(); status.textContent = 'Configuration reset'; }, 0); });
frame.addEventListener('load', () => update());
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
  if (event.data?.type === 'md3:ready') { update(); status.textContent = 'Ready to try'; }
  if (event.data?.type === 'md3:click') status.textContent = `${actions[slug].name} clicked · ${event.data.count}`;
  if (event.data?.type === 'md3:event' && typeof event.data.message === 'string') status.textContent = event.data.message;
  if (event.data?.type === 'md3:selected' && typeof event.data.selected === 'boolean') {
    const selected = form.querySelector<HTMLInputElement>('[name="selected"]');
    if (selected) { selected.checked = event.data.selected; update(false); }
  }
  if (event.data?.type === 'md3:error') status.textContent = 'Preview could not load. Please reload the page.';
});
copyButton.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(actionCode(slug, state)); status.textContent = 'Code copied'; }
  catch {
    selectTab(document.querySelector<HTMLButtonElement>('#code-tab')!);
    const range = document.createRange(); range.selectNodeContents(code);
    const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(range);
    status.textContent = 'Code selected. Use your copy shortcut.';
  }
});
update();
