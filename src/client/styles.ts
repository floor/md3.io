// The Styles pages: copy buttons, the Color page's theme and mode, the Typography
// page's sample text. Values come from the JSON the server embeds, read from mtrl's CSS.
import { AA_TEXT, contrastRatio, pairOf } from '../shared/color';

const status = document.querySelector<HTMLElement>('#styles-status');
const announce = (message: string) => { if (status) status.textContent = message; };

document.addEventListener('click', async event => {
  const button = (event.target as Element | null)?.closest<HTMLButtonElement>('button[data-copy]');
  if (!button) return;
  const text = button.dataset.copy!;
  let copied = false;
  try { await navigator.clipboard.writeText(text); copied = true; } catch { /* Clipboard may be unavailable. */ }
  button.textContent = copied ? 'Copied' : 'Copy failed';
  announce(copied ? `Copied ${text}` : `Could not copy ${text}`);
  setTimeout(() => { button.textContent = 'Copy'; }, 1600);
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
  // The playground's appearance key: a theme picked here is the playground's too.
  const APPEARANCE_KEY = 'md3-preview-appearance';

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

  const current = (): { theme: string; mode: Mode } => ({
    theme: themeSelect.value,
    mode: modeInputs.find(input => input.checked)?.value === 'dark' ? 'dark' : 'light',
  });
  const apply = ({ theme, mode }: { theme: string; mode: Mode }) => {
    themeSelect.value = theme;
    for (const input of modeInputs) input.checked = input.value === mode;
    document.documentElement.dataset.previewMode = mode;
    render(theme, mode);
  };

  let saved: { theme?: unknown; mode?: unknown } = {};
  try { saved = JSON.parse(localStorage.getItem(APPEARANCE_KEY) || '{}') ?? {}; } catch { /* Storage may be unavailable or invalid. */ }
  apply({
    theme: typeof saved.theme === 'string' && saved.theme in themes ? saved.theme : themeSelect.value,
    mode: saved.mode === 'dark' ? 'dark' : 'light',
  });

  const onChange = () => {
    const next = current();
    apply(next);
    try {
      // Keep whatever else the playground stores beside theme and mode.
      const stored = JSON.parse(localStorage.getItem(APPEARANCE_KEY) || '{}');
      localStorage.setItem(APPEARANCE_KEY, JSON.stringify({ ...(stored && typeof stored === 'object' ? stored : {}), theme: next.theme, mode: next.mode }));
    } catch { /* The controls still work when storage is unavailable. */ }
  };
  themeSelect.addEventListener('change', onChange);
  for (const input of modeInputs) input.addEventListener('change', onChange);
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
