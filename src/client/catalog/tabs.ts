// The tabs card: <md3-catalog-tabs>, the tabs factory in a surface (surface.ts).
// <m-tabs> takes the factory's default scrollable row, whose tabs start after a 52px
// edge padding; the card shows M3's fixed row instead (`scrollable: false`), the tabs
// dividing the row evenly, so the group, its indicator and the divider are centred.
import 'mtrl/elements/css/tabs';
import createTabs from 'mtrl/components/tabs';
import { symbols } from '../../shared/icons';
import { surface } from './surface';

const destinations = [['inbox', 'Inbox', symbols.inbox], ['favorites', 'Favorites', symbols.heart], ['sent', 'Sent', symbols.send]] as const;

export const define = (): void => surface('md3-catalog-tabs', ['badge', 'progress', 'button', 'tabs'], () => createTabs({
  scrollable: false,
  tabs: destinations.map(([value, text, icon]) => ({ value, text, icon, state: value === 'inbox' ? 'active' : undefined })),
}));
