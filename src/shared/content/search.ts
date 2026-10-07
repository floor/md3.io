// The search's playground content: its named content set and its registry entry.
import type { SearchConfig, SearchSuggestion } from 'material/components/search';
import { symbols } from '../icons';
import { type ComponentState, type Scenario, bool, choose, disabled, pick, section, string, text, toggle } from './types';

/**
 * A named search. `default` is not here: today's places search stays exactly
 * as it was. Contacts and recipes are not here either: a search created already
 * open focuses its back button, and that focus ring paints on the first letter
 * (`material` `dist/components/search/features/states.js:243-247`). They wait
 * for the library. The local branch `held/search-open-view` keeps them as built.
 */
interface SearchSet {
  name: string;
  placeholder: string;
  value: string;
  suggestions: SearchSuggestion[];
  trailing?: NonNullable<SearchConfig['trailingItems']>;
}

const searchSets: Record<string, SearchSet> = {
  messages: {
    name: 'Messages',
    placeholder: 'Search your messages',
    value: '',
    suggestions: [],
    trailing: [{ id: 'mic', type: 'icon', content: symbols.mic, ariaLabel: 'Voice search' }],
  },
};

const searchSet = (state: ComponentState): SearchSet | undefined => searchSets[string(state, 'searchSet')];

const searchSetControl = {
  ...choose('searchSet', 'Search', ['default', 'messages'], 'default', 'select'),
  labels: { default: 'Default', messages: 'Messages' },
};

const gated = { enabledWhen: 'searchContentDefault' } as const;

const source = 'https://m3.material.io/components/search/guidelines';

const searchScenarios: readonly Scenario[] = [
  {
    id: 'messages', name: 'Messages', source,
    description: 'A search bar reading Search your messages, with a microphone.',
    options: { searchSet: 'messages' },
  },
];

export const searchComponent = {
  group: 'Selection & input', name: 'Search', factory: 'createSearch', variable: 'search',
  description: 'Start with a search bar, then explore suggestions in a docked or fullscreen view.',
  summary: 'Search with suggestions and an expanded view.', styles: ['search'],
  scenarios: searchScenarios,
  controls: [
    ...section('Appearance', [choose('variant', 'Style', ['contained', 'divided'], 'contained'), choose('initialState', 'State', ['bar', 'view'], 'bar'), choose('viewMode', 'View mode', ['docked', 'fullscreen'], 'docked')]),
    ...section('Content', [searchSetControl, { ...text('placeholder', 'Placeholder', 'Search places'), ...gated }, { ...text('value', 'Query', ''), ...gated }, { ...choose('suggestions', 'Suggestions', ['places', 'none'], 'places'), ...gated }]),
    ...section('Behavior', [toggle('showClearButton', 'Clear button', true), toggle('expandOnFocus', 'Expand on focus', true), toggle('collapseOnBlur', 'Collapse on blur', true), disabled]),
  ],
  config: (state: ComponentState): SearchConfig => {
    const named = searchSet(state);
    const shared = {
      variant: pick(state, 'variant', ['contained', 'divided'], 'contained'),
      initialState: pick(state, 'initialState', ['bar', 'view'], 'bar'),
      viewMode: pick(state, 'viewMode', ['docked', 'fullscreen'], 'docked'),
      showClearButton: bool(state, 'showClearButton'), expandOnFocus: bool(state, 'expandOnFocus'),
      collapseOnBlur: bool(state, 'collapseOnBlur'), disabled: bool(state, 'disabled'), minWidth: 240, maxWidth: 480, name: 'query',
    };
    // A named search carries the figure's own placeholder, query and rows.
    // The default stays today's places list, its query and suggestions controls driving it.
    if (named) {
      return { ...shared, placeholder: named.placeholder, value: named.value, suggestions: named.suggestions, ...(named.trailing ? { trailingItems: named.trailing } : {}) };
    }
    return { variant: pick(state, 'variant', ['contained', 'divided'], 'contained'), initialState: pick(state, 'initialState', ['bar', 'view'], 'bar'), viewMode: pick(state, 'viewMode', ['docked', 'fullscreen'], 'docked'),
      placeholder: string(state, 'placeholder'), value: string(state, 'value'), suggestions: state.suggestions === 'none' ? [] : ['Paris', 'London', 'Lisbon', 'Tokyo'],
      showClearButton: bool(state, 'showClearButton'), expandOnFocus: bool(state, 'expandOnFocus'), collapseOnBlur: bool(state, 'collapseOnBlur'), disabled: bool(state, 'disabled'), minWidth: 240, maxWidth: 480, name: 'query' };
  },
};
