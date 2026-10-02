// The toolbar card: <md3-catalog-toolbar>, the toolbar factory in a surface (surface.ts).
// <m-toolbar> gives each item host a tabindex for its arrow-key navigation, and a card
// is a link, which must not hold one; in the surface's shadow root they stay out of it.
import 'material/elements/css/toolbar';
import createToolbar from 'material/components/toolbar';
import { symbols } from '../../shared/icons';
import { surface } from './surface';

export const define = (): void => surface('md3-catalog-toolbar', ['button', 'icon-button', 'toolbar'], () => createToolbar({
  variant: 'floating',
  ariaLabel: 'Formatting',
  items: [
    { icon: symbols.bold, ariaLabel: 'Bold', toggle: true, selected: true },
    { icon: symbols.italic, ariaLabel: 'Italic', toggle: true },
    { icon: symbols.underline, ariaLabel: 'Underline', toggle: true },
  ],
}));
