import type { BadgeConfig } from 'material/components/badge';
import type { ProgressConfig } from 'material/components/progress';
import type { LoadingIndicatorConfig } from 'material/components/loading-indicator';
import type { SnackbarConfig } from 'material/components/snackbar';
import type { TooltipConfig } from 'material/components/tooltip';
import type { CardConfig } from 'material/components/card';
import type { ListConfig, ListItem, ListSlot } from 'material/components/list';
import type { CarouselConfig } from 'material/components/carousel';
import { carouselPhotos, carouselPhotoUrl } from './carousel-photos';
import type { DividerConfig } from 'material/components/divider';
import type { DialogConfig } from 'material/components/dialog';
import type { BottomSheetConfig } from 'material/components/bottom-sheet';
import type { SideSheetConfig } from 'material/components/side-sheet';
import type { NavigationRailConfig } from 'material/components/navigation-rail';
import type { DrawerConfig } from 'material/components/drawer';
import type { TabsConfig } from 'material/components/tabs';
import type { MenuConfig } from 'material/components/menu';
import type { TopAppBarConfig } from 'material/components/top-app-bar';
import type { BottomAppBarConfig } from 'material/components/bottom-app-bar';
import type { ToolbarConfig, ToolbarButtonItem, ToolbarItem } from 'material/components/toolbar';
import type { FabMenuConfig } from 'material/components/fab-menu';
import type { SwitchConfig } from 'material/components/switch';
import type { RadiosConfig } from 'material/components/radios';
import type { ChipsConfig } from 'material/components/chips';
import type { SliderConfig } from 'material/components/slider';
import type { TextFieldConfig } from 'material/components/text-field';
import type { SelectConfig } from 'material/components/select';
import type { SearchConfig } from 'material/components/search';
import type { DatePickerConfig } from 'material/components/datepicker';
import type { TimePickerConfig } from 'material/components/timepicker';
import { TIME_PICKER_TYPE, TIME_FORMAT, TIME_PICKER_ORIENTATION } from 'material/components/timepicker';
import type { CheckboxConfig } from 'material/components/checkbox';
import type { IconButtonConfig } from 'material/components/icon-button';
import type { ButtonGroupConfig } from 'material/components/button-group';
import type { SplitButtonConfig } from 'material/components/split-button';
import type { FabConfig } from 'material/components/fab';
import type { ExtendedFabConfig } from 'material/components/extended-fab';
import { symbols } from './icons';
import { nameIcons } from './icon-code';
import { icons as buttonIcons, themes } from './button';

export const componentIcons: Record<string, string> = {
  ...buttonIcons,
  menu: symbols.menu,
  inbox: symbols.inbox,
  add: symbols.add,
  edit: symbols.edit,
  bold: symbols.bold,
  italic: symbols.italic,
  underline: symbols.underline,
  // The text field's leading and trailing icons: mail and search describe the input,
  // the close and error icons are the clear and error signifiers (m3.material.io text
  // fields), and the eye pair swaps on a password's show or hide button.
  mail: symbols.mail,
  search: symbols.search,
  close: symbols.close,
  error: symbols.error,
  visibility: symbols.visibility,
  visibilityOff: symbols.visibilityOff,
};
// The types and control helpers live in content/types.ts so the content modules can
// import them without importing this registry; re-exported here for their consumers.
import { type ComponentState, type Control, type Scenario, section, choose, toggle, text, range, date, size, square, disabled, icon, pick, string, bool, shape, tones, positions, position, toneControl, iconMarkup, fabPosition, paragraph, landscape } from './content/types';
export type { ComponentState, Control, Scenario } from './content/types';
// The Actions, Selection & input and Navigation components' content modules, one per
// component.
import { buttonComponent } from './content/button';
import { buttonGroupComponent } from './content/button-group';
import { extendedFabComponent } from './content/extended-fab';
import { fabComponent } from './content/fab';
import { fabMenuComponent } from './content/fab-menu';
import { iconButtonComponent } from './content/icon-button';
import { splitButtonComponent } from './content/split-button';
import { checkboxChildChecked, checkboxChildren, checkboxComponent } from './content/checkbox';
import { chipsComponent } from './content/chips';
import { datepickerComponent } from './content/datepicker';
import { radiosComponent } from './content/radios';
import { searchComponent } from './content/search';
import { selectComponent } from './content/select';
import { sliderComponent } from './content/slider';
import { switchComponent } from './content/switch';
import { textFieldComponent, trailingBehaviour, type TrailingBehaviour } from './content/text-field';
import { timePickerComponent } from './content/timepicker';
import { bottomAppBarComponent } from './content/bottom-app-bar';
import { drawerComponent } from './content/drawer';
import { menuComponent } from './content/menu';
import { navigationRailComponent } from './content/navigation-rail';
import { tabsComponent } from './content/tabs';
import { toolbarComponent, toolbarContent } from './content/toolbar';
import { appBarActions, appBarContent, topAppBarComponent } from './content/top-app-bar';
// Until the preview and its checkbox check import from the content modules, they keep
// importing these from the registry.
export { checkboxChildChecked, checkboxChildren } from './content/checkbox';
export { trailingBehaviour } from './content/text-field';
export type { TrailingBehaviour } from './content/text-field';
export { appBarContent } from './content/top-app-bar';
export { toolbarContent } from './content/toolbar';

