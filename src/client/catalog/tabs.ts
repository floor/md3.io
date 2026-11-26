// The tabs card: <md3-catalog-tabs>, the tabs factory in a surface (surface.ts).
// <m-tabs> takes the factory's default scrollable row, whose tabs start after a 52px
// edge padding; the card shows M3's fixed row instead (`scrollable: false`), the tabs
// dividing the row evenly, so the group, its indicator and the divider are centred.
import 'material/elements/css/tabs';
import createTabs from 'material/components/tabs';
import { symbols } from '../../shared/icons';
import { surface } from './surface';

const destinations = [['inbox', 'Inbox', symbols.inbox], ['favorites', 'Favorites', symbols.heart], ['sent', 'Sent', symbols.send]] as const;

const tabs = (config: Record<string, unknown>) => () => createTabs({
  scrollable: false,
  tabs: destinations.map(([value, text, icon]) => ({ value, text, ...(config.icons === false ? {} : { icon }), state: value === 'inbox' ? 'active' : undefined })),
  ...(config.variant ? { variant: config.variant as 'primary' | 'secondary' } : {}),
});
/** The Overview's property sections: `md3-catalog-tabs-<property>-<value>` (component-properties.ts). */
const TABS_PROPERTIES: Record<string, Record<string, unknown>> = {
  'variant-primary': { variant: 'primary' }, 'variant-secondary': { variant: 'secondary' },
  'icons-on': {}, 'icons-off': { icons: false },
};

export const define = (): void => {
  surface('md3-catalog-tabs', ['badge', 'progress', 'button', 'tabs'], tabs({}));
  for (const [suffix, config] of Object.entries(TABS_PROPERTIES)) surface(`md3-catalog-tabs-${suffix}`, ['badge', 'progress', 'button', 'tabs'], tabs(config));
};
