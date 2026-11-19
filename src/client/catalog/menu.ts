// The menu card: a button that opens the real menu (choosing or Escape closes it).
import 'material/elements/css/button';
import 'material/elements/css/menu';
import createButton from 'material/components/button';
import createMenu from 'material/components/menu';
import { menuDefaults } from './defaults';
import { surface } from './surface';

export const define = (): void => surface('md3-catalog-menu', ['progress', 'button', 'menu'], () => {
  const host = document.createElement('div');
  const trigger = createButton({ text: 'Show menu', variant: 'tonal' });
  const menu = createMenu({ ...menuDefaults, opener: trigger.element, layer: "top" });
  host.append(trigger.element, menu.element);
  return { element: host, destroy: () => { menu.destroy(); trigger.destroy(); } };
});
