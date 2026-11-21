import type { AutocompleteConfig } from 'material-addons/components/autocomplete';
import { choose, section, string, toggle, type ComponentDefinition } from './types';

const destinations = ['Athens', 'Brussels', 'Copenhagen', 'Lisbon', 'Madrid', 'Rome'];
const teams = ['Design', 'Engineering', 'Finance', 'Operations', 'Support'];

export const autocompleteComponent: ComponentDefinition<AutocompleteConfig> = {
  group: 'Add-ons', name: 'Autocomplete', factory: 'createAutocomplete', variable: 'autocomplete',
  description: 'Suggest matching options as someone types in a text field.',
  summary: 'Find an option by typing part of its name.',
  styles: ['text-field', 'menu'],
  controls: [
    ...section('Content', [choose('dataset', 'Suggestions', ['destinations', 'teams'], 'destinations', 'select')]),
    ...section('Behavior', [toggle('strict', 'Require a suggestion', true), toggle('openOnFocus', 'Show suggestions on focus', true)]),
  ],
  scenarios: [
    { id: 'destination', name: 'Destination search', description: 'Type a city to choose a travel destination.', options: { dataset: 'destinations', strict: true }, source: 'https://github.com/floor/material-addons/tree/v3.2.0#autocomplete' },
    { id: 'assign-team', name: 'Assign a team', description: 'Choose an existing team or enter a new one.', options: { dataset: 'teams', strict: false }, source: 'https://github.com/floor/material-addons/tree/v3.2.0#autocomplete' },
  ],
  config: state => {
    const travel = string(state, 'dataset') !== 'teams';
    return {
      label: travel ? 'Destination' : 'Team',
      options: (travel ? destinations : teams).map(text => ({ value: text.toLowerCase(), text })),
      strict: state.strict === true,
      openOnFocus: state.openOnFocus === true,
      clearable: true,
    };
  },
};
