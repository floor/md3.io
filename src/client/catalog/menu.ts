// The menu card: <md3-catalog-menu>, the menu shown open in place (surface.ts).
import 'material/elements/css/button';
import 'material/elements/css/menu';
import createMenu from 'material/components/menu';
import { PREFIX } from 'material/core';
import { menuDefaults } from './defaults';
import { detached, surface } from './surface';

export const define = (): void => surface('md3-catalog-menu', ['progress', 'button', 'menu'], () => {
  const menu = createMenu({ ...menuDefaults, opener: document.createElement('button'), container: detached() });
  menu.element.classList.add(`${PREFIX}-menu--visible`);
  return { element: menu.element, destroy: () => menu.destroy() };
});