/** The toolbar's config as its element takes it: icon buttons in `items`, text buttons in `buttons`, and the FAB slotted beside them. */
export function toolbarElementConfig(state: ComponentState): Record<string, unknown> {
  const { items: allItems, ...config } = components.toolbar.config(state) as ToolbarConfig;
  const items = (allItems ?? []).filter(item => typeof (item as ToolbarButtonItem).text !== 'string');
  const buttons = (allItems ?? []).filter((item): item is ToolbarButtonItem => typeof (item as ToolbarButtonItem).text === 'string');
  const content = toolbarContent(state);
  return { ...config, ...(items.length ? { items } : {}), ...(buttons.length ? { buttons } : {}), ...(content.fab ? { fab: content.fab } : {}) };
}
/** Twenty-four photos per layout, enough for each to scroll as it does with a real collection. */
const carouselSlides = (state: ComponentState) => {
  const variant = pick(state, 'variant', ['multi-browse', 'uncontained', 'hero', 'hero-center', 'full-screen'], 'multi-browse');
  return carouselPhotos(variant).map(photo => ({ image: carouselPhotoUrl(variant, photo.id), alt: `${photo.title}, ${photo.location}`, ...(state.captions ? { title: photo.title, description: photo.location } : {}) }));
};
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
    if (state.leading === 'icon') leading = { type: 'icon', content: componentIcons[['heart', 'bookmark', 'download'][index % 3]!]! };
    if (state.leading === 'avatar') leading = { type: 'avatar', content: headline.split(' ').map(word => word[0]).slice(0, 2).join('').toUpperCase() };
    if (state.leading === 'image' || state.leading === 'video') leading = { type: state.leading, content: `<img src="${landscape(index)}" alt="">` };
    let trailing: ListSlot | undefined;
    if (state.trailing === 'text') trailing = { type: 'text', content: `${(index + 1) * 5} min` };
    if (state.trailing === 'icon') trailing = { type: 'icon', content: componentIcons.bookmark! };
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
export const components = {
  button: buttonComponent,
  'icon-button': iconButtonComponent,
  'button-group': buttonGroupComponent,
  'split-button': splitButtonComponent,
  fab: fabComponent,
  'fab-menu': fabMenuComponent,
  'extended-fab': extendedFabComponent,
  checkbox: checkboxComponent,
  switch: switchComponent,
  radios: radiosComponent,
  chips: chipsComponent,
  slider: sliderComponent,
  'text-field': textFieldComponent,
  select: selectComponent,
  search: searchComponent,
  datepicker: datepickerComponent,
  timepicker: timePickerComponent,
  'navigation-rail': navigationRailComponent,
  drawer: drawerComponent,
  tabs: tabsComponent,
  menu: menuComponent,
  'top-app-bar': topAppBarComponent,
  'bottom-app-bar': bottomAppBarComponent,
  toolbar: toolbarComponent,
  card: {
    group: 'Containment', name: 'Card', factory: 'createCard', variable: 'card',
    description: 'Bring content and actions together. Explore surfaces, media, and interactive cards.',
    summary: 'Content and actions on one surface.', styles: ['progress', 'button', 'card'],
    scenarios: [],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['elevated', 'filled', 'outlined'], 'elevated'), toggle('media', 'Show image', true), choose('aspectRatio', 'Image ratio', ['16:9', '4:3', '1:1'], '16:9'), choose('mediaPosition', 'Image position', ['top', 'bottom'], 'top')]),
      ...section('Content', [text('title', 'Title', 'A little time outside'), text('subtitle', 'Subtitle', 'Find your next escape'), text('content', 'Body', 'Take the scenic route. There is always something new to discover.'), toggle('actions', 'Show actions', true)]),
      ...section('Behavior', [toggle('clickable', 'Clickable'), toggle('draggable', 'Draggable')]),
    ],
    config: (state: ComponentState): CardConfig => ({ variant: string(state, 'variant'), clickable: bool(state, 'clickable'), interactive: bool(state, 'clickable'), draggable: bool(state, 'draggable'), header: { title: string(state, 'title'), subtitle: string(state, 'subtitle') }, content: { text: string(state, 'content') }, ...(state.media ? { media: { src: landscape(0), alt: 'Illustrated mountain landscape', aspectRatio: string(state, 'aspectRatio'), position: pick(state, 'mediaPosition', ['top', 'bottom'], 'top') } } : {}), ...(state.actions ? { buttons: [{ text: 'Explore', variant: 'text' }, { text: 'Save', variant: 'tonal' }] } : {}) }),
  },
  list: {
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
  },
  carousel: {
    group: 'Containment', name: 'Carousel', factory: 'createCarousel', variable: 'carousel',
    description: 'Browse a collection with Material carousel layouts. Swipe, scroll, or use the arrow keys.',
    summary: 'Five ways to browse a visual collection.', styles: ['carousel'],
    // The preview's remote (icon buttons and a slider), which the copied code does not build.
    previewStyles: ['icon-button', 'slider'],
    scenarios: [],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['multi-browse', 'uncontained', 'hero', 'hero-center', 'full-screen'], 'multi-browse', 'select'), { ...range('cornerRadius', 'Corner radius', '28'), max: 48 }]),
      ...section('Layout', [{ ...range('itemWidth', 'Item width', '280'), min: 120, max: 480, step: 20 }, { ...range('gap', 'Gap', '8'), max: 32 }, { ...range('padding', 'Padding', '16'), max: 48 }]),
      ...section('Content', [toggle('captions', 'Captions', true), choose('initialSlide', 'Current slide', Array.from({ length: 24 }, (_, index) => String(index)), '0', 'select')]),
      ...section('Behavior', [toggle('snap', 'Snap to items', true)]),
    ],
    config: (state: ComponentState): CarouselConfig => ({ variant: pick(state, 'variant', ['multi-browse', 'uncontained', 'hero', 'hero-center', 'full-screen'], 'multi-browse'), itemWidth: Number(state.itemWidth), gap: Number(state.gap), padding: Number(state.padding), cornerRadius: Number(state.cornerRadius), snap: bool(state, 'snap'), initialSlide: Number(state.initialSlide), ariaLabel: 'Places to explore', slides: carouselSlides(state) }),
  },
  divider: {
    group: 'Containment', name: 'Divider', factory: 'createDivider', variable: 'divider',
    description: 'Separate related content. Explore orientation, insets, line weight, and color.',
    summary: 'A quiet boundary between sections.', styles: ['divider'],
    scenarios: [],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['full-width', 'inset', 'middle-inset'], 'full-width', 'select'), choose('orientation', 'Orientation', ['horizontal', 'vertical'], 'horizontal'), { ...range('thickness', 'Thickness', '1'), min: 1, max: 8 }, choose('color', 'Color', ['outline-variant', 'outline', 'primary', 'secondary'], 'outline-variant', 'select')]),
      ...section('Layout', [{ ...range('insetStart', 'Start inset', '16'), max: 64 }, { ...range('insetEnd', 'End inset', '16'), max: 64 }]),
    ],
    config: (state: ComponentState): DividerConfig => ({ variant: pick(state, 'variant', ['full-width', 'inset', 'middle-inset'], 'full-width'), orientation: pick(state, 'orientation', ['horizontal', 'vertical'], 'horizontal'), thickness: Number(state.thickness), insetStart: Number(state.insetStart), insetEnd: Number(state.insetEnd), color: `var(--mtrl-sys-color-${string(state, 'color')})` }),
  },
  dialog: {
    group: 'Containment', name: 'Dialog', factory: 'createDialog', variable: 'dialog',
    description: 'Focus on a decision. Open a dialog to try its content, actions, and dismissal behavior.',
    summary: 'A focused surface for a task or decision.', styles: ['progress', 'button', 'divider', 'dialog'],
    scenarios: [],
    controls: [
      ...section('Appearance', [choose('size', 'Size', ['small', 'medium', 'large', 'fullwidth', 'fullscreen'], 'small', 'select'), choose('animation', 'Animation', ['scale', 'slide-up', 'slide-down', 'fade'], 'scale', 'select'), toggle('divider', 'Dividers')]),
      ...section('Content', [text('title', 'Title', 'Save your changes?'), text('subtitle', 'Subtitle', ''), text('content', 'Body', 'Keep your changes before leaving this view.'), toggle('actions', 'Show actions', true), choose('footerAlignment', 'Action alignment', ['right', 'left', 'center', 'space-between'], 'right', 'select')]),
      ...section('Behavior', [toggle('open', 'Open'), toggle('closeButton', 'Close button', true), toggle('closeOnOverlayClick', 'Dismiss on scrim', true), toggle('closeOnEscape', 'Dismiss with Escape', true)]),
    ],
    config: (state: ComponentState): DialogConfig => ({ title: string(state, 'title'), subtitle: string(state, 'subtitle'), content: paragraph(string(state, 'content')), ariaLabel: string(state, 'title').trim() || 'Example dialog', size: string(state, 'size'), animation: string(state, 'animation'), divider: bool(state, 'divider'), open: bool(state, 'open'), closeButton: bool(state, 'closeButton'), closeOnOverlayClick: bool(state, 'closeOnOverlayClick'), closeOnEscape: bool(state, 'closeOnEscape'), footerAlignment: string(state, 'footerAlignment'), buttons: state.actions ? [{ text: 'Cancel', variant: 'text', closeDialog: true }, { text: 'Save', variant: 'filled', closeDialog: true }] : [] }),
  },
  'bottom-sheet': {
    group: 'Containment', name: 'Bottom sheet', factory: 'createBottomSheet', variable: 'sheet',
    description: 'Reveal more from the bottom edge. Try partial and expanded states, or drag the handle.',
    summary: 'Supporting content from the bottom edge.', styles: ['progress', 'button', 'bottom-sheet'],
    scenarios: [],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['standard', 'modal'], 'modal'), toggle('dragHandle', 'Drag handle', true)]),
      ...section('Layout', [{ ...range('peekHeight', 'Peek height', '120'), min: 56, max: 240, step: 8 }, { ...range('maxWidth', 'Maximum width', '640'), min: 280, max: 640, step: 20 }]),
      ...section('Content', [text('title', 'Title', 'Plan your visit'), text('content', 'Body', 'Find a new trail, take in the view, and make time for a quiet moment.')]),
      ...section('Behavior', [choose('initialState', 'State', ['hidden', 'partial', 'expanded'], 'hidden', 'select'), toggle('closeOnScrimClick', 'Dismiss on scrim', true), toggle('closeOnEscape', 'Dismiss with Escape', true)]),
    ],
    config: (state: ComponentState): BottomSheetConfig => ({ variant: pick(state, 'variant', ['standard', 'modal'], 'modal'), initialState: pick(state, 'initialState', ['hidden', 'partial', 'expanded'], 'hidden'), dragHandle: bool(state, 'dragHandle'), peekHeight: Number(state.peekHeight), maxWidth: Number(state.maxWidth), title: string(state, 'title'), content: paragraph(string(state, 'content')), closeOnScrimClick: bool(state, 'closeOnScrimClick'), closeOnEscape: bool(state, 'closeOnEscape') }),
  },
  'side-sheet': {
    group: 'Containment', name: 'Side sheet', factory: 'createSideSheet', variable: 'sheet',
    description: 'Keep supporting details close by. Explore standard and modal sheets on either edge.',
    summary: 'Supporting details beside the main content.', styles: ['progress', 'button', 'side-sheet'],
    scenarios: [],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['standard', 'modal'], 'modal')]),
      ...section('Layout', [choose('position', 'Position', ['start', 'end'], 'end'), { ...range('width', 'Width', '320'), min: 240, max: 400, step: 20 }]),
      ...section('Content', [text('title', 'Title', 'Details'), text('content', 'Body', 'A place for useful context, related information, and supporting actions.')]),
      ...section('Behavior', [toggle('open', 'Open'), toggle('closeButton', 'Close button', true), toggle('closeOnScrimClick', 'Dismiss on scrim', true), toggle('closeOnEscape', 'Dismiss with Escape', true)]),
    ],
    config: (state: ComponentState): SideSheetConfig => ({ variant: pick(state, 'variant', ['standard', 'modal'], 'modal'), position: pick(state, 'position', ['start', 'end'], 'end'), width: Number(state.width), title: string(state, 'title'), content: paragraph(string(state, 'content')), open: bool(state, 'open'), closeButton: bool(state, 'closeButton'), closeOnScrimClick: bool(state, 'closeOnScrimClick'), closeOnEscape: bool(state, 'closeOnEscape') }),
  },
  badge: {
    group: 'Communication', name: 'Badge', factory: 'createBadge', variable: 'badge',
    description: 'Draw attention to something new. Try dots, counts, and labels attached to an action.',
    summary: 'A small signal for updates and counts.', styles: ['icon-button', 'badge'],
    scenarios: [],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['small', 'large'], 'large'), choose('color', 'Color', ['error', 'primary', 'secondary', 'tertiary', 'success', 'warning', 'info'], 'error', 'select'), choose('position', 'Position', ['top-right', 'top-left', 'bottom-right', 'bottom-left'], 'top-right', 'select')]),
      ...section('Content', [{ ...text('label', 'Label', '8'), enabledWhen: 'hasLabel' }, { ...choose('max', 'Maximum count', ['9', '99', '999'], '99'), enabledWhen: 'hasLabel' }]),
      ...section('Behavior', [toggle('visible', 'Visible', true)]),
    ],
    config: (state: ComponentState): BadgeConfig => ({ variant: string(state, 'variant'), color: string(state, 'color'), position: string(state, 'position'), label: string(state, 'label'), max: Number(state.max), visible: bool(state, 'visible') }),
  },
  progress: {
    group: 'Communication', name: 'Progress', factory: 'createProgress', variable: 'progress',
    description: 'Show how a task is progressing. Compare linear and circular indicators, with flat or wavy shapes.',
    summary: 'Linear and circular progress, flat or wavy.', styles: ['progress'],
    scenarios: [],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['linear', 'circular'], 'linear'), choose('shape', 'Shape', ['flat', 'wavy'], 'flat'), choose('thickness', 'Thickness', ['thin', 'thick'], 'thin'), { ...range('size', 'Circular size', '48'), min: 24, max: 240, step: 8, enabledWhen: 'circular' }, toggle('showStopIndicator', 'Stop indicator', true, 'linear')]),
      ...section('Content', [{ ...range('value', 'Value', '45'), enabledWhen: 'determinate' }, { ...range('buffer', 'Buffer', '70'), enabledWhen: 'linearDeterminate' }, toggle('showLabel', 'Show percentage', false, 'determinate'), text('ariaLabel', 'Accessible label', 'Uploading files')]),
      ...section('Behavior', [toggle('indeterminate', 'Indeterminate'), disabled]),
    ],
    config: (state: ComponentState): ProgressConfig => ({ variant: pick(state, 'variant', ['linear', 'circular'], 'linear'), shape: pick(state, 'shape', ['flat', 'wavy'], 'flat'), thickness: pick(state, 'thickness', ['thin', 'thick'], 'thin'), ...(state.variant === 'circular' ? { size: Number(state.size) } : {}), value: Number(state.value), max: 100, buffer: state.variant === 'linear' ? Number(state.buffer) : 0, showStopIndicator: bool(state, 'showStopIndicator'), showLabel: !state.indeterminate && bool(state, 'showLabel'), indeterminate: bool(state, 'indeterminate'), disabled: bool(state, 'disabled'), ariaLabel: string(state, 'ariaLabel').trim() || 'Uploading files' }),
  },
  'loading-indicator': {
    group: 'Communication', name: 'Loading indicator', factory: 'createLoadingIndicator', variable: 'indicator',
    description: 'Give short waits a little expression. Explore the morphing shape with or without its container.',
    summary: 'An expressive shape for short waits.', styles: ['loading-indicator'],
    scenarios: [],
    controls: [
      ...section('Appearance', [toggle('contained', 'Contained'), { ...range('size', 'Size', '48'), min: 24, max: 240, step: 8 }]),
      ...section('Content', [{ ...range('value', 'Value', '50'), enabledWhen: 'determinate' }, text('ariaLabel', 'Accessible label', 'Loading your content')]),
      ...section('Behavior', [toggle('indeterminate', 'Indeterminate', true)]),
    ],
    config: (state: ComponentState): LoadingIndicatorConfig => ({ size: Number(state.size), contained: bool(state, 'contained'), value: state.indeterminate ? null : Number(state.value) / 100, ariaLabel: string(state, 'ariaLabel').trim() || 'Loading your content' }),
  },
  snackbar: {
    group: 'Communication', name: 'Snackbar', factory: 'createSnackbar', variable: 'snackbar',
    description: 'Confirm an action without interrupting. Show a message, offer an undo, and try dismissal behavior.',
    summary: 'Brief feedback with an optional action.', styles: ['progress', 'button', 'icon-button', 'snackbar'],
    scenarios: [],
    controls: [
      ...section('Layout', [choose('position', 'Position', ['start', 'center', 'end'], 'center')]),
      ...section('Content', [text('message', 'Message', 'Your changes have been saved.'), toggle('hasAction', 'Show action', true), { ...text('action', 'Action text', 'Undo'), enabledWhen: 'hasAction' }, { ...text('closeLabel', 'Dismiss label', 'Dismiss'), enabledWhen: 'dismissible' }]),
      ...section('Behavior', [choose('duration', 'Duration', ['short', 'long', 'indefinite'], 'indefinite', 'select'), toggle('dismissible', 'Close button', true), toggle('visible', 'Visible')]),
    ],
    config: (state: ComponentState): SnackbarConfig => ({ message: string(state, 'message').trim() || 'Your changes have been saved.', ...(state.hasAction ? { action: string(state, 'action') } : {}), closeLabel: string(state, 'closeLabel').trim() || 'Dismiss', position: pick(state, 'position', ['start', 'center', 'end'], 'center'), duration: pick(state, 'duration', ['short', 'long', 'indefinite'], 'indefinite'), dismissible: bool(state, 'dismissible') }),
  },
  tooltip: {
    group: 'Communication', name: 'Tooltip', factory: 'createTooltip', variable: 'tooltip',
    description: 'Add a little context. Hover or focus the action to explore tooltip styles, placement, and timing.',
    summary: 'Extra context on hover or focus.', styles: ['icon-button', 'tooltip'],
    scenarios: [],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['default', 'plain', 'rich'], 'default'), choose('position', 'Position', ['top', 'right', 'bottom', 'left', 'top-start', 'top-end', 'right-start', 'right-end', 'bottom-start', 'bottom-end', 'left-start', 'left-end'], 'bottom', 'select')]),
      ...section('Content', [text('text', 'Text', 'Save to favorites')]),
      ...section('Behavior', [toggle('visible', 'Visible'), toggle('showOnHover', 'Show on hover', true), toggle('showOnFocus', 'Show on focus', true), { ...range('showDelay', 'Show delay (ms)', '300'), max: 1500, step: 100 }, { ...range('hideDelay', 'Hide delay (ms)', '100'), max: 1500, step: 100 }]),
    ],
    config: (state: ComponentState): TooltipConfig => ({ text: string(state, 'text'), variant: string(state, 'variant'), position: string(state, 'position'), visible: bool(state, 'visible'), showDelay: Number(state.showDelay), hideDelay: Number(state.hideDelay), showOnFocus: bool(state, 'showOnFocus'), showOnHover: bool(state, 'showOnHover') }),
  },
};
export type ComponentSlug = keyof typeof components;
export const componentSlugs = Object.keys(components) as ComponentSlug[];
export const playgroundGroups = [...new Set(componentSlugs.map(slug => components[slug].group))].map(label => ({
  label, slugs: componentSlugs.filter(slug => components[slug].group === label),
}));
export const isComponent = (slug: string): slug is ComponentSlug => Object.hasOwn(components, slug);
export function normalizeComponentState(slug: ComponentSlug, input: unknown): ComponentState {
  const raw = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const state: ComponentState = {};
  for (const control of components[slug].controls as Control[]) {
    const value = raw[control.key];
    state[control.key] = control.kind === 'toggle' ? value === true
      : control.options ? control.options.find(option => option === value) ?? control.initial
      : typeof value === 'string' ? value.slice(0, 80) : control.initial;
  }
  for (const control of components[slug].controls as Control[]) {
    if (control.kind === 'range') {
      const value = Number(state[control.key]);
      state[control.key] = String(Number.isFinite(value) ? Math.min(control.max!, Math.max(control.min!, value)) : control.initial);
    }
    if (control.kind === 'date' && !(slug === 'datepicker' && ['value', 'endDate'].includes(control.key) && state[control.key] === '') && !/^\d{4}-\d{2}-\d{2}$/.test(String(state[control.key]))) state[control.key] = control.initial;
    if (control.kind === 'time' && !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(String(state[control.key]))) state[control.key] = control.initial;
  }
  if (['navigation-rail', 'drawer', 'tabs'].includes(slug) && state.disableSent && state.active === 'sent') state.active = 'inbox';
  if (slug === 'tabs' && state.count === '3' && ['drafts', 'archive', 'trash'].includes(String(state.active))) state.active = 'inbox';
  if (slug === 'badge') state.hasLabel = state.variant === 'large';
  if (slug === 'progress' || slug === 'loading-indicator') state.determinate = !state.indeterminate;
  if (slug === 'progress') {
    state.circular = state.variant === 'circular';
    state.linear = !state.circular;
    state.linearDeterminate = state.linear && state.determinate;
  }
  if (slug === 'list') {
    state.hasSupporting = state.lines !== '1';
    state.threeLines = state.lines === '3';
    state.selectable = state.selection !== 'none';
    state.extraSelectable = state.selectable && state.count === '5';
    let selected = false;
    ['first', 'second', 'third', 'fourth', 'fifth'].forEach((key, index) => {
      const keep = !!state[key] && state.selection !== 'none' && index < Number(state.count) && (state.selection === 'multi' || !selected);
      selected ||= keep;
      state[key] = keep;
    });
  }
  if (slug === 'slider') {
    state.range = state.variant === 'range';
    // Inset icons are for standard sliders at M, L and XL (m3.material.io guidelines).
    state.insetIconAllowed = state.variant === 'standard' && ['M', 'L', 'XL'].includes(String(state.size));
    const step = Number(state.step);
    state.value = String(Math.round(Number(state.value) / step) * step);
    state.secondValue = String(Math.max(Number(state.value), Math.round(Number(state.secondValue) / step) * step));
  }
  if (slug === 'chips') {
    state.selectable = state.type === 'filter' || state.type === 'input';
    state.elevatedAllowed = state.type !== 'input';
    state.inputType = state.type === 'input';
    state.filterType = state.type === 'filter';
  }
  if (slug === 'chips' && !state.multiSelect) {
    let selected = false;
    for (const key of ['hiking', 'music', 'food']) { const keep: boolean = !!state[key] && !selected; selected ||= keep; state[key] = keep; }
  }
  // The trailing label is only meaningful beside a trailing icon.
  if (slug === 'text-field') state.hasTrailingIcon = state.trailingIcon !== 'none';
  // Text buttons have no toggle style (m3.material.io button specs).
  if (slug === 'button') {
    state.toggleAllowed = state.variant !== 'text';
    if (!state.toggleAllowed) state.toggle = false;
  }
  // A named toolbar action set fixes the item list: the count and toggle controls are for the default sets.
  if (slug === 'toolbar') state.actionsDefault = state.actions === 'default';
  if (slug === 'datepicker' && state.value && state.endDate && String(state.endDate) < String(state.value)) state.endDate = state.value!;
  if (slug === 'radios' && state.disableExpress && state.value === 'express') state.value = 'standard';
  if (slug === 'select' && state.disableBanana && state.value === 'banana') state.value = 'apple';
  state.theme = themes.find(theme => theme === raw.theme) ?? 'baseline';
  state.mode = raw.mode === 'dark' ? 'dark' : 'light';
  return state;
}
export function initialComponentState(slug: ComponentSlug): ComponentState {
  return normalizeComponentState(slug, Object.fromEntries(components[slug].controls.map(control => [control.key, control.initial])));
}
/** The configuration the framework code is generated from: the config, and what the preview adds beside it. */
export function elementConfig(slug: ComponentSlug, state: ComponentState): Record<string, unknown> {
  const config = components[slug].config(state) as Record<string, unknown>;
  if (slug === 'top-app-bar' || slug === 'bottom-app-bar') return { ...config, ...appBarContent(slug, state) };
  // The button beside an overlay that opens it: the drawer's while it is modal or closed.
  const trigger = (text: string, ariaLabel?: string) => ({ trigger: { text, variant: 'tonal', ...(ariaLabel ? { ariaLabel } : {}) } });
  switch (slug) {
    case 'toolbar': return toolbarElementConfig(state);
    case 'menu': return { ...config, ...trigger(String(state.text), String(state.text).trim() ? undefined : 'Open menu') };
    case 'dialog': case 'bottom-sheet': case 'side-sheet': return { ...config, ...trigger(`Open ${components[slug].name.toLowerCase()}`) };
    case 'drawer': return state.variant === 'modal' || !state.open ? { ...config, ...trigger('Open drawer') } : config;
    // The rail's while nothing else expands it, as the preview shows it.
    case 'navigation-rail': return state.layout === 'modal' || state.hideWhenCollapsed || !state.showToggle ? { ...config, ...trigger('Open navigation') } : config;
    case 'timepicker': return { ...config, ...trigger('Choose time') };
    case 'snackbar': return { ...config, open: state.visible === true, ...trigger('Show snackbar') };
    case 'tooltip': return { ...config, target: { icon: componentIcons.heart, ariaLabel: 'Favorite', variant: 'tonal' } };
    case 'select': return String(state.label).trim() ? config : { ...config, ariaLabel: 'Select an option' };
    default: return config;
  }
}
/** The vanilla code of a playground, with its icons as named constants (`editIcon`). */
export function componentCode(slug: ComponentSlug, state: ComponentState): string {
  return nameIcons(buildComponentCode(slug, state), trailingHandler(slug, state)?.icons ?? []);
}

