// The list's playground content: its items builder and its registry entry, moved from
// src/shared/components.ts.
import type { ListConfig, ListItem, ListSlot } from 'material/components/list';
import { type ComponentState, bool, choose, iconByName, landscape, pick, section, string, text, toggle } from './types';

function listConfig(state: ComponentState): ListConfig<ListItem> {
  // Only a segmented list writes the variant: standard is the factory's own default.
  const variant = pick(state, 'variant', ['standard', 'segmented'], 'standard');
  const labels = (state.content === 'places'
    ? ['Mountain trail', 'Botanical garden', 'City museum', 'Riverside park', 'Local market']
    : ['Morning walk', 'Read a chapter', 'Try a new recipe', 'Call a friend', 'Plan a weekend']).slice(0, Number(state.count));
  const items: ListItem[] = [];
  if (state.subheader) items.push({ kind: 'subheader', headline: state.content === 'places' ? 'Places to explore' : 'Ideas for today' });
  labels.forEach((headline, index) => {
    if (index && state.dividers !== 'none') items.push({ kind: 'divider', ...(state.dividers === 'inset' ? { inset: true } : {}) });
    let leading: ListSlot | undefined;
    if (state.leading === 'icon') leading = { type: 'icon', content: iconByName(['heart', 'bookmark', 'download'][index % 3]!) };
    if (state.leading === 'avatar') leading = { type: 'avatar', content: headline.split(' ').map(word => word[0]).slice(0, 2).join('').toUpperCase() };
    if (state.leading === 'image' || state.leading === 'video') leading = { type: state.leading, content: `<img src="${landscape(index)}" alt="">` };
    let trailing: ListSlot | undefined;
    if (state.trailing === 'text') trailing = { type: 'text', content: `${(index + 1) * 5} min` };
    if (state.trailing === 'icon') trailing = { type: 'icon', content: iconByName('bookmark') };
    if (state.trailing === 'control') trailing = { type: 'control', content: `<button type="button" data-list-action="${headline}" aria-label="Save ${headline}" style="color:inherit;font:inherit;min-width:48px;min-height:48px;background:transparent;border:0;cursor:pointer">Save</button>` };
    items.push({ id: String(index + 1), headline, lines: Number(state.lines) as 1 | 2 | 3,
      ...(state.lines !== '1' ? { supportingText: string(state, 'supportingText') } : {}),
      ...(state.lines === '3' && state.overline ? { overline: state.content === 'places' ? 'Explore nearby' : 'Daily inspiration' } : {}),
      ...(leading ? { leading } : {}), ...(trailing ? { trailing } : {}),
      ...(state.disableLast && index === labels.length - 1 ? { disabled: true } : {}),
    });
  });
  return { ...(variant === 'standard' ? {} : { variant }), items, ariaLabel: string(state, 'ariaLabel').trim() || 'Ideas for today', trackSelection: state.selection !== 'none', multiSelect: state.selection === 'multi',
    initialSelection: ['first', 'second', 'third', 'fourth', 'fifth'].flatMap((key, index) => state[key] && index < labels.length && state.selection !== 'none' ? [String(index + 1)] : []) };
}

export const listComponent = {
  group: 'Containment', name: 'List', factory: 'createList', variable: 'list',
  description: 'Explore Material list anatomy. Configure text lines, media, supporting actions, and selection.',
  summary: 'One, two, or three lines with flexible content slots.', styles: ['list'],
  scenarios: [],
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['standard', 'segmented'], 'standard')]),
    ...section('Layout', [choose('lines', 'Text lines', ['1', '2', '3'], '2'), choose('leading', 'Leading', ['none', 'icon', 'avatar', 'image', 'video'], 'icon', 'select'), choose('trailing', 'Trailing', ['none', 'text', 'icon', 'control'], 'text', 'select'), choose('dividers', 'Dividers', ['none', 'full-width', 'inset'], 'none', 'select'), toggle('subheader', 'Subheader')]),
    ...section('Content', [choose('content', 'Items', ['activities', 'places'], 'activities'), choose('count', 'Item count', ['3', '5'], '3'), { ...text('supportingText', 'Supporting text', 'Make a little time for yourself'), enabledWhen: 'hasSupporting' }, toggle('overline', 'Overline', false, 'threeLines'), text('ariaLabel', 'Accessible label', 'Ideas for today')]),
    ...section('Behavior', [choose('selection', 'Selection', ['none', 'single', 'multi'], 'single'), toggle('disableLast', 'Disable last item'), toggle('first', 'First selected', true, 'selectable'), toggle('second', 'Second selected', false, 'selectable'), toggle('third', 'Third selected', false, 'selectable'), toggle('fourth', 'Fourth selected', false, 'extraSelectable'), toggle('fifth', 'Fifth selected', false, 'extraSelectable')]),
  ],
  config: (state: ComponentState): ListConfig<ListItem> => listConfig(state),
};
