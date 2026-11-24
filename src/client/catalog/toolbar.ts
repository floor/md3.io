// The toolbar card: <md3-catalog-toolbar>, the toolbar factory in a surface (surface.ts).
// <m-toolbar> gives each item host a tabindex for its arrow-key navigation, and a card
// is a link, which must not hold one; in the surface's shadow root they stay out of it.
// A vibrant floating toolbar of a message's actions, its overflow menu, and a paired FAB.
import 'material/elements/css/toolbar';
import 'material/elements/css/fab';
import 'material/elements/css/menu';
import createToolbar from 'material/components/toolbar';
import createFab from 'material/components/fab';
import createMenu from 'material/components/menu';
import { symbols } from '../../shared/icons';
import { surface } from './surface';

export const define = (): void => surface('md3-catalog-toolbar', ['button', 'icon-button', 'toolbar', 'fab', 'menu'], () => createToolbar({
  variant: 'floating',
  color: 'vibrant',
  ariaLabel: 'Message actions',
  items: [
    { icon: symbols.archive, ariaLabel: 'Archive' },
    { icon: symbols.delete, ariaLabel: 'Delete' },
    { icon: symbols.markEmailUnread, ariaLabel: 'Mark as unread' },
    { icon: symbols.snooze, ariaLabel: 'Snooze' },
  ],
  // The overflow menu opens in the top layer, and stays in this shadow root with its styles.
  overflow: opener => {
    const menu = createMenu({ opener, layer: 'top', items: [{ id: 'move', text: 'Move to' }, { id: 'label', text: 'Add label' }, { id: 'mute', text: 'Mute' }] });
    opener.after(menu.element);
    return menu;
  },
  fab: createFab({ icon: symbols.reply, ariaLabel: 'Reply', variant: 'tertiary-container' }),
}));
