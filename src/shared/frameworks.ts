// The playground's code in every framework, for components that exist as web components.
//
// The code is generated from the same configuration object as the vanilla code
// (`componentCode`), mapped through the element's spec: which config key is which
// attribute, which property two-way binding drives, what the slotted label is.
// The server serialises that spec (`ElementMeta`) from mtrl/elements, so the
// browser bundle does not carry the elements themselves.

import { createIconNamer, isMarkup } from './icon-code';

export type Framework = 'html' | 'react' | 'vue' | 'svelte' | 'solid' | 'vanilla';

export const FRAMEWORKS: { id: Framework; label: string; language: 'xml' | 'typescript' | 'javascript' }[] = [
  { id: 'vanilla', label: 'Vanilla', language: 'javascript' },
  { id: 'html', label: 'Web Components', language: 'xml' },
  { id: 'react', label: 'React', language: 'typescript' },
  { id: 'vue', label: 'Vue', language: 'xml' },
  { id: 'svelte', label: 'Svelte', language: 'xml' },
  { id: 'solid', label: 'SolidJS', language: 'typescript' },
];

type AttributeType = 'string' | 'boolean' | 'number';

/** Children declared as elements of their own (tabs' `<m-tab>`), read from a config array. */
export interface ChildrenMeta {
  /** Element name after the prefix: `tab`. */
  name: string;
  /** The config array the children come from: `tabs`. */
  from: string;
  /** The item key whose value is the child's text content; the first one set, when several. */
  text: string | string[];
  /** The child's attributes, read from the item key of the same name in camelCase (`badgeLabel`). */
  attributes: Record<string, AttributeType>;
  /** Item keys named otherwise than their attribute: chips' `type` is `variant`. */
  keys?: Record<string, string>;
  /** Item keys holding `{ type, content }`, whose attribute the type picks: list's `leading` → `leading-icon`. */
  typed?: Record<string, Record<string, string>>;
  /** Item keys the element infers, as one plus how many of these keys the item has: list's `lines`. */
  counted?: Record<string, string[]>;
  /** An item selected in the config becomes the parent's model value. */
  selected?: { key: string; equals: string | boolean; value: string };
  /** Item key values that are each a boolean attribute: menu's `type: 'divider'` is `divider`. */
  flags?: Record<string, Record<string, string>>;
  /** The item key holding the item's own children (a submenu), and the key that only says it has them. */
  nested?: { key: string; flag?: string };
}

/** A config key the element's spec does not map, or maps otherwise. */
export interface ConfigKey {
  /** Written as this attribute, or these: the drawer's `dismissible` is both `no-close-on-*`. */
  attribute?: string | string[];
  /** Config values (as strings) to attribute values: `true` is a bare attribute; a value neither listed nor ignored is not exposed. */
  values?: Record<string, string | number | true>;
  /** Written only when this other key has this value, and not exposed otherwise: the time picker's seconds need a one-minute step. */
  only?: { key: string; equals: string | number | boolean };
  /** An array value is the model as one string, joined by this: a date range's `start/end`. */
  join?: string;
  /** The element's text content. */
  text?: true;
  /** The values the element's model selects. */
  model?: true;
  /** A method the element is called with: the value is the argument, or with `when` the call happens on that value. */
  call?: { method: string; when?: string | number | boolean };
  /** Values the element has by default, or reads elsewhere: nothing to write. */
  ignore?: (string | number | boolean)[];
  /** Nothing to write when equal to this other key's value, which implies it. */
  same?: string;
}

/** A config value the element takes as a child element in one of its slots (the card's actions). */
export interface SlottedMeta {
  /** The config key: an object or an array of them. */
  from: string;
  /** Element name after the prefix (`icon-button`), or a native tag with `native`. */
  element: string;
  native?: boolean;
  /** The slot; the default slot without. */
  slot?: string;
  /** Item keys to the child's attributes. */
  attributes: Record<string, string>;
  /** The item key whose value is the child's text content. */
  text?: string;
  /** Item values the element has by default: nothing to write. */
  ignore?: Record<string, (string | number | boolean)[]>;
  /** Placed after the parent's text content. */
  after?: boolean;
  /** The config value is markup of this native element, whose text is the child's: the dialog's `<p>` content. */
  markup?: boolean;
  /** An item key that, true, makes a click on the child close the parent: the dialog's `closeDialog`. */
  closes?: string;
}

/**
 * The button the preview has beside the element: one that opens it, or the
 * target a tooltip describes. Read from a config key the playground adds
 * (`elementConfig`), and written before the element with an id.
 */
export interface TriggerMeta extends Omit<SlottedMeta, 'slot' | 'after' | 'markup' | 'closes'> {
  id: string;
  /** The element's attribute naming that id, when the element listens to the trigger itself: the menu's `anchor`, the tooltip's `for`. */
  for?: string;
  /** The trigger's text shows the model value after this separator: the time picker's `Choose time · 09:30`. */
  shows?: string;
}

/**
 * `open` as state, as on `<details>`: the element reflects it and dispatches
 * `open` and `close`. With a trigger, the frameworks bind it one way and set
 * it back from those events.
 */
export interface OpenMeta {
  /** The config key of its first value: open when true, or when one of `values`. */
  config?: string;
  values?: unknown[];
  /** The methods the HTML opens and closes it with; without, it sets the state. */
  show?: string;
  hide?: string;
  /** The state attribute, `open` unless named: the navigation rail's `expanded`. */
  property?: string;
  /** Its events as it opens and closes, `open` and `close` unless named: the rail's `expand` and `collapse`. */
  events?: [string, string];
}

/** What the generators need from an element's spec: plain data, no functions. */
export interface ElementMeta {
  name: string;
  attributes: Record<string, { type: AttributeType; config?: string }>;
  /** Live properties; those with a config key are written when the config differs from `default`. */
  properties: Record<string, { config?: string; default?: unknown }>;
  model?: string;
  events: string[];
  /** Form-associated: the host's own `name` attribute names its value, as on native controls. */
  form?: boolean;
  slot?: { attribute: string; config: string };
  children?: ChildrenMeta;
  /** Config keys (`header.title` for a nested one) the spec does not map, or maps otherwise. */
  keys?: Record<string, ConfigKey>;
  slotted?: SlottedMeta[];
  /** The selection is multiple when this config key is true: the model is an array, or with `children` the children are `selected`. */
  multiple?: { key: string; children?: boolean };
  /** Inline styles the element needs in the page, as the preview gives it: the carousel's height. */
  style?: Record<string, string>;
  /** The button beside the element: its opener, or a tooltip's target. */
  trigger?: TriggerMeta;
  /** `open` as state the element reflects and reports. */
  open?: OpenMeta;
  /** Other state the element reflects, bound beside `open` and following both its events: the bottom sheet's `expanded`. */
  states?: (OpenMeta & { property: string; events: [string, string]; opens?: true })[];
}

/** A docs example's handler: on `event`, call `call` with payload fields (identifiers) or literals. */
export interface ExampleHandler {
  event: string;
  call: string;
  args: string[];
}
/** One step of a docs example's action: set a config key, or open or close the element. */
export type ExampleStep = { set: string; value: unknown } | { open: boolean };
export interface ExampleAction {
  name: string;
  steps: ExampleStep[];
}
/** What a docs example adds to its configuration: handlers and actions. */
export interface ExampleParts {
  handlers: ExampleHandler[];
  actions: ExampleAction[];
}

// A config value naming one of the app's identifiers (`saveIcon`) rather than a string.
const APP = '\u0000app:';
/** A config value that is the app's identifier `name`, written as code and never quoted. */
export const appRef = (name: string): string => `${APP}${name}`;
/** The app identifier a config value names, if it names one. */
export const appName = (value: unknown): string | undefined =>
  typeof value === 'string' && value.startsWith(APP) ? value.slice(APP.length) : undefined;