/**
 * The text field's trailing button handler, which JSON cannot carry. Keyed by
 * `trailingBehaviour`, like the preview behaviour it mirrors, so the icon decides and the
 * label is only the accessible name. The two icons the password code names are declared
 * with `icons`: the code shows no literals for them, so `componentCode` imports them as
 * `visibilityIcon` and `visibilityOffIcon` (their icons/ files' names, as `nameIcons`
 * spells them).
 */
function trailingHandler(slug: ComponentSlug, state: ComponentState): { code: string; icons: readonly string[] } | undefined {
  if (slug !== 'text-field') return undefined;
  const behaviour = trailingBehaviour(state);
  if (!behaviour) return undefined;
  const handlers: Record<TrailingBehaviour, { code: string; icons: readonly string[] }> = {
    // m3.material.io text fields: "Clear icons let a person clear an entire input field."
    clear: { code: `onTrailingClick: () => textField.setValue(''),`, icons: [] },
    // m3.material.io text field accessibility: hidden, the label is "Show password"; visible, "Hide password".
    'show-password': { code: `onTrailingClick: () => {
  const shown = textField.input.type === 'text';
  textField.input.type = shown ? 'password' : 'text';
  textField.setTrailingIcon(shown ? visibilityIcon : visibilityOffIcon, shown ? 'Show password' : 'Hide password');
},`, icons: [symbols.visibility, symbols.visibilityOff] },
  };
  return handlers[behaviour];
}

