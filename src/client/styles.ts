// The Styles pages: copy buttons, the Color page's theme and mode, the Typography
// page's sample text, the overview's summary and the Shape page's controls. Values
// come from the JSON the server embeds, read from mtrl's CSS; theme changes go
// through the store (theme-store.ts), which the preview and the export follow.
import { AA_TEXT, contrastRatio, pairOf } from '../shared/color';
import { CORNER_MAX, cornerRadius, isEditable } from '../shared/theme-state';
import { SHAPE_LABELS, morphPath, shapeProfile } from '../shared/shape-library';
import { LOADING_INDICATOR_SHAPES } from 'mtrl/components/loading-indicator/constants';
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

const strip = document.querySelector<HTMLElement>('.shape-strip');
if (strip) {
  const tiles = [...document.querySelectorAll<HTMLElement>('.shape-tile:not(.shape-tile--missing)')];
  const gallery = document.querySelector<HTMLIFrameElement>('.shape-gallery');
  const corners = () => themeStore.get().shape?.corners ?? {};
  themeStore.subscribe(state => {
    for (const tile of tiles) {
      const step = tile.dataset.step!;
      const radius = cornerRadius(state.shape, themeBase, step);
      tile.querySelector<HTMLElement>('.shape-tile__shape')!.style.borderRadius = `${Math.min(radius, 999)}px`;
      tile.classList.toggle('shape-tile--changed', radius !== themeBase.shape[step]);
      if (!isEditable(themeBase.shape[step] ?? 0)) continue;
      tile.querySelector('output')!.value = `${radius}px`;
      tile.querySelector('.shape-tile__edit')!.setAttribute('aria-label', `Edit ${step.replaceAll('-', ' ')}, ${radius}px`);
      for (const input of tile.querySelectorAll<HTMLInputElement>('.shape-tile__editor input')) if (input !== document.activeElement || input.type === 'range') input.value = String(radius);
    }
  });

  // A value opens its editor; the number and the slider both write to the store.
  const closeEditors = (except?: HTMLElement) => {
    for (const tile of tiles) if (tile !== except) {
      const editor = tile.querySelector<HTMLElement>('.shape-tile__editor');
      if (editor && !editor.hidden) { editor.hidden = true; tile.querySelector('.shape-tile__edit')!.setAttribute('aria-expanded', 'false'); }
    }
  };
  for (const tile of tiles) {
    const edit = tile.querySelector<HTMLButtonElement>('.shape-tile__edit');
    if (!edit) continue;
    const step = tile.dataset.step!;
    const editor = tile.querySelector<HTMLElement>('.shape-tile__editor')!;
    const number = editor.querySelector<HTMLInputElement>('input[type="number"]')!;
    edit.addEventListener('click', () => {
      const open = editor.hidden;
      closeEditors(tile);
      editor.hidden = !open;
      edit.setAttribute('aria-expanded', String(open));
      if (open) number.select();
    });
    for (const input of editor.querySelectorAll<HTMLInputElement>('input')) {
      input.addEventListener('input', () => {
        const value = Math.min(CORNER_MAX, Math.max(0, Math.round(Number(input.value))));
        if (input.value !== '' && Number.isFinite(value)) themeStore.set({ shape: { corners: { ...corners(), [step]: value } } });
      });
      input.addEventListener('change', () => announce(`${step.replaceAll('-', ' ')} corner ${cornerRadius(themeStore.get().shape, themeBase, step)}px`));
      input.addEventListener('keydown', event => {
        if (event.key !== 'Escape' && event.key !== 'Enter') return;
        event.preventDefault();
        editor.hidden = true;
        edit.setAttribute('aria-expanded', 'false');
        edit.focus();
      });
    }
  }

  // Selecting a step highlights its components in the gallery; hovering a gallery row
  // highlights its step here.
  const select = (step: string | null) => {
    for (const tile of tiles) tile.querySelector('.shape-tile__select')!.setAttribute('aria-pressed', String(tile.dataset.step === step));
    gallery?.contentWindow?.postMessage({ type: 'md3:highlight', step }, location.origin);
  };
  for (const tile of tiles) tile.querySelector('.shape-tile__select')!.addEventListener('click', event => {
    const pressed = (event.currentTarget as HTMLElement).getAttribute('aria-pressed') === 'true';
    select(pressed ? null : tile.dataset.step!);
  });
  addEventListener('message', event => {
    if (event.origin !== location.origin || !gallery || event.source !== gallery.contentWindow || event.data?.type !== 'md3:step-hover') return;
    for (const tile of tiles) tile.classList.toggle('shape-tile--hover', tile.dataset.step === event.data.step);
  });
}

// The expressive shapes: filled with the base theme's primary container, and one
// morphing through the loading indicator's sequence (radial profiles interpolated,
// as mtrl's indicator does). Paused under reduced motion until asked to play.
const library = document.querySelector<HTMLElement>('#shape-library');
if (library) {
  const colors = JSON.parse(document.querySelector('#shape-colors')?.textContent || '{}') as Record<string, Record<'light' | 'dark', [string, string]>>;
  themeStore.subscribe(({ base, mode }) => {
    const [fill, ink] = colors[base]?.[mode] ?? colors.baseline?.light ?? [];
    if (fill) library.style.setProperty('--shape-fill', fill);
    if (ink) library.style.setProperty('--shape-ink', ink);
  });
  const path = library.querySelector<SVGPathElement>('#shape-morph-path')!;
  const name = library.querySelector<HTMLElement>('#shape-morph-name')!;
  const toggle = library.querySelector<HTMLButtonElement>('#shape-morph-toggle')!;
  const sequence = LOADING_INDICATOR_SHAPES;
  const profiles = sequence.map(shape => shapeProfile(shape));
  const HOLD = 650;
  const MORPH = 500;
  let playing = false;
  let frame = 0;
  let start = 0;
  let elapsed = 0;
  const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
  const draw = (time: number) => {
    const index = Math.floor(time / HOLD) % sequence.length;
    const t = ease(Math.min(1, (time % HOLD) / MORPH));
    path.setAttribute('d', morphPath(profiles[index]!, profiles[(index + 1) % sequence.length]!, t, (time / HOLD) * 90 % 360));
    name.textContent = SHAPE_LABELS[sequence[(index + (t > 0.5 ? 1 : 0)) % sequence.length]!];
  };
  const tick = (now: number) => { elapsed = Math.max(0, now - start); draw(elapsed); frame = requestAnimationFrame(tick); };
  const play = (on: boolean) => {
    playing = on;
    toggle.setAttribute('aria-pressed', String(on));
    toggle.textContent = on ? 'Pause' : 'Play';
    cancelAnimationFrame(frame);
    if (on) { start = performance.now() - elapsed; frame = requestAnimationFrame(tick); }
  };
  draw(0);
  toggle.addEventListener('click', () => play(!playing));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  play(!reduced.matches);
  reduced.addEventListener('change', () => { if (reduced.matches) play(false); });
}
