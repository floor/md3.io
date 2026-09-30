// The Styles pages: copy buttons, the Color page's theme and mode, the Typography
// page's sample text, the overview's summary and the Shape page's controls. Values
// come from the JSON the server embeds, read from mtrl's CSS; theme changes go
// through the store (theme-store.ts), which the preview and the export follow.
import { AA_TEXT, contrastRatio, pairOf } from '../shared/color';
import { CORNER_MAX, cornerRadius, isScalable, type ShapeState } from '../shared/theme-state';
import { themeBase, themeStore } from './theme-store';
import { announce, changes, copy, themeName } from './styles-panel';

document.addEventListener('click', async event => {
  const button = (event.target as Element | null)?.closest<HTMLButtonElement>('button[data-copy]');
  if (!button) return;
  const text = button.dataset.copy!;
  const label = button.innerHTML;
  const copied = await copy(text, text);
  button.textContent = copied ? 'Copied' : 'Copy failed';
  setTimeout(() => { button.innerHTML = label; }, 1600);
});

// ─── Color ──────────────────────────────────────────────────────────

type Value = string | [string, string];
type Scheme = Record<string, Value>;
type Mode = 'light' | 'dark';
const tokensScript = document.querySelector<HTMLScriptElement>('#color-tokens');
if (tokensScript) {
  const { themes } = JSON.parse(tokensScript.textContent || '{}') as { themes: Record<string, Record<Mode, Scheme>> };
  const themeSelect = document.querySelector<HTMLSelectElement>('#color-theme')!;
  const modeInputs = [...document.querySelectorAll<HTMLInputElement>('input[name="color-mode"]')];
  const swatches = [...document.querySelectorAll<HTMLElement>('.swatch')];

  const render = (theme: string, mode: Mode) => {
    const scheme = themes[theme]![mode];
    const value = (role: string) => { const v = scheme[role]; return v === undefined ? undefined : typeof v === 'string' ? v : v[0]; };
    for (const swatch of swatches) {
      const role = swatch.dataset.role!;
      const own = scheme[role];
      swatch.hidden = own === undefined;
      if (own === undefined) continue;
      const background = value(role)!;
      const pair = pairOf(role, candidate => candidate in scheme);
      const ink = pair ? value(pair)! : null;
      const chip = swatch.querySelector<HTMLElement>('.swatch__chip')!;
      chip.style.background = background;
      chip.style.color = ink ?? 'inherit';
      swatch.querySelector('.swatch__hex')!.textContent = background;
      const contrast = swatch.querySelector<HTMLElement>('.swatch__contrast')!;
      const ratio = ink ? contrastRatio(background, ink) : null;
      contrast.hidden = ratio === null;
      if (ratio !== null) {
        contrast.querySelector('.swatch__ratio')!.textContent = `${ratio.toFixed(2)}:1`;
        contrast.querySelector('.swatch__pair')!.textContent = `with ${pair}`;
        const badge = contrast.querySelector<HTMLElement>('.styles-badge')!;
        const pass = ratio >= AA_TEXT;
        badge.textContent = pass ? 'AA pass' : 'AA fail';
        badge.className = `styles-badge styles-badge--${pass ? 'pass' : 'fail'}`;
      }
      const inherited = swatch.querySelector<HTMLElement>('.swatch__inherited')!;
      inherited.hidden = typeof own === 'string';
      if (typeof own !== 'string') inherited.querySelector('span')!.textContent = own[1];
    }
    // An empty group (a theme without extras) hides its heading too.
    for (const group of document.querySelectorAll<HTMLElement>('.color-group')) {
      group.hidden = ![...group.querySelectorAll<HTMLElement>('.swatch')].some(swatch => !swatch.hidden);
    }
  };

  // The store holds theme and mode: shared with the preview, the playground and other tabs.
  themeStore.subscribe(({ base, mode }) => {
    const theme = base in themes ? base : 'baseline';
    themeSelect.value = theme;
    for (const input of modeInputs) input.checked = input.value === mode;
    render(theme, mode);
  });
  themeSelect.addEventListener('change', () => themeStore.set({ base: themeSelect.value }));
  for (const input of modeInputs) input.addEventListener('change', () => themeStore.set({ mode: input.value === 'dark' ? 'dark' : 'light' }));
}