/** A value as code: an app identifier bare, anything else as a literal. */
export const jsValue = (value: unknown): string => appName(value) ?? literal(value);
/** A handler argument that is a payload field, not a literal. */
export const isField = (arg: string): boolean => /^[A-Za-z_$][\w$]*$/.test(arg) && !['true', 'false', 'null', 'undefined'].includes(arg);
/** The handler's call, its payload fields read through `field`. */
export const handlerCall = (handler: ExampleHandler, field: (name: string) => string): string =>
  `${handler.call}(${handler.args.map(arg => (isField(arg) ? field(arg) : arg)).join(', ')})`;
const readsPayload = (handler: ExampleHandler): boolean => handler.args.some(isField);

type Config = Record<string, unknown>;
/** `state`: bound to the state of that name (an example's action sets it); `unset`: no first value to write. */
type Attr = { name: string; value: string | number | true; ref?: string; state?: string; unset?: true };
/** A live property: set in script for HTML, a prop in the frameworks. */
type Prop = { name: string; value: string | number | boolean; state?: string; ref?: string };
/** A child element in one of the parent's slots; `closes` when a click on it closes the parent. */
type Slotted = { element: string; native: boolean; attrs: Attr[]; text: string; after: boolean; closes: boolean };
/** A declaration child, with its own children (a submenu). */
type Child = { attrs: Attr[]; text: string; children: Child[] };

const camel = (name: string): string => name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
const pascal = (name: string): string => camel(name).replace(/^./, c => c.toUpperCase());
const escapeAttr = (value: string): string => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
/** Text content: braces too, which JSX, Svelte and Vue would read as code. */
const escapeText = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('{', '&#123;').replaceAll('}', '&#125;');
const quoteJs = (value: string): string => JSON.stringify(value);
/** The HTML script's name for the element: `switch` is a reserved word. */
const hostVariable = (meta: ElementMeta): string => (meta.name === 'switch' ? 'switchElement' : camel(meta.name));
/** The open state's attribute and its events: `open`, `open` and `close` unless the element names others. */
const openName = (meta: ElementMeta): string => meta.open?.property ?? 'open';
const openEvents = (meta: ElementMeta): [string, string] => meta.open?.events ?? ['open', 'close'];

interface Plan {
  attrs: Attr[];
  /** The model property and its initial value, when the config sets it. */
  model?: { name: string; value: unknown };
  props: Prop[];
  text?: string;
  children: Child[];
  slotted: Slotted[];
  /** The button before the element, with its id. */
  trigger?: Slotted & { id: string };
  /** Open state, bound when the element has a trigger: its first value. */
  open?: boolean;
  /** Other state bound beside it, with its first value. */
  states: { name: string; value: boolean; events: [string, string]; opens?: true }[];
  /** Methods the element is called with once it is there. */
  calls: { method: string; argument?: unknown }[];
  /** Config options the element does not expose yet: named in a comment, never dropped silently. */
  omitted: string[];
  /** The text content is this state, which an example's action sets. */
  textState?: string;
  /** A docs example's handlers and actions, bound to the element. */
  example?: ExampleBinding;
}

/** An action step as each framework writes it: the state it sets and the value, and the web component's statement. */
type BoundStep = { state: string; value: unknown; html: string };
interface ExampleBinding {
  handlers: ExampleHandler[];
  /** State an action sets, beyond the model and the open state, with its first value. */
  states: { name: string; value: unknown }[];
  actions: { name: string; steps: BoundStep[] }[];
  /** The app's identifiers the code uses: the handlers' placeholders and the icons. */
  app: string[];
}

const valueOf = (type: AttributeType, raw: unknown): string | number | true | undefined => {
  if (raw === undefined || raw === null || raw === '' || raw === false) return undefined;
  if (type === 'boolean') return raw ? true : undefined;
  if (type === 'number') return typeof raw === 'number' ? raw : Number(raw);
  return String(raw);
};

/** A value written as it is: its type says how. */
const plainValue = (raw: unknown): string | number | true | undefined =>
  valueOf(typeof raw === 'number' ? 'number' : typeof raw === 'boolean' ? 'boolean' : 'string', raw);

const isSet = (value: unknown): boolean => value !== undefined && value !== null && value !== '' && value !== false;

const isRecord = (value: unknown): value is Config => !!value && typeof value === 'object' && !Array.isArray(value);

/** A dotted config path: `header.title`. */
const read = (config: Config, path: string): unknown =>
  path.split('.').reduce<unknown>((value, key) => (isRecord(value) ? value[key] : undefined), config);

/** An `<img>` given as markup becomes its URL, which an image attribute takes. */
const imageSource = (value: unknown): unknown =>
  typeof value === 'string' ? (/^<img\b[^>]*\bsrc="([^"]*)"/.exec(value)?.[1] ?? value) : value;

/** The text of an element's markup (`<p>Text</p>`), its entities decoded. */
const markupText = (element: string, value: string): string => {
  const inner = new RegExp(`^\\s*<${element}\\b[^>]*>([\\s\\S]*)</${element}>\\s*$`).exec(value)?.[1] ?? value;
  return inner.replace(/<[^>]*>/g, '').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&amp;', '&');
};