function buildComponentCode(slug: ComponentSlug, state: ComponentState): string {
  if (components[slug].group === 'Navigation') return navigationCode(slug, state);
  if (components[slug].group === 'Containment') return containmentCode(slug, state);
  if (components[slug].group === 'Communication') return communicationCode(slug, state);
  const component = components[slug];
  // A filter chip's trailing menu needs its handler, which JSON cannot carry.
  const trailing = trailingHandler(slug, state);
  const config = JSON.stringify(component.config(state), null, 2).replace(/^(\s*)"([a-zA-Z]+)":/gm, '$1$2:')
    .replace(/^(\s*)trailingMenu: true/gm, '$1trailingMenu: true,\n$1onTrailingClick: (chip) => openMenu(chip)')
    // Same for a labelled trailing button: its handler follows the label it belongs to.
    .replace(/^(\s*)trailingIconLabel: "[^"]*",$/m, (line: string, indent: string) =>
      trailing ? `${line}\n${trailing.code.split('\n').map(part => indent + part).join('\n')}` : line);
  const chipsSetup = slug === 'chips'
    ? `${state.filterType && state.trailingMenu ? "// Anchor a material menu to chip.trailingAction here.\nfunction openMenu(chip) { console.log('Open the menu for', chip.getLabel()); }\n" : ''}` +
      `${state.draggable ? 'chips.getChips().forEach(chip => { chip.element.draggable = true; });\n' : ''}`
    : '';
  if (slug === 'checkbox' && state.family === true) return checkboxFamilyCode(state);
  const checkboxSetup = slug === 'checkbox' && !string(state, 'label').trim()
    ? "checkbox.input.setAttribute('aria-label', 'Checkbox');\n"
    : '';
  const setup = checkboxSetup + chipsSetup + (
    slug === 'radios' ? `radios.element.setAttribute('aria-label', 'Delivery method');\n` :
    slug === 'text-field' && !string(state, 'label').trim() ? `textField.input.setAttribute('aria-label', 'Text field');\n` :
    slug === 'select' && !string(state, 'label').trim() ? `select.textField.input.setAttribute('aria-label', 'Select an option');\n` :
    slug === 'timepicker' ? `const openButton = createButton({ text: 'Choose time', variant: 'tonal' });\nopenButton.on('click', () => timePicker.open());\ntimePicker.element.append(openButton.element);\n` : '');
  const calls = `${state.collapsed === true ? `${component.variable}.collapse();\n` : ''}${state.lowered === true ? `${component.variable}.lower();\n` : ''}`;
  const styles = component.styles.includes('full') ? "import 'material/styles';\n" : ["base", ...component.styles].map(style => `import 'material/styles/${style}';\n`).join('');
  return `import { ${component.factory}${slug === 'timepicker' ? ', createButton' : ''} } from 'material';\n${styles}${state.theme === 'baseline' ? '' : `import 'material/themes/${state.theme}';\n`}\n` +
    `document.documentElement.dataset.theme = '${state.theme}';\ndocument.documentElement.dataset.themeMode = '${state.mode}';\n\n` +
    `const ${component.variable} = ${component.factory}(${config});\n${calls}${setup}\ndocument.body.append(${component.variable}.element);\n\n// When the view is removed:\n${slug === 'timepicker' ? '// openButton.destroy();\n' : ''}// ${component.variable}.destroy();\n`;
}

