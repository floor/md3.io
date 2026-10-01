// The Themes page's viewer (src/server/shells/styles-themes.eta): the theme select
// repaints the Light and Dark Scheme cards and the tonal palettes from the page's JSON,
// read by the server from mtrl's theme CSS. The choice is the Styles base theme (the
// store, shared with the Color page and the playground) and `?theme=<name>` in the
// address bar. A tile click copies its hex.
import { themeStore } from './theme-store';
import { copy } from './styles-panel';

interface ThemeData { name: string; light: string[]; dark: string[]; origin: string | null; palettes: Record<string, string[]> | null }
const dataScript = document.querySelector<HTMLScriptElement>('#themes-data');
if (dataScript) {
  const { roles, themes } = JSON.parse(dataScript.textContent || '{}') as { roles: string[]; themes: ThemeData[] };
  const select = document.querySelector<HTMLSelectElement>('#themes-theme')!;
  const cards = [...document.querySelectorAll<HTMLElement>('.scheme-card')];
  const palettes = document.querySelector<HTMLElement>('.palettes')!;
  const toast = document.querySelector<HTMLElement>('#themes-toast')!;
  const label = (name: string) => select.querySelector<HTMLOptionElement>(`option[value="${name}"]`)?.textContent ?? name;

  const render = (theme: ThemeData) => {
    for (const card of cards) {
      const mode = card.dataset.mode as 'light' | 'dark';
      const hex = (role: string) => theme[mode][roles.indexOf(role)]!;
      card.style.background = hex('surface');
      card.style.color = hex('on-surface');
      card.style.setProperty('--card-outline', hex('outline-variant'));
      for (const tile of card.querySelectorAll<HTMLElement>('.scheme-tile')) {
        const value = hex(tile.dataset.role!);
        tile.style.background = value;
        tile.style.color = tile.dataset.ink ? hex(tile.dataset.ink) : '#ffffff';
        tile.title = value;
        tile.setAttribute('aria-label', `${tile.textContent} ${value}, copy`);
      }
    }
    const known = theme.palettes !== null;
    palettes.querySelector<HTMLElement>('.palettes__origin')!.hidden = !known;
    palettes.querySelector<HTMLElement>('.palettes__none')!.hidden = known;
    palettes.querySelector<HTMLElement>('.palettes__list')!.hidden = !known;
    palettes.querySelector('.palettes__origin span')!.textContent = theme.origin ?? '';
    palettes.querySelector('.palettes__none span')!.textContent = label(theme.name);
    if (theme.palettes) for (const palette of palettes.querySelectorAll<HTMLElement>('.palette')) {
      const tones = theme.palettes[palette.dataset.palette!]!;
      const name = palette.querySelector('.palette__name')!.textContent;
      palette.querySelectorAll<HTMLElement>('.palette__tone').forEach((cell, i) => {
        cell.style.background = tones[i]!;
        cell.title = `${name} ${cell.dataset.tone}: ${tones[i]}`;
      });
    }
  };

  themeStore.subscribe(({ base }) => {
    const theme = themes.find(entry => entry.name === base) ?? themes[0]!;
    select.value = theme.name;
    render(theme);
    const url = new URL(location.href);
    if (url.searchParams.get('theme') !== theme.name) {
      url.searchParams.set('theme', theme.name);
      history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    }
  });
  select.addEventListener('change', () => themeStore.set({ base: select.value }));

  // A tile copies its hex; a small toast says so.
  let hide: ReturnType<typeof setTimeout> | undefined;
  document.addEventListener('click', async event => {
    const tile = (event.target as Element | null)?.closest<HTMLElement>('.scheme-tile');
    if (!tile) return;
    const hex = tile.title;
    const copied = await copy(hex, hex);
    toast.textContent = copied ? `Copied ${hex}` : `Could not copy ${hex}`;
    toast.classList.add('themes-toast--shown');
    clearTimeout(hide);
    hide = setTimeout(() => toast.classList.remove('themes-toast--shown'), 1400);
  });
}
