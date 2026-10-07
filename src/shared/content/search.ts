// The search's playground content: its named content sets and its registry entry.
import type { SearchConfig, SearchSuggestion } from 'material/components/search';
import { symbols } from '../icons';
import { type ComponentState, type Scenario, bool, choose, disabled, pick, section, string, text, toggle } from './types';

/**
 * A coloured disc with the figure's letter, or none. Not a photograph and not
 * the person's initials: the contacts figure draws Z, F, and a blank disc.
 */
const disc = (letter: string, fill: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="20" fill="${fill}"/>${letter ? `<text x="20" y="26" text-anchor="middle" fill="#ffffff" font-size="18" font-family="sans-serif">${letter}</text>` : ''}</svg>`;

const purple = '#6750A4';
const grey = '#79747E';

/**
 * A named search: the bar or the open view the guidelines figure shows.
 * `default` is not here: today's places search stays exactly as it was.
 */
interface SearchSet {
  name: string;
  placeholder: string;
  value: string;
  suggestions: SearchSuggestion[];
  trailing?: NonNullable<SearchConfig['trailingItems']>;
}

/**
 * Named searches from m3.material.io/components/search/guidelines (read 7
 * October 2026). A group name only inserts a divider
 * (`material/src/components/search/features/suggestions.ts`, the divider
 * between groups), so "Suggested" and "Quick results" are not written. A
 * suggestion has no trailing slot (`SearchSuggestion` in
 * `material/src/components/search/types.ts`), so the contacts' video and
 * phone icons are not written.
 */
const searchSets: Record<string, SearchSet> = {
  messages: {
    name: 'Messages',
    placeholder: 'Search your messages',
    value: '',
    suggestions: [],
    trailing: [{ id: 'mic', type: 'icon', content: symbols.mic, ariaLabel: 'Voice search' }],
  },
  contacts: {
    name: 'Contacts',
    placeholder: 'Search contacts',
    value: '',
    suggestions: [
      { text: 'In Yeong-hui', supportingText: 'Mobile', icon: disc('Z', purple) },
      { text: 'Renée Claes', supportingText: 'Work', icon: disc('F', grey) },
      { text: '(650) 605-3701', supportingText: 'Unknown', icon: disc('', purple) },
    ],
  },
  recipes: {
    name: 'Recipes',
    placeholder: 'Search',
    value: 'Peanut',
    suggestions: [
      { text: 'Peanut', icon: symbols.search },
      { text: 'Recipes for Peanut', icon: symbols.search },
      // The figure's third line and "Apr 21" are not a suggestion field. The
      // photograph is not in the catalog, and an omitted icon becomes the
      // history glyph, so this row carries a plain disc.
      { text: 'Recipes for Peanut', supportingText: 'Here are some healthy recipes for Peanut', icon: disc('', grey) },
    ],
  },
};

const searchSet = (state: ComponentState): SearchSet | undefined => searchSets[string(state, 'searchSet')];

const searchSetControl = {
  ...choose('searchSet', 'Search', ['default', 'messages', 'contacts', 'recipes'], 'default', 'select'),
  labels: { default: 'Default', messages: 'Messages', contacts: 'Contacts', recipes: 'Recipes' },
};

const gated = { enabledWhen: 'searchContentDefault' } as const;

const source = 'https://m3.material.io/components/search/guidelines';

export const searchComponent = {
  group: 'Selection & input', name: 'Search', factory: 'createSearch', variable: 'search',
  description: 'Start with a search bar, then explore suggestions in a docked or fullscreen view.',
  summary: 'Search with suggestions and an expanded view.', styles: ['search'],
  scenarios: [
    {
      id: 'messages', name: 'Messages', source,
      description: 'A search bar reading Search your messages, with a microphone.',
      options: { searchSet: 'messages' },
    },
    {
      id: 'contacts', name: 'Contacts', source,
      description: 'Search contacts, open, with three people and their letter avatars.',
      options: { searchSet: 'contacts', initialState: 'view', viewMode: 'fullscreen' },
    },
    {
      id: 'recipes', name: 'Recipes', source,
      description: 'Peanut typed in an open search, with two suggestions and a recipe result.',
      options: { searchSet: 'recipes', initialState: 'view', viewMode: 'fullscreen' },
    },
  ] as readonly Scenario[],
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