function plan(meta: ElementMeta, config: Config): Plan {
  const used = new Set<string>();
  const attrs: Attr[] = [];
  // One attribute can be written from several keys (list's `selection`): the last one set wins.
  const setAttr = (name: string, value: string | number | true) => {
    const at = attrs.findIndex(a => a.name === name);
    if (at === -1) attrs.push({ name, value }); else attrs[at] = { name, value };
  };
  // With a trigger, `open` is state the frameworks bind, not an attribute.
  const triggerItem = meta.trigger ? config[meta.trigger.from] : undefined;
  let open: boolean | undefined;
  const states: Plan['states'] = [];
  const firstValue = (state: OpenMeta): boolean => {
    const raw = state.config === undefined ? false : config[state.config];
    if (state.config !== undefined) used.add(state.config);
    return state.values ? state.values.includes(raw) : raw === true;
  };
  if (meta.open && isRecord(triggerItem)) {
    open = firstValue(meta.open);
    for (const state of meta.states ?? []) states.push({ name: state.property, value: firstValue(state), events: state.events, ...(state.opens ? { opens: true as const } : {}) });
  }
  const stateNames = new Set(open === undefined ? [] : [openName(meta), ...states.map(state => state.name)]);
  let model: Plan['model'];
  const attributes = meta.form && !meta.attributes.name
    ? { name: { type: 'string' as const, config: 'name' }, ...meta.attributes } : meta.attributes;
  for (const [name, attribute] of Object.entries(attributes)) {
    if (!attribute.config || !(attribute.config in config)) continue;
    used.add(attribute.config);
    const raw = config[attribute.config];
    if (meta.model && camel(name) === meta.model) {
      const join = meta.keys?.[attribute.config]?.join;
      if (raw !== undefined) model = { name: meta.model, value: join && Array.isArray(raw) ? raw.join(join) : raw };
      continue;
    }
    // A default the element has: nothing to write.
    if (stateNames.has(name) || (meta.keys?.[attribute.config]?.ignore as unknown[] | undefined)?.includes(raw)) continue;
    const value = valueOf(attribute.type, raw);
    if (value !== undefined) attrs.push({ name, value });
  }
  const props: Prop[] = [];
  const attributeNames = new Set(Object.keys(meta.attributes).map(camel));
  for (const [name, property] of Object.entries(meta.properties)) {
    if (!property.config || name === meta.model || attributeNames.has(name) || !(property.config in config)) continue;
    used.add(property.config);
    const raw = config[property.config];
    const fallback = property.default ?? false;
    if (raw === undefined || raw === null || raw === fallback || (raw === '' && fallback === false)) continue;
    if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') props.push({ name, value: raw });
  }
  let text: string | undefined;
  if (meta.slot && typeof config[meta.slot.config] === 'string') {
    used.add(meta.slot.config);
    text = config[meta.slot.config] as string;
  }
  // Config keys the spec does not map, or maps otherwise.
  let selection: string[] | undefined;
  const calls: Plan['calls'] = [];
  for (const [path, key] of Object.entries(meta.keys ?? {})) {
    const raw = read(config, path);
    if (raw === undefined) continue;
    const ignored = (key.ignore as unknown[] | undefined)?.includes(raw) || (key.same !== undefined && raw === config[key.same]);
    if (ignored) used.add(path);
    else if (key.attribute) {
      if (key.values && !Object.hasOwn(key.values, String(raw))) continue;
      if (key.only && config[key.only.key] !== key.only.equals) continue;
      used.add(path);
      const names = [key.attribute].flat();
      const value = key.values ? key.values[String(raw)] : valueOf(meta.attributes[names[0]!]?.type ?? 'string', raw);
      if (value !== undefined) for (const name of names) setAttr(name, value);
    } else if (key.text) {
      used.add(path);
      if (typeof raw === 'string' && raw) text = raw;
    } else if (key.model) {
      used.add(path);
      selection = (Array.isArray(raw) ? raw : [raw]).map(String);
    } else if (key.call) {
      used.add(path);
      if (key.call.when === undefined) calls.push({ method: key.call.method, argument: raw });
      else if (raw === key.call.when) calls.push({ method: key.call.method });
    }
  }
  const childOmitted: string[] = [];
  const omit = (name: string) => { if (!childOmitted.includes(name)) childOmitted.push(name); };
  const kids = meta.children;
  const chosen: string[] = [];
  let selectable = false;
  let children: Child[] = [];
  if (kids && Array.isArray(config[kids.from])) {
    used.add(kids.from);
    // Each attribute's item key: its camelCase name, unless an item key is named otherwise.
    const itemKeys: Record<string, string> = Object.fromEntries(Object.keys(kids.attributes).map(name => [name, camel(name)]));
    for (const [key, name] of Object.entries(kids.keys ?? {})) itemKeys[name] = key;
    const texts = [kids.text].flat();
    const known = new Set([...Object.values(itemKeys), ...texts, ...Object.keys(kids.typed ?? {}), ...Object.keys(kids.counted ?? {}),
      ...Object.keys(kids.flags ?? {}), ...(kids.selected ? [kids.selected.key] : []), ...(kids.nested ? [kids.nested.key, kids.nested.flag ?? kids.nested.key] : [])]);
    // An item given as a string is its text: search's suggestions.
    const declare = (items: (Config | string)[], path: string): Child[] => items.flatMap(entry => {
      const item: Config = typeof entry === 'string' ? { [texts[0]!]: entry } : entry;
      // An item whose flag the element has no attribute for is left out: the menu's gap.
      const unflagged = Object.entries(kids.flags ?? {}).find(([key, values]) => item[key] !== undefined && !values[String(item[key])]);
      if (unflagged) {
        omit(`${path}[].${unflagged[0]} (${String(item[unflagged[0]])})`);
        return [];
      }
      const childAttrs: Attr[] = [];
      for (const [name, type] of Object.entries(kids.attributes)) {
        // The selected item is the parent's model, not an attribute of its own.
        if (itemKeys[name] === kids.selected?.key) continue;
        const value = valueOf(type, item[itemKeys[name]!]);
        if (value !== undefined) childAttrs.push({ name, value });
      }
      for (const [key, types] of Object.entries(kids.typed ?? {})) {
        const slot = item[key];
        if (!isRecord(slot)) continue;
        const name = types[String(slot.type)];
        const value = name ? valueOf('string', imageSource(slot.content)) : undefined;
        if (name && value !== undefined) childAttrs.push({ name, value });
        else omit(`${path}[].${key} (${String(slot.type)})`);
      }
      for (const [key, values] of Object.entries(kids.flags ?? {})) {
        if (item[key] !== undefined) childAttrs.push({ name: values[String(item[key])]!, value: true });
      }
      for (const [key, parts] of Object.entries(kids.counted ?? {})) {
        if (item[key] !== undefined && item[key] !== 1 + parts.filter(part => isSet(item[part])).length) omit(`${path}[].${key}`);
      }
      const textKey = texts.find(key => item[key] !== undefined);
      const nested = kids.nested && Array.isArray(item[kids.nested.key]) ? declare(item[kids.nested.key] as Config[], `${path}[].${kids.nested.key}`) : [];
      for (const [key, value] of Object.entries(item)) {
        if (!known.has(key) && isSet(value)) omit(`${path}[].${key}`);
      }
      if (kids.selected && kids.selected.key in item) {
        selectable = true;
        if (item[kids.selected.key] === kids.selected.equals) chosen.push(String(item[kids.selected.value]));
      }
      return [{ attrs: childAttrs, text: textKey ? String(item[textKey]) : '', children: nested }];
    });
    children = declare(config[kids.from] as Config[], kids.from);
    if (!selection && selectable) selection = chosen;
  }
  if (selection?.length && meta.model) {
    const many = !!meta.multiple && config[meta.multiple.key] === true;
    if (many && meta.multiple!.children) {
      // A model of one value: each selected child says so itself.
      for (const child of children) {
        const value = child.attrs.find(a => a.name === 'value')?.value;
        if (value !== undefined && selection.includes(String(value))) child.attrs.push({ name: 'selected', value: true });
      }
    } else model = { name: meta.model, value: many ? selection : selection[0] };
  }
  // A slotted item's attributes, text and closing, by its keys.
  const slottedChild = (entry: SlottedMeta | TriggerMeta, item: Config, path: string, childAttrs: Attr[]): Slotted => {
    let childText = '';
    let closes = false;
    for (const [key, value] of Object.entries(item)) {
      if (key === entry.text) childText = String(value ?? '');
      else if ('closes' in entry && key === entry.closes) closes = value === true;
      else if (entry.attributes[key]) {
        const written = plainValue(value);
        if (written !== undefined) childAttrs.push({ name: entry.attributes[key]!, value: written });
      } else if (isSet(value) && !(entry.ignore?.[key] as unknown[] | undefined)?.includes(value)) omit(`${path}.${key}`);
    }
    return { element: entry.element, native: !!entry.native, attrs: childAttrs, text: childText, after: 'after' in entry && !!entry.after, closes };
  };
  const slotted: Slotted[] = [];
  for (const entry of meta.slotted ?? []) {
    const raw = config[entry.from];
    if (raw === undefined || raw === null) continue;
    used.add(entry.from);
    const path = Array.isArray(raw) ? `${entry.from}[]` : entry.from;
    for (const item of [raw].flat()) {
      const childAttrs: Attr[] = entry.slot ? [{ name: 'slot', value: entry.slot }] : [];
      if (entry.markup && typeof item === 'string') {
        const markupValue = markupText(entry.element, item);
        if (markupValue) slotted.push({ element: entry.element, native: !!entry.native, attrs: childAttrs, text: markupValue, after: !!entry.after, closes: false });
      } else if (isRecord(item)) slotted.push(slottedChild(entry, item, path, childAttrs));
    }
  }
  let trigger: Plan['trigger'];
  if (meta.trigger && isRecord(triggerItem)) {
    used.add(meta.trigger.from);
    trigger = { ...slottedChild(meta.trigger, triggerItem, meta.trigger.from, [{ name: 'id', value: meta.trigger.id }]), id: meta.trigger.id };
    if (meta.trigger.for) setAttr(meta.trigger.for, meta.trigger.id);
  }
  const omitted: string[] = [];
  for (const [key, value] of Object.entries(config)) {
    // A key the element does not take is reported whatever its value, false too (the rail's `ripple`).
    if (used.has(key) || ['prefix', 'class', 'ariaLabel'].includes(key) || !(isSet(value) || (key in (meta.keys ?? {}) && value !== undefined))) continue;
    // A nested object some of whose keys are mapped: the others by their path.
    const nested = [...used].some(path => path.startsWith(`${key}.`));
    if (nested && isRecord(value)) {
      for (const [inner, innerValue] of Object.entries(value)) {
        if (!used.has(`${key}.${inner}`) && isSet(innerValue)) omitted.push(`${key}.${inner}`);
      }
    } else if (!nested) omitted.push(key);
  }
  if (meta.style) attrs.push({ name: 'style', value: Object.entries(meta.style).map(([property, value]) => `${property}: ${value}`).join('; ') });
  return { attrs, model, props, text, children, slotted, trigger, open, states, calls, omitted: omitted.concat(childOmitted) };
}

