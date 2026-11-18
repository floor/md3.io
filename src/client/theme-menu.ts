// The header's Themes menu: material's own menu, loaded on first use (site.ts imports
// this chunk on the button's first hover, focus or click), with the icon button's own
// definition, so a page that never opens it carries neither. The items come from the
// inert #theme-menu-template (base.eta); the current theme's item shows a check.
import 'material/elements/css/menu';
import 'material/elements/css/icon-button';
import { defineIconButton, defineMenu } from 'material/elements';

defineIconButton();
defineMenu();

type MenuHost = HTMLElement & { show(): void; hide(): void };
let menu: MenuHost | null = null;
const check = document.querySelector<HTMLTemplateElement>('#theme-menu-template')?.dataset.check ?? '';

/** The menu, made once from the template inside the header's material scope. */
export function themeMenu(onSelect: (theme: string) => void, onOpen: (open: boolean) => void): MenuHost | null {
  if (menu) return menu;
  const template = document.querySelector<HTMLTemplateElement>('#theme-menu-template');
  const made = template?.content.firstElementChild?.cloneNode(true) as MenuHost | undefined;
  if (!template || !made) return null;
  template.after(made);
  // Material's menu opens itself from its anchor after the first time: the current
  // theme's check is refreshed on every open.
  made.addEventListener('open', () => { markTheme(document.documentElement.dataset.siteTheme ?? 'baseline'); onOpen(true); });
  made.addEventListener('close', () => onOpen(false));
  made.addEventListener('select', event => {
    const theme = (event as CustomEvent<{ value?: string }>).detail?.value;
    if (theme) onSelect(theme);
  });
  menu = made;
  return menu;
}

/** Marks the current theme's item with the check icon. */
export function markTheme(theme: string): void {
  for (const item of menu?.querySelectorAll('m-menu-item') ?? []) {
    if (item.getAttribute('value') === theme && check) item.setAttribute('icon', check);
    else item.removeAttribute('icon');
  }
}