function checkboxFamilyCode(state: ComponentState): string {
  // The options every box shares, as the playground sets them.
  const rest = `${state.labelPosition === 'start' ? ", labelPosition: 'start'" : ''}${bool(state, 'error') ? ', error: true' : ''}` +
    `${bool(state, 'required') ? ', required: true' : ''}${bool(state, 'disabled') ? ', disabled: true' : ''}`;
  const children = checkboxChildren.map(child => `  { label: '${child.label}', value: '${child.value}'${checkboxChildChecked(state, child.value) ? ', checked: true' : ''} }`).join(',\n');
  const theme = state.theme === 'baseline' ? '' : `import 'material/themes/${state.theme}';\n`;
  return `import { createCheckbox } from 'material';\nimport 'material/styles/base';\nimport 'material/styles/checkbox';\n${theme}\n` +
    `document.documentElement.dataset.theme = '${state.theme}';\ndocument.documentElement.dataset.themeMode = '${state.mode}';\n\n` +
    `// A parent over its children (m3.material.io checkbox guidelines): checking the\n// parent checks every child, and a mix makes it indeterminate.\n` +
    `const children = [\n${children}\n].map(child => createCheckbox({ ...child, name: '${string(state, 'name') || 'additions'}'${rest} }));\n` +
    `const parent = createCheckbox({ label: '${string(state, 'label') || 'Additions'}'${state.state === 'checked' ? ', checked: true' : state.state === 'indeterminate' ? ', indeterminate: true' : ''}${rest} });\n` +
    `parent.input.setAttribute('aria-controls', children.map(child => child.input.id).join(' '));\n\n` +
    `const reflect = () => {\n  const on = children.filter(child => child.isChecked()).length;\n` +
    `  if (on === children.length) parent.check();\n  else if (on === 0) parent.uncheck();\n  else { parent.uncheck(); parent.setIndeterminate(true); }\n};\n` +
    `// Only user changes: check() and uncheck() emit change too, without nativeEvent.\n` +
    `parent.on('change', ({ checked, nativeEvent }) => {\n  if (nativeEvent) children.forEach(child => (checked ? child.check() : child.uncheck()));\n});\n` +
    `children.forEach(child => child.on('change', ({ nativeEvent }) => { if (nativeEvent) reflect(); }));\n\n` +
    `// A checkbox is inline-flex: stack the children in a column, indented under the parent.\n` +
    `const group = document.createElement('div');\ngroup.style.cssText = 'display: flex; flex-direction: column; align-items: flex-start';\n` +
    `const list = document.createElement('div');\nlist.style.cssText = 'display: flex; flex-direction: column; align-items: flex-start; padding-inline-start: 24px';\n` +
    `list.append(...children.map(child => child.element));\ngroup.append(parent.element, list);\ndocument.body.append(group);\n\n` +
    `// When the view is removed:\n// parent.destroy(); children.forEach(child => child.destroy());\n`;
}