/**
 * Binds a docs example's actions to the element: each key an action sets becomes
 * state the frameworks declare and pass down, and a statement on the web component
 * (its live property, its text, or its attribute). What the element cannot take is
 * an error: an example renders in every framework or fails.
 */
function bindExample(meta: ElementMeta, p: Plan, config: Config, parts: ExampleParts): ExampleBinding {
  const variable = hostVariable(meta);
  const states: ExampleBinding['states'] = [];
  const declare = (name: string, value: unknown) => { if (!states.some(s => s.name === name)) states.push({ name, value }); };
  const bindStep = (step: ExampleStep): BoundStep => {
    if ('open' in step) {
      if (!meta.open) throw new Error(`<m-${meta.name}> has no open state to ${step.open ? 'open' : 'close'}`);
      if (p.open === undefined) {
        const first = meta.open.config === undefined ? false : config[meta.open.config];
        p.open = meta.open.values ? meta.open.values.includes(first) : first === true;
        p.omitted = p.omitted.filter(key => key !== meta.open!.config);
      }
      const method = step.open ? meta.open.show : meta.open.hide;
      return { state: openName(meta), value: step.open, html: method ? `${variable}.${method}();` : `${variable}.${openName(meta)} = ${step.open};` };
    }
    const { set: key, value } = step;
    const code = jsValue(value);
    const [name, attribute] = Object.entries(meta.attributes).find(([, a]) => a.config === key) ?? [];
    if (name && meta.model && camel(name) === meta.model) {
      if (!p.model) throw new Error(`set ${key} needs the first ${key} in the example`);
      return { state: p.model.name, value, html: `${variable}.${meta.model} = ${code};` };
    }
    if (meta.slot?.config === key) {
      p.textState = key;
      declare(key, p.text ?? '');
      return { state: key, value, html: `${variable}.textContent = ${code};` };
    }
    const property = Object.entries(meta.properties).find(([, prop]) => prop.config === key)?.[0];
    // A live property with an attribute of its own (a progress's `value`): the
    // attribute holds the first value and is the state the frameworks bind; the
    // web component's action sets the property.
    const own = property && name && camel(name) === property ? p.attrs.find(a => a.name === name) : undefined;
    if (own) {
      own.state = key;
      declare(key, config[key]);
      return { state: key, value, html: `${variable}.${property} = ${code};` };
    }
    if (property) {
      const prop = p.props.find(pr => pr.name === property);
      if (prop) prop.state = key;
      else p.props.push({ name: property, value: false, state: key });
      declare(key, config[key] ?? meta.properties[property]!.default ?? false);
      return { state: key, value, html: `${variable}.${property} = ${code};` };
    }
    if (name && attribute) {
      const attr = p.attrs.find(a => a.name === name);
      if (attr) attr.state = key;
      else p.attrs.push({ name, value: true, state: key, unset: true });
      declare(key, config[key] ?? (attribute.type === 'boolean' ? false : undefined));
      return {
        state: key, value,
        html: attribute.type === 'boolean' ? `${variable}.toggleAttribute('${name}', ${value === true});` : `${variable}.setAttribute('${name}', ${appName(value) ?? quoteJs(String(value))});`,
      };
    }
    throw new Error(`<m-${meta.name}> has no attribute or property for ${key}`);
  };
  const actions = parts.actions.map(action => ({ name: action.name, steps: action.steps.map(bindStep) }));
  const names = new Set(actions.map(a => a.name));
  for (const handler of parts.handlers) {
    if (readsPayload(handler) && !meta.events.includes(handler.event)) throw new Error(`<m-${meta.name}>'s ${handler.event} event has no detail to read ${handler.args.filter(isField).join(', ')} from`);
  }
  // The app's identifiers: placeholders, and the icons anywhere in the config or the actions.
  const refs = new Set<string>(parts.handlers.map(h => h.call).filter(call => !names.has(call)));
  const scan = (value: unknown): void => {
    const app = appName(value);
    if (app) refs.add(app);
    else if (Array.isArray(value)) value.forEach(scan);
    else if (isRecord(value)) Object.values(value).forEach(scan);
  };
  scan(config);
  parts.actions.forEach(action => action.steps.forEach(step => 'set' in step && scan(step.value)));
  return { handlers: parts.handlers, states, actions, app: [...refs] };
}

/** Attributes and props bound to state read it: `disabled={disabled}`, or Solid's `disabled={disabled()}`. */
const bindState = <T extends Attr | Prop>(items: T[], read: (state: string) => string): T[] =>
  items.map(item => (item.state ? { ...item, ref: read(item.state) } : item));

/** The frameworks' import of the app's identifiers. */
const appImport = (p: Plan, indent = ''): string =>
  p.example?.app.length ? `${indent}import { ${p.example.app.join(', ')} } from './app';\n` : '';

/** Declaration children and their own, depth first. */
const everyChild = (children: Child[]): Child[] => children.flatMap(child => [child, ...everyChild(child.children)]);

/** Frameworks import each icon (`editIcon`) instead of inlining SVG in attributes; an app identifier is used as it is. */
function hoist(meta: ElementMeta, p: Plan, indent = ''): string {
  const icons = createIconNamer();
  const name = (attr: Attr, fallback: string) => {
    const app = appName(attr.value);
    if (app) attr.ref = app;
    else if (isMarkup(attr.value)) attr.ref = icons.name(attr.value, fallback);
  };
  for (const attr of p.trigger?.attrs ?? []) name(attr, `${p.trigger!.element}-${attr.name}`);
  for (const attr of p.attrs) name(attr, `${meta.name}-${attr.name}`);
  for (const child of everyChild(p.children)) {
    const base = String(child.attrs.find(a => a.name === 'value')?.value ?? meta.children!.name);
    for (const attr of child.attrs) name(attr, `${base}-${attr.name}`);
  }
  for (const child of p.slotted) {
    for (const attr of child.attrs) name(attr, `${child.element}-${attr.name}`);
  }
  return icons.imports(indent) + icons.declarations(indent);
}

/** The event two-way binding follows: the live `input` or `change`, else the element's first. */
const modelEvent = (meta: ElementMeta): string | undefined =>
  meta.events.find(event => event === 'input' || event === 'change') ?? meta.events[0];

