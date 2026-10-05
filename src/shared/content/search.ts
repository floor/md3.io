// The search's playground content: its registry entry, moved from
// src/shared/components.ts.
import type { SearchConfig } from 'material/components/search';
import { type ComponentState, bool, choose, disabled, pick, section, string, text, toggle } from './types';

export const searchComponent = {
  group: 'Selection & input', name: 'Search', factory: 'createSearch', variable: 'search',
  description: 'Start with a search bar, then explore suggestions in a docked or fullscreen view.',
  summary: 'Search with suggestions and an expanded view.', styles: ['search'],
  scenarios: [],
  controls: [
    ...section('Appearance', [choose('variant', 'Style', ['contained', 'divided'], 'contained'), choose('initialState', 'State', ['bar', 'view'], 'bar'), choose('viewMode', 'View mode', ['docked', 'fullscreen'], 'docked')]),
    ...section('Content', [text('placeholder', 'Placeholder', 'Search places'), text('value', 'Query', ''), choose('suggestions', 'Suggestions', ['places', 'none'], 'places')]),
    ...section('Behavior', [toggle('showClearButton', 'Clear button', true), toggle('expandOnFocus', 'Expand on focus', true), toggle('collapseOnBlur', 'Collapse on blur', true), disabled]),
  ],
  config: (state: ComponentState): SearchConfig => ({ variant: pick(state, 'variant', ['contained', 'divided'], 'contained'), initialState: pick(state, 'initialState', ['bar', 'view'], 'bar'), viewMode: pick(state, 'viewMode', ['docked', 'fullscreen'], 'docked'),
    placeholder: string(state, 'placeholder'), value: string(state, 'value'), suggestions: state.suggestions === 'none' ? [] : ['Paris', 'London', 'Lisbon', 'Tokyo'],
    showClearButton: bool(state, 'showClearButton'), expandOnFocus: bool(state, 'expandOnFocus'), collapseOnBlur: bool(state, 'collapseOnBlur'), disabled: bool(state, 'disabled'), minWidth: 240, maxWidth: 480, name: 'query' }),
};