function navigationCode(slug: ComponentSlug, state: ComponentState): string {
  const component = components[slug];
  const literal = (value: unknown) => JSON.stringify(value, null, 2).replace(/^(\s*)"([a-zA-Z]+)":/gm, '$1$2:');
  const imports = [component.factory];
  let before = '';
  let after = '';
  let cleanup = '';
  if (slug === 'menu') {
    imports.push('createButton');
    before = `const trigger = createButton(${literal({ text: state.text, variant: 'tonal', ariaLabel: String(state.text).trim() || 'Open menu' })});\ntrigger.element.id = 'menu-trigger';\ndocument.body.append(trigger.element);\n\n`;
    after = `menu.on('select', event => console.log(event.item.text));\n`;
    cleanup = '// trigger.destroy();\n';
  }
  if (slug === 'drawer' || slug === 'navigation-rail') {
    imports.push('createButton');
    const method = slug === 'drawer' ? 'open' : 'expand';
    after = `const trigger = createButton({ text: 'Open ${slug === 'drawer' ? 'drawer' : 'navigation'}', variant: 'tonal' });\ntrigger.on('click', () => ${component.variable}.${method}());\ndocument.body.append(trigger.element);\n${component.variable}.on('select', event => console.log(event.id));\n`;
    cleanup = '// trigger.destroy();\n';
  }
  if (slug === 'tabs') after = `tabs.element.setAttribute('aria-label', 'Mailbox views');\ntabs.on('change', event => console.log(event.value));\n`;
  if (slug === 'top-app-bar' || slug === 'bottom-app-bar') {
    imports.push('createIconButton');
    after = `const actions = ${literal(appBarActions(state))}.map(config => createIconButton(config));\nactions.forEach(button => ${component.variable}.${slug === 'top-app-bar' ? 'addTrailingElement' : 'addAction'}(button.element));\n`;
    cleanup = '// actions.forEach(button => button.destroy());\n';
    if (slug === 'top-app-bar') {
      if (state.leading) {
        after += `const navigation = createIconButton(${literal({ icon: componentIcons.menu, ariaLabel: 'Open navigation' })});\ntopBar.addLeadingElement(navigation.element);\n`;
        cleanup += '// navigation.destroy();\n';
      }
      after += `topBar.setScrollState(${state.scrolled});\n`;
    } else {
      if (state.hasFab) {
        imports.push('createFab');
        after += `const fab = createFab(${literal({ icon: componentIcons.add, ariaLabel: String(state.fabLabel).trim() || 'Compose' })});\nbottomBar.addFab(fab.element);\n`;
        cleanup += '// fab.destroy();\n';
      }
      if (!state.visible) after += 'bottomBar.hide();\n';
    }
  }
  // A toolbar's named action set pairs a FAB with the bar (passed at creation, as the
  // factory takes it) and opens a menu from the trailing more button it adds itself.
  let config = literal(component.config(state));
  if (slug === 'toolbar') {
    const content = toolbarContent(state);
    if (content.fab) {
      imports.push('createFab');
      before = `const fab = createFab(${literal(content.fab)});\n\n`;
      cleanup = '// fab.destroy();\n';
    }
    if (content.overflow) imports.push('createMenu');
    // The menu's items, indented to sit inside the createMenu call in the config literal.
    const menuItems = content.overflow ? literal(content.overflow).split('\n').map((line, index) => index ? `  ${line}` : line).join('\n') : '';
    const extras = [
      ...(content.fab ? ['fab: fab.element', ...(content.fabPosition === 'start' ? ["fabPosition: 'start'"] : [])] : []),
      ...(content.overflow ? [`overflow: (opener) => createMenu({ opener,${content.overflowPosition ? ` position: '${content.overflowPosition}',` : ''} items: ${menuItems} })`] : []),
    ];
    if (extras.length) config = config.replace(/\n\}$/, `,\n  ${extras.join(',\n  ')}\n}`);
  }
  const styles = ['base', ...component.styles].map(style => `import 'material/styles/${style}';\n`).join('');
  return `import { ${imports.join(', ')} } from 'material';\n${styles}${state.theme === 'baseline' ? '' : `import 'material/themes/${state.theme}';\n`}\n` +
    `document.documentElement.dataset.theme = '${state.theme}';\ndocument.documentElement.dataset.themeMode = '${state.mode}';\n\n` +
    `${before}const ${component.variable} = ${component.factory}(${config});\n${after}\ndocument.body.append(${component.variable}.element);\n\n// When the view is removed:\n${cleanup}// ${component.variable}.destroy();\n`;
}