// ─── Typography ─────────────────────────────────────────────────────

const sampleInput = document.querySelector<HTMLInputElement>('#type-sample');
if (sampleInput) {
  const samples = [...document.querySelectorAll<HTMLElement>('.type-sample')];
  const fallback = sampleInput.defaultValue;
  sampleInput.addEventListener('input', () => {
    const text = sampleInput.value.trim() ? sampleInput.value : fallback;
    for (const sample of samples) sample.textContent = text;
  });
}

// ─── Overview: what you changed ─────────────────────────────────────

const summary = document.querySelector<HTMLElement>('#styles-summary');
if (summary) {
  const list = summary.querySelector<HTMLElement>('.styles-summary__list')!;
  const empty = summary.querySelector<HTMLElement>('.styles-summary__empty')!;
  const base = summary.querySelector<HTMLElement>('.styles-summary__base')!;
  themeStore.subscribe(state => {
    base.textContent = `${themeName(state.base)}, ${state.mode}`;
    const changed = changes(state);
    empty.hidden = changed.length > 0;
    list.replaceChildren(...changed.map(change => {
      const item = document.createElement('li');
      item.className = 'styles-summary__item';
      item.innerHTML = '<a></a><span></span><button type="button" class="ui-btn"></button>';
      const [link, text, reset] = item.children as unknown as [HTMLAnchorElement, HTMLElement, HTMLButtonElement];
      Object.assign(link, { href: change.href, textContent: change.label });
      text.textContent = change.summary;
      Object.assign(reset, { textContent: 'Reset' });
      reset.dataset.themeReset = change.key;
      reset.setAttribute('aria-label', `Reset ${change.label.toLowerCase()}`);
      return item;
    }));
  });
}

// ─── Shape ──────────────────────────────────────────────────────────

const roundness = document.querySelector<HTMLInputElement>('#shape-roundness');
if (roundness) {
  const roundnessValue = document.querySelector<HTMLOutputElement>('#shape-roundness-value')!;
  const steps = [...document.querySelectorAll<HTMLElement>('.shape-step')];
  const shape = (): ShapeState => themeStore.get().shape ?? {};
  themeStore.subscribe(state => {
    const percent = state.shape?.roundness ?? 100;
    roundness.value = String(percent);
    roundnessValue.value = `${percent}%`;
    for (const row of steps) {
      const step = row.dataset.step!;
      const radius = cornerRadius(state.shape, themeBase, step);
      row.querySelector<HTMLElement>('.shape-step__sample')!.style.borderRadius = `${radius}px`;
      row.querySelector<HTMLOutputElement>('output')!.value = `${radius}px`;
      row.classList.toggle('shape-step--changed', radius !== themeBase.shape[step]);
      const slider = row.querySelector<HTMLInputElement>('input[type="range"]');
      if (slider) {
        // A scaled step can pass the slider's end; the end follows.
        slider.max = String(Math.max(CORNER_MAX, radius));
        slider.value = String(radius);
      }
    }
  });
  // Roundness scales the whole scale again, so it replaces any fine-tuning.
  roundness.addEventListener('input', () => themeStore.set({ shape: { roundness: Number(roundness.value) } }));
  roundness.addEventListener('change', () => announce(`Roundness ${roundness.value}%`));
  for (const slider of document.querySelectorAll<HTMLInputElement>('.shape-step input[type="range"]')) {
    const step = slider.dataset.step!;
    if (!isScalable(themeBase.shape[step] ?? 0)) continue;
    slider.addEventListener('input', () => themeStore.set({ shape: { ...shape(), corners: { ...shape().corners, [step]: Number(slider.value) } } }));
    slider.addEventListener('change', () => announce(`${step.replaceAll('-', ' ')} corner ${slider.value}px`));
  }
}