/** The event the HTML logs: the model's, or with open state (which its own events follow) the element's other one. */
const logEvent = (meta: ElementMeta): string | undefined =>
  meta.open ? meta.events.find(event => ![...openEvents(meta), ...(meta.states ?? []).flatMap(state => state.events), 'cancel'].includes(event)) : modelEvent(meta);

/** The trigger's text before the model value it shows, if it shows one. */
const shownText = (meta: ElementMeta, p: Plan): string | undefined =>
  p.trigger && meta.trigger?.shows !== undefined && p.model ? `${p.trigger.text}${meta.trigger.shows}` : undefined;

/** Whether the trigger opens the element on click, rather than the element listening to it (the menu's anchor). */
const triggerOpens = (meta: ElementMeta, p: Plan): boolean => !!p.trigger && p.open !== undefined && !meta.trigger?.for;

const omittedNote = (p: Plan, comment: (text: string) => string): string =>
  p.omitted.length ? `${comment(`Not yet exposed by the element: ${p.omitted.join(', ')}.`)}\n` : '';

/** The frameworks name the calls the HTML script makes: the element is theirs to reach, through a ref. */
const callsNote = (meta: ElementMeta, p: Plan, comment: (text: string) => string): string =>
  p.calls.length ? `${comment(`Once mounted, call ${p.calls.map(c => `${hostVariable(meta)}.${c.method}(${c.argument === undefined ? '' : literal(c.argument)})`).join(' and ')} on the element.`)}\n` : '';

/** HTML attributes; an imported icon (`ref`) is set by the script instead. */
const htmlAttrs = (attrs: Attr[]): string =>
  attrs.filter(a => !a.ref && !a.unset).map(a => (a.value === true ? ` ${a.name}` : ` ${a.name}="${escapeAttr(String(a.value))}"`)).join('');