function communicationCode(slug: ComponentSlug, state: ComponentState): string {
  const component = components[slug];
  const literal = (value: unknown) => JSON.stringify(value, null, 2).replace(/^(\s*)"([a-zA-Z]+)":/gm, '$1$2:');
  const hasTarget = slug === 'badge' || slug === 'tooltip';
  const styles = ['base', ...component.styles].map(style => `import 'material/styles/${style}';\n`).join('');
  let before = '';
  let config = literal(component.config(state));
  let after = `document.body.append(${component.variable}.element);\n`;
  let cleanup = '';
  if (hasTarget) {
    before = `const target = createIconButton(${literal({ icon: componentIcons[slug === 'badge' ? 'inbox' : 'heart'], ariaLabel: slug === 'badge' ? 'Inbox' : 'Favorite', variant: 'tonal' })});\ndocument.body.append(target.element);\n\n`;
    config = config.replace(/\n}$/, ',\n  target: target.element\n}');
    after = '';
    cleanup = '// target.destroy();\n';
  } else if (slug === 'snackbar') {
    after = "const trigger = createButton({ text: 'Show snackbar', variant: 'tonal' });\ntrigger.on('click', () => snackbar.show());\ndocument.body.append(trigger.element);\n" + (state.visible ? 'snackbar.show();\n' : '');
    cleanup = '// trigger.destroy();\n';
  } else if (slug === 'progress' && state.variant === 'linear') {
    after = "progress.element.style.width = 'min(100%, 360px)';\n" + after;
  }
  return `import { ${component.factory}${hasTarget ? ', createIconButton' : slug === 'snackbar' ? ', createButton' : ''} } from 'material';\n${styles}${state.theme === 'baseline' ? '' : `import 'material/themes/${state.theme}';\n`}\n` +
    `document.documentElement.dataset.theme = '${state.theme}';\ndocument.documentElement.dataset.themeMode = '${state.mode}';\n\n` +
    `${before}const ${component.variable} = ${component.factory}(${config});\n${after}\n// When the view is removed:\n${slug === 'snackbar' ? '// snackbar.hide();\n' : ''}// ${component.variable}.destroy();\n${cleanup}`;
}

