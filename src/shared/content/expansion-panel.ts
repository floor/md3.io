import type { ExpansionPanelConfig } from 'material-addons/components/expansion-panel';
import { choose, section, toggle, type ComponentDefinition } from './types';

export const expansionPanelComponent: ComponentDefinition<ExpansionPanelConfig> = {
  group: 'Add-ons', name: 'Expansion panel', factory: 'createExpansionPanel', variable: 'panel',
  description: 'Reveal details on demand. Group panels into an accordion when several sections belong together.',
  summary: 'Show or hide a section from its header.',
  styles: [],
  controls: [
    ...section('Content', [choose('example', 'Content', ['delivery', 'billing'], 'delivery', 'select')]),
    ...section('Behavior', [toggle('open', 'Expanded', false), toggle('divider', 'Show divider', true)]),
  ],
  scenarios: [
    { id: 'delivery-details', name: 'Delivery details', description: 'Reveal the shipping window without leaving checkout.', options: { example: 'delivery' }, source: 'https://github.com/floor/material-addons/tree/v3.2.0#expansion-panel' },
    { id: 'billing-details', name: 'Billing details', description: 'Show the current invoice details in account settings.', options: { example: 'billing', open: true }, source: 'https://github.com/floor/material-addons/tree/v3.2.0#expansion-panel' },
  ],
  config: state => ({
    label: state.example === 'billing' ? 'Current invoice' : 'Delivery details',
    content: state.example === 'billing' ? 'Your invoice includes the monthly plan and any additional seats.' : 'Your order arrives in two to four business days.',
    open: state.open === true,
    divider: state.divider === true,
  }),
};