/** JSX / Svelte props: camelCase, booleans bare, numbers in braces. React takes `style` as an object. */
const jsxAttrs = (attrs: Attr[], react = false): string =>
  attrs.map(a => {
    const name = camel(a.name);
    if (react && a.name === 'style') return ` style={{ ${String(a.value).split('; ').map(rule => rule.replace(/^([\w-]+): (.*)$/, (_, p: string, v: string) => `${camel(p)}: ${quoteJs(v).replaceAll('"', "'")}`)).join(', ')} }}`;
    if (a.ref) return ` ${name}={${a.ref}}`;
    if (a.value === true) return ` ${name}`;
    // A string attribute takes no escapes, and Svelte reads braces in it: such a value is an expression.
    if (typeof a.value === 'number' || /["\\{}]/.test(a.value)) return ` ${name}={${typeof a.value === 'number' ? a.value : quoteJs(a.value)}}`;
    return ` ${name}=${quoteJs(a.value)}`;
  }).join('');

/**
 * Svelte takes `slot="…"` on a component's child as the component's own named
 * slot: spread, it reaches the element as an attribute.
 */
const svelteAttrs = (attrs: Attr[]): string => {
  const slot = attrs.find(a => a.name === 'slot');
  return `${slot ? ` {...{ slot: ${quoteJs(String(slot.value)).replaceAll('"', "'")} }}` : ''}${jsxAttrs(attrs.filter(a => a !== slot))}`;
};

/** Vue props: kebab-case attributes, numbers bound. */
const vueAttrs = (attrs: Attr[]): string =>
  attrs.map(a => (a.ref ? ` :${a.name}="${a.ref}"` : a.value === true ? ` ${a.name}` : typeof a.value === 'number' ? ` :${a.name}="${a.value}"` : ` ${a.name}="${escapeAttr(a.value)}"`)).join('');

/** Live properties as JSX / Svelte props: `true` bare, anything else in braces. */
const jsxProps = (props: Prop[]): string =>
  props.map(p => (p.ref ? ` ${p.name}={${p.ref}}` : p.value === true ? ` ${p.name}` : ` ${p.name}={${literal(p.value)}}`)).join('');

/** Live properties as Vue props, bound so booleans and numbers keep their type. */
const vueProps = (props: Prop[]): string =>
  props.map(p => (p.ref ? ` :${kebab(p.name)}="${p.ref}"` : p.value === true ? ` ${kebab(p.name)}` : ` :${kebab(p.name)}="${escapeAttr(literal(p.value)).replaceAll('&quot;', "'")}"`)).join('');

const kebab = (name: string): string => name.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);

const literal = (value: unknown): string => (typeof value === 'string' ? quoteJs(value) : JSON.stringify(value));

const element = (name: string, attributes: string, body: string): string =>
  body ? `<${name}${attributes}>${body}</${name}>` : `<${name}${attributes} />`;

/**
 * The element's content, as each framework writes it: the declaration children,
 * or the slotted children around the text. Text alone stays on the tag's line.
 */
interface Markup {
  /** A declaration child's tag and attributes: `<m-tab>`, `<Tab>`; HTML never closes a tag itself. */
  child: { tag: string; attrs: (attrs: Attr[]) => string; html?: boolean };
  /** A slotted child: `<m-button slot="actions">`, `<img slot="media">`. */
  slotted: (child: Slotted) => string;
  /** Text content bound to state, as the framework reads it: `{text}`. */
  text?: (state: string) => string;
}

/** A declaration child; one with children of its own (a submenu) has its text on a line before them. */
function childMarkup(markup: Markup['child'], child: Child): string {
  const { tag } = markup;
  const attrs = markup.attrs(child.attrs);
  if (!child.children.length) return markup.html ? `<${tag}${attrs}>${escapeText(child.text)}</${tag}>` : element(tag, attrs, escapeText(child.text));
  const lines = [...(child.text ? [escapeText(child.text)] : []), ...child.children.map(nested => childMarkup(markup, nested))];
  return `<${tag}${attrs}>${lines.map(line => `\n  ${line.replaceAll('\n', '\n  ')}`).join('')}\n</${tag}>`;
}

function content(p: Plan, markup: Markup, indent: string, closing: string): string {
  const text = p.textState && markup.text ? markup.text(p.textState) : p.text !== undefined && p.text !== '' ? escapeText(p.text) : undefined;
  const lines = [
    ...p.slotted.filter(s => !s.after).map(markup.slotted),
    ...(text !== undefined ? [text] : []),
    ...p.children.map(c => childMarkup(markup.child, c)),
    ...p.slotted.filter(s => s.after).map(markup.slotted),
  ];
  if ((p.text !== undefined || p.textState) && !p.slotted.length && !p.children.length) return text ?? '';
  return lines.length ? `${lines.map(line => `\n${indent}${line.replaceAll('\n', `\n${indent}`)}`).join('')}\n${closing}` : '';
}

/** The framework components a plan renders, host first: `Tabs`, `Tab`, `IconButton`. */
const componentNames = (meta: ElementMeta, p: Plan, name: (element: string) => string): string[] =>
  [...new Set([meta.name, ...(meta.children && p.children.length ? [meta.children.name] : []),
    ...p.slotted.filter(s => !s.native).map(s => s.element), ...(p.trigger && !p.trigger.native ? [p.trigger.element] : [])].map(name))];

/**
 * The playground's theme and mode; or a docs example, which leaves out the setup
 * (styles, theme, registering the elements: the framework guides have it) and adds
 * its handlers and actions.
 */
export type CodeContext = { theme: string; mode: string; example?: undefined } | { theme?: undefined; mode?: undefined; example: ExampleParts };

const styleImports = (context: CodeContext): string =>
  context.example ? '' : `import 'mtrl/styles/base';\n${context.theme === 'baseline' ? '' : `import 'mtrl/themes/${context.theme}';\n`}`;

/** The HTML selector of a slotted child, by its slot and name. */
const slottedSelector = (child: Slotted): string => {
  const slot = child.attrs.find(a => a.name === 'slot')?.value;
  const label = child.attrs.find(a => a.name === 'aria-label')?.value;
  return `${child.native ? child.element : `m-${child.element}`}${slot === undefined ? '' : `[slot="${String(slot)}"]`}${label === undefined ? '' : `[aria-label="${escapeAttr(String(label))}"]`}`;
};

function html(meta: ElementMeta, p: Plan, context: CodeContext): string {
  const tag = `m-${meta.name}`;
  // First: naming the icons marks the attributes the script sets instead of the markup.
  const icons = hoist(meta, p, '  ');
  const modelValue = Array.isArray(p.model?.value) ? p.model.value.join(',') : p.model?.value;
  const modelAttr = p.model && modelValue !== false && modelValue !== undefined && modelValue !== ''
    ? (modelValue === true ? ` ${p.model.name}` : ` ${p.model.name}="${escapeAttr(String(modelValue))}"`) : '';
  const childName = meta.children ? `m-${meta.children.name}` : '';
  const body = content(p, {
    child: { tag: childName, attrs: htmlAttrs, html: true },
    slotted: child => (child.native ? (child.text ? `<${child.element}${htmlAttrs(child.attrs)}>${escapeText(child.text)}</${child.element}>` : `<${child.element}${htmlAttrs(child.attrs)}>`)
      : `<m-${child.element}${htmlAttrs(child.attrs)}>${escapeText(child.text)}</m-${child.element}>`),
  }, '  ', '');
  const variable = hostVariable(meta);
  const event = logEvent(meta);
  const iconAttrs = p.attrs.filter(a => a.ref).map(a => `  ${variable}.setAttribute('${a.name}', ${a.ref});\n`).join('') +
    everyChild(p.children).flatMap(c => c.attrs.filter(a => a.ref).map(a => {
      const value = c.attrs.find(v => v.name === 'value')?.value;
      const selector = `${childName}${value === undefined ? '' : `[value="${String(value)}"]`}`;
      return `  ${variable}.querySelector('${selector}').setAttribute('${a.name}', ${a.ref});\n`;
    })).join('') +
    p.slotted.flatMap(c => c.attrs.filter(a => a.ref).map(a => `  ${variable}.querySelector('${slottedSelector(c)}').setAttribute('${a.name}', ${a.ref});\n`)).join('');
  const triggerIcons = (p.trigger?.attrs ?? []).filter(a => a.ref).map(a => `  document.querySelector('#${p.trigger!.id}').setAttribute('${a.name}', ${a.ref});\n`).join('');
  // Open state: the trigger opens the element, a closing child closes it, and one that starts
  // open without the attribute is shown.
  const setOpen = (value: boolean): string => {
    const method = value ? meta.open?.show : meta.open?.hide;
    return method ? `${variable}.${method}()` : `${variable}.${openName(meta)} = ${value}`;
  };
  const onClick = (value: boolean): string => (value ? meta.open?.show : meta.open?.hide) ? setOpen(value) : `{ ${setOpen(value)}; }`;
  const opening = triggerOpens(meta, p) ? `  document.querySelector('#${p.trigger!.id}').addEventListener('click', () => ${onClick(true)});\n` : '';
  const closers = [...new Set(p.slotted.filter(c => c.closes).map(slottedSelector))];
  const closing = closers.map(selector => `  ${variable}.querySelectorAll('${selector}').forEach((child) => child.addEventListener('click', () => ${onClick(false)}));\n`).join('');
  const openAttr = (p.open && meta.attributes[openName(meta)] ? ` ${openName(meta)}` : '') +
    p.states.filter(state => state.value && meta.attributes[state.name]).map(state => ` ${state.name}`).join('');
  const startOpen = p.open && !meta.attributes[openName(meta)] ? `  ${setOpen(true)};\n` : '';
  // A trigger showing the model value follows it; the element's events are otherwise logged.
  const shown = shownText(meta, p);
  const handler = shown !== undefined ? `document.querySelector('#${p.trigger!.id}').textContent = ${quoteJs(shown)} + event.detail.${p.model!.name};` : 'console.log(event.detail);';
  const hostLine = `  const ${variable} = document.querySelector('${tag}');\n`;
  const props = p.props.map(prop => `  ${variable}.${prop.name} = ${literal(prop.value)};\n`).join('');
  const calls = p.calls.map(call => `  ${variable}.${call.method}(${call.argument === undefined ? '' : literal(call.argument)});\n`).join('');
  // Children's icons are set before the elements are defined: a parent reads complete
  // children when it upgrades (a rail leaves out an item without an icon, and its
  // `value` with it).
  const early = iconAttrs && p.children.some(c => c.attrs.some(a => a.ref));
  const host = !early && (event || p.props.length || iconAttrs || p.calls.length || opening || closing || startOpen) ? `\n${hostLine}` : '';
  const triggerText = escapeText(shown !== undefined ? `${shown}${String(modelValue ?? '')}` : p.trigger?.text ?? '');
  const trigger = p.trigger
    ? `${p.trigger.native ? `<${p.trigger.element}${htmlAttrs(p.trigger.attrs)}>${triggerText}</${p.trigger.element}>` : `<m-${p.trigger.element}${htmlAttrs(p.trigger.attrs)}>${triggerText}</m-${p.trigger.element}>`}\n` : '';
  const markup = `${trigger}<${tag}${modelAttr}${openAttr}${htmlAttrs(p.attrs)}>${body}</${tag}>\n`;
  if (p.example) {
    // The markup, then the script it needs: the element is defined where the app sets up.
    const { handlers, actions } = p.example;
    const listeners = (shown !== undefined ? `  ${variable}.addEventListener('${event}', (event) => {\n    ${handler}\n  });\n` : '') +
      handlers.map(h => `  ${variable}.addEventListener('${h.event}', (${readsPayload(h) ? 'event' : ''}) => ${handlerCall(h, field => `event.detail.${field}`)});\n`).join('');
    const functions = actions.map(action => `\n  function ${action.name}() {\n${action.steps.map(step => `    ${step.html}\n`).join('')}  }\n`).join('');
    const hosted = iconAttrs + props + opening + closing + startOpen + calls + listeners + functions;
    const script = triggerIcons + (hosted ? hostLine + hosted : '');
    return `${markup}${script ? `\n<script type="module">\n${script}</script>\n` : ''}`;
  }
  return `<script type="module">\n  ${styleImports(context).trim().replaceAll('\n', '\n  ')}\n  import 'mtrl/elements/css';\n  import { defineAll } from 'mtrl/elements';\n${icons ? `\n${icons}` : ''}\n` +
    (early ? `${hostLine}${iconAttrs}\n` : '') + `  defineAll();\n` +
    `  document.documentElement.dataset.theme = '${context.theme}';\n  document.documentElement.dataset.themeMode = '${context.mode}';\n` +
    (triggerIcons ? `\n${triggerIcons}` : '') +
    host + (early ? '' : iconAttrs) + props + opening + closing + startOpen + calls +
    (event ? `  ${variable}.addEventListener('${event}', (event) => {\n    ${handler}\n  });\n` : '') +
    `</script>\n\n${omittedNote(p, t => `<!-- ${t} -->`)}${markup}`;
}

/** What each framework writes for a state (`open`): its value, the handler setting it (or several), and how a prop and an event are named. */
interface OpenSyntax {
  read: (state: string) => string;
  set: (state: string | string[], value: boolean) => string;
  prop: (name: string, value: string) => string;
  on: (event: string, handler: string) => string;
  /** A handler setting the state and running an example's calls, which read the payload through `detail`. */
  run: (state: string, value: boolean, calls: string[], payload: boolean) => string;
  detail: (field: string) => string;
}
const reactOpen = (solid: boolean): OpenSyntax => ({
  read: state => (solid ? `${state}()` : state),
  set: (state, value) => (typeof state === 'string' ? `() => set${pascal(state)}(${value})`
    : `() => { ${state.map(name => `set${pascal(name)}(${value});`).join(' ')} }`),
  prop: (name, value) => ` ${name}={${value}}`,
  on: (event, handler) => ` on${pascal(event)}={${handler}}`,
  run: (state, value, calls, payload) => arrow(payload, [`set${pascal(state)}(${value})`, ...calls]),
  detail: field => `event.detail.${field}`,
});
const vueOpen: OpenSyntax = {
  read: state => state,
  set: (state, value) => [state].flat().map(name => `${name} = ${value}`).join('; '),
  prop: (name, value) => ` :${kebab(name)}="${value}"`,
  on: (event, handler) => ` @${event}="${handler}"`,
  run: (state, value, calls) => escapeAttr([`${state} = ${value}`, ...calls].join('; ')),
  detail: field => `$event.detail.${field}`,
};
const svelteOpen: OpenSyntax = {
  read: state => state,
  set: (state, value) => (typeof state === 'string' ? `() => (${state} = ${value})`
    : `() => { ${state.map(name => `${name} = ${value};`).join(' ')} }`),
  prop: (name, value) => ` ${name}={${value}}`,
  on: (event, handler) => ` on${event}={${handler}}`,
  run: (state, value, calls, payload) => arrow(payload, [`${state} = ${value}`, ...calls]),
  detail: field => `event.detail.${field}`,
};

/** The events the open state's bindings handle: an example's handlers on them run inside those. */
const openBound = (meta: ElementMeta, p: Plan): Set<string> => p.open === undefined ? new Set()
  : new Set([...(meta.trigger?.for ? [openEvents(meta)[0]] : []), openEvents(meta)[1], ...p.states.flatMap(state => state.events)]);

/** An example's handlers the frameworks write as props of their own: those the open state does not handle. */
const ownHandlers = (meta: ElementMeta, p: Plan): ExampleHandler[] =>
  (p.example?.handlers ?? []).filter(h => !openBound(meta, p).has(h.event));

/**
 * The host's open state: bound one way, set back when it closes, and when it opens
 * itself from its trigger (the menu's anchor). Other state follows both its events.
 */
const openProps = (meta: ElementMeta, p: Plan, s: OpenSyntax): string => {
  if (p.open === undefined) return '';
  const name = openName(meta);
  const [opened, closed] = openEvents(meta);
  const setting = (event: string, state: string, value: boolean): string => {
    const handlers = (p.example?.handlers ?? []).filter(h => h.event === event);
    return s.on(event, handlers.length ? s.run(state, value, handlers.map(h => handlerCall(h, s.detail)), handlers.some(readsPayload)) : s.set(state, value));
  };
  return `${s.prop(name, s.read(name))}${meta.trigger?.for ? setting(opened, name, true) : ''}${setting(closed, name, false)}` +
    p.states.map(state => `${s.prop(state.name, s.read(state.name))}${setting(state.events[0], state.name, true)}${setting(state.events[1], state.name, false)}`).join('');
};

/** A click on the trigger opens the element, with the state it opens in (the bottom sheet expanded); one on a closing child closes it. */
function clickOpens(meta: ElementMeta, p: Plan, s: OpenSyntax, value: boolean): string {
  if (!(value ? triggerOpens(meta, p) : p.open !== undefined)) return '';
  const also = value ? p.states.filter(state => state.opens).map(state => state.name) : [];
  return s.on('click', s.set(also.length ? [openName(meta), ...also] : openName(meta), value));
}

/** The states a framework declares, open first, with their first values. */
const stateValues = (meta: ElementMeta, p: Plan): { name: string; value: boolean }[] =>
  p.open === undefined ? [] : [{ name: openName(meta), value: p.open }, ...p.states];

/** The trigger's text, with the model value it shows as this expression. */
const triggerBody = (meta: ElementMeta, p: Plan, expression: string): string => {
  const shown = shownText(meta, p);
  return shown === undefined ? escapeText(p.trigger!.text) : `${escapeText(shown)}${expression}`;
};

/** A handler's function: `(event) => …` when it reads the payload; several calls in a block. */
const arrow = (payload: boolean, calls: string[]): string =>
  `(${payload ? 'event' : ''}) => ${calls.length === 1 ? calls[0] : `{ ${calls.join('; ')}; }`}`;

/** An example's action, as a function of the framework's statements. */
const actionFunction = (name: string, statements: string[], indent: string, arrowFunction: boolean): string =>
  arrowFunction && statements.length === 1 ? `${indent}const ${name} = () => ${statements[0]};\n`
    : arrowFunction ? `${indent}const ${name} = () => {\n${statements.map(line => `${indent}  ${line};\n`).join('')}${indent}};\n`
    : `${indent}function ${name}() {\n${statements.map(line => `${indent}  ${line};\n`).join('')}${indent}}\n`;

/** An example's own state, typed when it has no first value. */
const exampleStates = (p: Plan, declare: (name: string, value: string, type: string) => string): string =>
  (p.example?.states ?? []).map(state => declare(state.name, state.value === undefined ? '' : jsValue(state.value), state.value === undefined ? '<string>' : '')).join('');

function reactOrSolid(meta: ElementMeta, p: Plan, context: CodeContext, solid: boolean): string {
  const Name = pascal(meta.name);
  const Child = meta.children ? pascal(meta.children.name) : '';
  const constants = hoist(meta, p);
  const lib = solid ? 'solid' : 'react';
  const event = modelEvent(meta);
  const state = p.model ? p.model.name : '';
  const setter = `set${pascal(state)}`;
  const reads = (name: string) => (solid ? `${name}()` : name);
  const read = reads(state);
  const hook = solid ? 'createSignal' : 'useState';
  const syntax = reactOpen(solid);
  const stateful = p.model || p.open !== undefined || p.example?.states.length;
  const imports = `${stateful ? `import { ${hook} } from '${solid ? 'solid-js' : 'react'}';\n` : ''}import { ${componentNames(meta, p, pascal).join(', ')} } from 'mtrl/${lib}';\n${appImport(p)}${styleImports(context)}`;
  // The model's event sets it; an example's handlers on that event run beside.
  const events = new Map<string, { payload: boolean; calls: string[] }>();
  const on = (name: string, payload: boolean, call: string) => {
    const entry = events.get(name) ?? { payload: false, calls: [] };
    entry.payload ||= payload;
    entry.calls.push(call);
    events.set(name, entry);
  };
  if (p.model) on(event ?? 'change', true, `${setter}(event.detail.${state})`);
  for (const h of ownHandlers(meta, p)) on(h.event, readsPayload(h), handlerCall(h, field => `event.detail.${field}`));
  const modelProps = (p.model ? ` ${state}={${read}}` : '') + [...events].map(([name, e]) => ` on${pascal(name)}={${arrow(e.payload, e.calls)}}`).join('');
  // Beside a trigger, the host is in a fragment, a level deeper.
  const depth = p.trigger ? '  ' : '';
  const body = content(p, {
    child: { tag: Child, attrs: attrs => jsxAttrs(attrs) },
    slotted: child => element(child.native ? child.element : pascal(child.element), `${jsxAttrs(child.attrs, !solid)}${child.closes ? clickOpens(meta, p, syntax, false) : ''}`, escapeText(child.text)),
    text: name => `{${reads(name)}}`,
  }, `      ${depth}`, `    ${depth}`);
  const host = element(Name, `${modelProps}${openProps(meta, p, syntax)}${jsxAttrs(bindState(p.attrs, reads), !solid)}${jsxProps(bindState(p.props, reads))}`, body);
  const trigger = p.trigger
    ? element(p.trigger.native ? p.trigger.element : pascal(p.trigger.element), `${jsxAttrs(p.trigger.attrs, !solid)}${clickOpens(meta, p, syntax, true)}`, triggerBody(meta, p, `{${read}}`)) : '';
  const actions = (p.example?.actions ?? []).map(action => actionFunction(action.name, action.steps.map(step => `set${pascal(step.state)}(${jsValue(step.value)})`), '  ', true)).join('');
  return `${imports}\n${constants ? `${constants}\n` : ''}${omittedNote(p, t => `// ${t}`)}${callsNote(meta, p, t => `// ${t}`)}export function Example() {\n` +
    (p.model ? `  const [${state}, ${setter}] = ${hook}(${literal(p.model.value)});\n` : '') +
    stateValues(meta, p).map(state => `  const [${state.name}, set${pascal(state.name)}] = ${hook}(${state.value});\n`).join('') +
    exampleStates(p, (name, value, type) => `  const [${name}, set${pascal(name)}] = ${hook}${type}(${value});\n`) +
    (actions ? `${actions}\n` : '') +
    (trigger ? `  return (\n    <>\n      ${trigger}\n      ${host}\n    </>\n  );\n}\n` : `  return (\n    ${host}\n  );\n}\n`);
}

function vue(meta: ElementMeta, p: Plan, context: CodeContext): string {
  const Name = `M${pascal(meta.name)}`;
  const Child = meta.children ? `M${pascal(meta.children.name)}` : '';
  const constants = hoist(meta, p);
  const body = content(p, {
    child: { tag: Child, attrs: vueAttrs },
    slotted: child => element(child.native ? child.element : `M${pascal(child.element)}`, `${vueAttrs(child.attrs)}${child.closes ? clickOpens(meta, p, vueOpen, false) : ''}`, escapeText(child.text)),
    text: name => `{{ ${name} }}`,
  }, '    ', '  ');
  const model = p.model ? ` v-model="${p.model.name}"` : '';
  const handlers = ownHandlers(meta, p).map(h => ` @${h.event}="${escapeAttr(handlerCall(h, field => `$event.detail.${field}`))}"`).join('');
  const tag = element(Name, `${model}${handlers}${openProps(meta, p, vueOpen)}${vueAttrs(bindState(p.attrs, name => name))}${vueProps(bindState(p.props, name => name))}`, body);
  const trigger = p.trigger
    ? `  ${element(p.trigger.native ? p.trigger.element : `M${pascal(p.trigger.element)}`, `${vueAttrs(p.trigger.attrs)}${clickOpens(meta, p, vueOpen, true)}`, triggerBody(meta, p, `{{ ${p.model?.name} }}`))}\n` : '';
  const state = p.model || p.open !== undefined || p.example?.states.length;
  const actions = (p.example?.actions ?? []).map(action => actionFunction(action.name, action.steps.map(step => `${step.state}.value = ${jsValue(step.value)}`), '', false)).join('');
  return `<script setup lang="ts">\n${state ? `import { ref } from 'vue';\n` : ''}import { ${componentNames(meta, p, name => `M${pascal(name)}`).join(', ')} } from 'mtrl/vue';\n${appImport(p)}${styleImports(context)}` +
    (state || constants || actions ? '\n' : '') + constants + (constants && state ? '\n' : '') +
    (p.model ? `const ${p.model.name} = ref(${literal(p.model.value)});\n` : '') +
    stateValues(meta, p).map(state => `const ${state.name} = ref(${state.value});\n`).join('') +
    exampleStates(p, (name, value, type) => `const ${name} = ref${type}(${value});\n`) +
    (actions ? `${state ? '\n' : ''}${actions}` : '') +
    `</script>\n\n<template>\n${omittedNote(p, t => `  <!-- ${t} -->`)}${callsNote(meta, p, t => `  <!-- ${t} -->`)}${trigger}  ${tag}\n</template>\n`;
}

function svelte(meta: ElementMeta, p: Plan, context: CodeContext): string {
  const Child = meta.children ? pascal(meta.children.name) : '';
  const constants = hoist(meta, p, '  ');
  const body = content(p, {
    child: { tag: Child, attrs: attrs => jsxAttrs(attrs) },
    slotted: child => element(child.native ? child.element : pascal(child.element), `${svelteAttrs(child.attrs)}${child.closes ? clickOpens(meta, p, svelteOpen, false) : ''}`, escapeText(child.text)),
    text: name => `{${name}}`,
  }, '  ', '');
  const model = p.model ? ` bind:${p.model.name}` : '';
  const handlers = ownHandlers(meta, p).map(h => ` on${h.event}={${arrow(readsPayload(h), [handlerCall(h, field => `event.detail.${field}`)])}}`).join('');
  const trigger = p.trigger
    ? `${element(p.trigger.native ? p.trigger.element : pascal(p.trigger.element), `${jsxAttrs(p.trigger.attrs)}${clickOpens(meta, p, svelteOpen, true)}`, triggerBody(meta, p, `{${p.model?.name}}`))}\n` : '';
  const state = p.model || p.open !== undefined || p.example?.states.length;
  const actions = (p.example?.actions ?? []).map(action => actionFunction(action.name, action.steps.map(step => `${step.state} = ${jsValue(step.value)}`), '  ', false)).join('');
  const styles = styleImports(context);
  return `<script lang="ts">\n  import { ${componentNames(meta, p, pascal).join(', ')} } from 'mtrl/svelte';\n${appImport(p, '  ')}${styles ? `  ${styles.trim().replaceAll('\n', '\n  ')}\n` : ''}` +
    (state || constants || actions ? '\n' : '') + constants + (constants && state ? '\n' : '') +
    (p.model ? `  let ${p.model.name} = $state(${literal(p.model.value)});\n` : '') +
    stateValues(meta, p).map(state => `  let ${state.name} = $state(${state.value});\n`).join('') +
    exampleStates(p, (name, value, type) => `  let ${name} = $state${type}(${value});\n`) +
    (actions ? `${state ? '\n' : ''}${actions}` : '') +
    `</script>\n\n${omittedNote(p, t => `<!-- ${t} -->`)}${callsNote(meta, p, t => `<!-- ${t} -->`)}${trigger}${element(pascal(meta.name), `${model}${handlers}${openProps(meta, p, svelteOpen)}${jsxAttrs(bindState(p.attrs, name => name))}${jsxProps(bindState(p.props, name => name))}`, body)}\n`;
}

/** The component's code in a framework other than vanilla. */
export function frameworkCode(framework: Exclude<Framework, 'vanilla'>, meta: ElementMeta, config: Config, context: CodeContext): string {
  const p = plan(meta, config);
  if (context.example) {
    p.example = bindExample(meta, p, config, context.example);
    // An example renders in every framework, or it fails.
    if (p.omitted.length) throw new Error(`<m-${meta.name}> does not take ${p.omitted.join(', ')}`);
    if (p.calls.length) throw new Error(`<m-${meta.name}> needs ${p.calls.map(c => `${c.method}()`).join(' and ')} called once mounted, which the frameworks cannot say`);
  }
  switch (framework) {
    case 'html': return html(meta, p, context);
    case 'react': return reactOrSolid(meta, p, context, false);
    case 'solid': return reactOrSolid(meta, p, context, true);
    case 'vue': return vue(meta, p, context);
    case 'svelte': return svelte(meta, p, context);
  }
}