function containmentCode(slug: ComponentSlug, state: ComponentState): string {
  const component = components[slug];
  const hasTrigger = ['dialog', 'bottom-sheet', 'side-sheet'].includes(slug);
  const shown = component.config(state) as Record<string, unknown>;
  // The preview's twenty-four photos would bury the code: three show the shape.
  const slides = slug === 'carousel' ? (shown.slides as unknown[]) : [];
  const config = JSON.stringify(slug === 'carousel' ? { ...shown, slides: slides.slice(0, 3) } : shown, null, 2).replace(/^(\s*)"([a-zA-Z]+)":/gm, '$1$2:')
    .replace(/(\n  slides: \[)/, slides.length > 3 ? `\n  // The preview shows ${slides.length} photos; three are listed here.$1` : '$1');
  const styles = ['base', ...component.styles].map(style => `import 'material/styles/${style}';\n`).join('');
  let setup = '';
  if (slug === 'list' && state.trailing === 'control') setup += `const onListAction = (event) => {\n  const action = event.target.closest('[data-list-action]');\n  if (action) console.log('Saved:', action.dataset.listAction);\n};\nlist.element.addEventListener('click', onListAction);\n`;
  if (hasTrigger) setup = `const trigger = createButton({ text: 'Open ${component.name.toLowerCase()}', variant: 'tonal' });\ntrigger.on('click', () => ${component.variable}.${slug === 'bottom-sheet' ? 'expand' : 'open'}());\ndocument.body.append(trigger.element);\n`;
  else {
    if (slug === 'divider') setup += `const container = document.createElement('div');\ncontainer.style.cssText = 'display:flex;align-items:center;width:100%;max-width:400px;flex-direction:${state.orientation === 'vertical' ? 'column' : 'row'};${state.orientation === 'vertical' ? 'height:200px;' : ''}';\ndivider.element.style.flex = '1';\ncontainer.append(divider.element);\ndocument.body.append(container);\n`;
    if (slug === 'carousel') setup += "// A carousel needs a container with a defined height.\ncarousel.element.style.height = '320px';\n";
    if (slug !== 'divider') setup += `document.body.append(${component.variable}.element);\n`;
    if (slug === 'carousel') setup += "\n// Drive it from your own controls: carousel.next(), carousel.prev(), carousel.goTo(index).\n// 'change' reports every move: from the API, a swipe, the keyboard or a trackpad.\ncarousel.on('change', ({ value }) => console.log(`Slide ${value + 1} of ${carousel.slides.getCount()}`));\n";
  }
  return `import { ${component.factory}${hasTrigger ? ', createButton' : ''} } from 'material';\n${styles}${state.theme === 'baseline' ? '' : `import 'material/themes/${state.theme}';\n`}\n` +
    `document.documentElement.dataset.theme = '${state.theme}';\ndocument.documentElement.dataset.themeMode = '${state.mode}';\n\n` +
    `${slug === 'card' && state.media || slug === 'carousel' || slug === 'list' && ['image', 'video'].includes(String(state.leading)) ? '// Replace the demo image paths with your own images.\n' : ''}const ${component.variable} = ${component.factory}(${config});\n${setup}\n// When the view is removed:\n// ${component.variable}.destroy();\n${slug === 'list' && state.trailing === 'control' ? '// list.element.removeEventListener(\'click\', onListAction);\n' : hasTrigger ? '// trigger.destroy();\n' : slug === 'divider' ? '// container.remove();\n' : ''}`;
}
