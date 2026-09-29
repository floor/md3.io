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
  { id: 'html', label: 'HTML', language: 'xml' },
  { id: 'react', label: 'React', language: 'typescript' },
  { id: 'vue', label: 'Vue', language: 'xml' },
  { id: 'svelte', label: 'Svelte', language: 'xml' },
  { id: 'solid', label: 'Solid', language: 'typescript' },
  { id: 'vanilla', label: 'Vanilla', language: 'javascript' },
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
}

/** A config key the element's spec does not map, or maps otherwise. */
export interface ConfigKey {
  /** Written as this attribute. */
  attribute?: string;
  /** Config values (as strings) to attribute values: `true` is a bare attribute, a value not listed writes nothing. */
  values?: Record<string, string | true>;
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
}

type Config = Record<string, unknown>;
type Attr = { name: string; value: string | number | true; ref?: string };
/** A live property: set in script for HTML, a prop in the frameworks. */
type Prop = { name: string; value: string | number | boolean };
/** A child element in one of the parent's slots. */
type Slotted = { element: string; native: boolean; attrs: Attr[]; text: string; after: boolean };

const camel = (name: string): string => name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
const pascal = (name: string): string => camel(name).replace(/^./, c => c.toUpperCase());
const escapeAttr = (value: string): string => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const escapeText = (value: string): string => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
const quoteJs = (value: string): string => JSON.stringify(value);

interface Plan {
  attrs: Attr[];
  /** The model property and its initial value, when the config sets it. */
  model?: { name: string; value: unknown };
  props: Prop[];
  text?: string;
  children: { attrs: Attr[]; text: string }[];
  slotted: Slotted[];
  /** Methods the element is called with once it is there. */
  calls: { method: string; argument?: unknown }[];
  /** Config options the element does not expose yet: named in a comment, never dropped silently. */
  omitted: string[];
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

function plan(meta: ElementMeta, config: Config): Plan {
  const used = new Set<string>();
  const attrs: Attr[] = [];
  // One attribute can be written from several keys (list's `selection`): the last one set wins.
  const setAttr = (name: string, value: string | number | true) => {
    const at = attrs.findIndex(a => a.name === name);
    if (at === -1) attrs.push({ name, value }); else attrs[at] = { name, value };
  };
  let model: Plan['model'];
  const attributes = meta.form && !meta.attributes.name
    ? { name: { type: 'string' as const, config: 'name' }, ...meta.attributes } : meta.attributes;
  for (const [name, attribute] of Object.entries(attributes)) {
    if (!attribute.config || !(attribute.config in config)) continue;
    used.add(attribute.config);
    const raw = config[attribute.config];
    if (meta.model && camel(name) === meta.model) {
      if (raw !== undefined) model = { name: meta.model, value: raw };
      continue;
    }
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
      used.add(path);
      const value = key.values ? key.values[String(raw)] : valueOf(meta.attributes[key.attribute]?.type ?? 'string', raw);
      if (value !== undefined) setAttr(key.attribute, value);
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
  const children: Plan['children'] = [];
  const childOmitted: string[] = [];
  const omit = (name: string) => { if (!childOmitted.includes(name)) childOmitted.push(name); };
  const kids = meta.children;
  if (kids && Array.isArray(config[kids.from])) {
    used.add(kids.from);
    // Each attribute's item key: its camelCase name, unless an item key is named otherwise.
    const itemKeys: Record<string, string> = Object.fromEntries(Object.keys(kids.attributes).map(name => [name, camel(name)]));
    for (const [key, name] of Object.entries(kids.keys ?? {})) itemKeys[name] = key;
    const texts = [kids.text].flat();
    const known = new Set([...Object.values(itemKeys), ...texts, ...Object.keys(kids.typed ?? {}), ...Object.keys(kids.counted ?? {}),
      ...(kids.selected ? [kids.selected.key] : [])]);
    const chosen: string[] = [];
    let selectable = false;
    for (const item of config[kids.from] as Config[]) {
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
        else omit(`${kids.from}[].${key} (${String(slot.type)})`);
      }
      for (const [key, parts] of Object.entries(kids.counted ?? {})) {
        if (item[key] !== undefined && item[key] !== 1 + parts.filter(part => isSet(item[part])).length) omit(`${kids.from}[].${key}`);
      }
      const textKey = texts.find(key => item[key] !== undefined);
      children.push({ attrs: childAttrs, text: textKey ? String(item[textKey]) : '' });
      for (const [key, value] of Object.entries(item)) {
        if (!known.has(key) && isSet(value)) omit(`${kids.from}[].${key}`);
      }
      if (kids.selected && kids.selected.key in item) {
        selectable = true;
        if (item[kids.selected.key] === kids.selected.equals) chosen.push(String(item[kids.selected.value]));
      }
    }
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
  const slotted: Slotted[] = [];
  for (const entry of meta.slotted ?? []) {
    const raw = config[entry.from];
    if (raw === undefined || raw === null) continue;
    used.add(entry.from);
    const path = Array.isArray(raw) ? `${entry.from}[]` : entry.from;
    for (const item of [raw].flat()) {
      if (!isRecord(item)) continue;
      const childAttrs: Attr[] = entry.slot ? [{ name: 'slot', value: entry.slot }] : [];
      let childText = '';
      for (const [key, value] of Object.entries(item)) {
        if (key === entry.text) childText = String(value ?? '');
        else if (entry.attributes[key]) {
          const written = plainValue(value);
          if (written !== undefined) childAttrs.push({ name: entry.attributes[key]!, value: written });
        } else if (isSet(value) && !(entry.ignore?.[key] as unknown[] | undefined)?.includes(value)) omit(`${path}.${key}`);
      }
      slotted.push({ element: entry.element, native: !!entry.native, attrs: childAttrs, text: childText, after: !!entry.after });
    }
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
  return { attrs, model, props, text, children, slotted, calls, omitted: omitted.concat(childOmitted) };
}

/** Frameworks import each icon (`editIcon`) instead of inlining SVG in attributes. */
function hoist(meta: ElementMeta, p: Plan, indent = ''): string {
  const icons = createIconNamer();
  for (const attr of p.attrs) {
    if (isMarkup(attr.value)) attr.ref = icons.name(attr.value, `${meta.name}-${attr.name}`);
  }
  for (const child of p.children) {
    const base = String(child.attrs.find(a => a.name === 'value')?.value ?? meta.children!.name);
    for (const attr of child.attrs) {
      if (isMarkup(attr.value)) attr.ref = icons.name(attr.value, `${base}-${attr.name}`);
    }
  }
  for (const child of p.slotted) {
    for (const attr of child.attrs) {
      if (isMarkup(attr.value)) attr.ref = icons.name(attr.value, `${child.element}-${attr.name}`);
    }
  }
  return icons.imports(indent) + icons.declarations(indent);
}

/** The event two-way binding follows: the live `input` or `change`, else the element's first. */
const modelEvent = (meta: ElementMeta): string | undefined =>
  meta.events.find(event => event === 'input' || event === 'change') ?? meta.events[0];

const omittedNote = (p: Plan, comment: (text: string) => string): string =>
  p.omitted.length ? `${comment(`Not yet exposed by the element: ${p.omitted.join(', ')}.`)}\n` : '';

/** The frameworks name the calls the HTML script makes: the element is theirs to reach, through a ref. */
const callsNote = (meta: ElementMeta, p: Plan, comment: (text: string) => string): string =>
  p.calls.length ? `${comment(`Once mounted, call ${p.calls.map(c => `${camel(meta.name)}.${c.method}(${c.argument === undefined ? '' : literal(c.argument)})`).join(' and ')} on the element.`)}\n` : '';

/** HTML attributes; an imported icon (`ref`) is set by the script instead. */
const htmlAttrs = (attrs: Attr[]): string =>
  attrs.filter(a => !a.ref).map(a => (a.value === true ? ` ${a.name}` : ` ${a.name}="${escapeAttr(String(a.value))}"`)).join('');

/** JSX / Svelte props: camelCase, booleans bare, numbers in braces. React takes `style` as an object. */
const jsxAttrs = (attrs: Attr[], react = false): string =>
  attrs.map(a => {
    const name = camel(a.name);
    if (react && a.name === 'style') return ` style={{ ${String(a.value).split('; ').map(rule => rule.replace(/^([\w-]+): (.*)$/, (_, p: string, v: string) => `${camel(p)}: ${quoteJs(v).replaceAll('"', "'")}`)).join(', ')} }}`;
    if (a.ref) return ` ${name}={${a.ref}}`;
    if (a.value === true) return ` ${name}`;
    return typeof a.value === 'number' ? ` ${name}={${a.value}}` : ` ${name}=${quoteJs(a.value)}`;
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
  props.map(p => (p.value === true ? ` ${p.name}` : ` ${p.name}={${literal(p.value)}}`)).join('');

/** Live properties as Vue props, bound so booleans and numbers keep their type. */
const vueProps = (props: Prop[]): string =>
  props.map(p => (p.value === true ? ` ${kebab(p.name)}` : ` :${kebab(p.name)}="${escapeAttr(literal(p.value)).replaceAll('&quot;', "'")}"`)).join('');

const kebab = (name: string): string => name.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);

const literal = (value: unknown): string => (typeof value === 'string' ? quoteJs(value) : JSON.stringify(value));

const element = (name: string, attributes: string, body: string): string =>
  body ? `<${name}${attributes}>${body}</${name}>` : `<${name}${attributes} />`;

/**
 * The element's content, as each framework writes it: the declaration children,
 * or the slotted children around the text. Text alone stays on the tag's line.
 */
interface Markup {
  /** A declaration child: `<m-tab>`, `<Tab>`. */
  child: (attrs: Attr[], text: string) => string;
  /** A slotted child: `<m-button slot="actions">`, `<img slot="media">`. */
  slotted: (child: Slotted) => string;
}
function content(p: Plan, markup: Markup, indent: string, closing: string): string {
  const lines = [
    ...p.slotted.filter(s => !s.after).map(markup.slotted),
    ...(p.text !== undefined && p.text !== '' ? [escapeText(p.text)] : []),
    ...p.children.map(c => markup.child(c.attrs, c.text)),
    ...p.slotted.filter(s => s.after).map(markup.slotted),
  ];
  if (p.text !== undefined && !p.slotted.length && !p.children.length) return escapeText(p.text);
  return lines.length ? `${lines.map(line => `\n${indent}${line}`).join('')}\n${closing}` : '';
}

/** The framework components a plan renders, host first: `Tabs`, `Tab`, `IconButton`. */
const componentNames = (meta: ElementMeta, p: Plan, name: (element: string) => string): string[] =>
  [...new Set([meta.name, ...(meta.children && p.children.length ? [meta.children.name] : []),
    ...p.slotted.filter(s => !s.native).map(s => s.element)].map(name))];

export interface CodeContext {
  theme: string;
  mode: string;
}

const styleImports = (context: CodeContext): string =>
  `import 'mtrl/styles/base';\n${context.theme === 'baseline' ? '' : `import 'mtrl/themes/${context.theme}';\n`}`;

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
  const body = content(p, {
    child: (attrs, text) => `<m-${meta.children!.name}${htmlAttrs(attrs)}>${escapeText(text)}</m-${meta.children!.name}>`,
    slotted: child => (child.native ? `<${child.element}${htmlAttrs(child.attrs)}>`
      : `<m-${child.element}${htmlAttrs(child.attrs)}>${escapeText(child.text)}</m-${child.element}>`),
  }, '  ', '');
  const event = modelEvent(meta);
  const variable = camel(meta.name);
  const iconAttrs = p.attrs.filter(a => a.ref).map(a => `  ${variable}.setAttribute('${a.name}', ${a.ref});\n`).join('') +
    p.children.flatMap(c => c.attrs.filter(a => a.ref).map(a => {
      const value = c.attrs.find(v => v.name === 'value')?.value;
      const selector = `m-${meta.children!.name}${value === undefined ? '' : `[value="${String(value)}"]`}`;
      return `  ${variable}.querySelector('${selector}').setAttribute('${a.name}', ${a.ref});\n`;
    })).join('') +
    p.slotted.flatMap(c => c.attrs.filter(a => a.ref).map(a => `  ${variable}.querySelector('${slottedSelector(c)}').setAttribute('${a.name}', ${a.ref});\n`)).join('');
  const hostLine = `  const ${variable} = document.querySelector('${tag}');\n`;
  const props = p.props.map(prop => `  ${variable}.${prop.name} = ${literal(prop.value)};\n`).join('');
  const calls = p.calls.map(call => `  ${variable}.${call.method}(${call.argument === undefined ? '' : literal(call.argument)});\n`).join('');
  // Children's icons are set before the elements are defined: a parent reads complete
  // children when it upgrades (a rail leaves out an item without an icon, and its
  // `value` with it).
  const early = iconAttrs && p.children.some(c => c.attrs.some(a => a.ref));
  const host = !early && (event || p.props.length || iconAttrs || p.calls.length) ? `\n${hostLine}` : '';
  return `<script type="module">\n  ${styleImports(context).trim().replaceAll('\n', '\n  ')}\n  import 'mtrl/elements/css';\n  import { defineAll } from 'mtrl/elements';\n${icons ? `\n${icons}` : ''}\n` +
    (early ? `${hostLine}${iconAttrs}\n` : '') + `  defineAll();\n` +
    `  document.documentElement.dataset.theme = '${context.theme}';\n  document.documentElement.dataset.themeMode = '${context.mode}';\n` +
    host + (early ? '' : iconAttrs) + props + calls +
    (event ? `  ${camel(meta.name)}.addEventListener('${event}', (event) => {\n    console.log(event.detail);\n  });\n` : '') +
    `</script>\n\n${omittedNote(p, t => `<!-- ${t} -->`)}<${tag}${modelAttr}${htmlAttrs(p.attrs)}>${body}</${tag}>\n`;
}

function reactOrSolid(meta: ElementMeta, p: Plan, context: CodeContext, solid: boolean): string {
  const Name = pascal(meta.name);
  const Child = meta.children ? pascal(meta.children.name) : '';
  const constants = hoist(meta, p);
  const lib = solid ? 'solid' : 'react';
  const event = modelEvent(meta);
  const state = p.model ? p.model.name : '';
  const setter = `set${pascal(state)}`;
  const read = solid ? `${state}()` : state;
  const hook = solid ? 'createSignal' : 'useState';
  const imports = `${p.model ? `import { ${hook} } from '${solid ? 'solid-js' : 'react'}';\n` : ''}import { ${componentNames(meta, p, pascal).join(', ')} } from 'mtrl/${lib}';\n${styleImports(context)}`;
  const modelProps = p.model ? ` ${state}={${read}} on${pascal(event ?? 'change')}={(event) => ${setter}(event.detail.${state})}` : '';
  const body = content(p, {
    child: (attrs, text) => element(Child, jsxAttrs(attrs), escapeText(text)),
    slotted: child => element(child.native ? child.element : pascal(child.element), jsxAttrs(child.attrs, !solid), escapeText(child.text)),
  }, '      ', '    ');
  return `${imports}\n${constants ? `${constants}\n` : ''}${omittedNote(p, t => `// ${t}`)}${callsNote(meta, p, t => `// ${t}`)}export function Example() {\n` +
    (p.model ? `  const [${state}, ${setter}] = ${hook}(${literal(p.model.value)});\n` : '') +
    `  return (\n    ${element(Name, `${modelProps}${jsxAttrs(p.attrs, !solid)}${jsxProps(p.props)}`, body)}\n  );\n}\n`;
}

function vue(meta: ElementMeta, p: Plan, context: CodeContext): string {
  const Name = `M${pascal(meta.name)}`;
  const Child = meta.children ? `M${pascal(meta.children.name)}` : '';
  const constants = hoist(meta, p);
  const body = content(p, {
    child: (attrs, text) => element(Child, vueAttrs(attrs), escapeText(text)),
    slotted: child => element(child.native ? child.element : `M${pascal(child.element)}`, vueAttrs(child.attrs), escapeText(child.text)),
  }, '    ', '  ');
  const model = p.model ? ` v-model="${p.model.name}"` : '';
  const tag = element(Name, `${model}${vueAttrs(p.attrs)}${vueProps(p.props)}`, body);
  return `<script setup lang="ts">\n${p.model ? `import { ref } from 'vue';\n` : ''}import { ${componentNames(meta, p, name => `M${pascal(name)}`).join(', ')} } from 'mtrl/vue';\n${styleImports(context)}` +
    (p.model || constants ? '\n' : '') + constants + (constants && p.model ? '\n' : '') +
    (p.model ? `const ${p.model.name} = ref(${literal(p.model.value)});\n` : '') +
    `</script>\n\n<template>\n${omittedNote(p, t => `  <!-- ${t} -->`)}${callsNote(meta, p, t => `  <!-- ${t} -->`)}  ${tag}\n</template>\n`;
}

function svelte(meta: ElementMeta, p: Plan, context: CodeContext): string {
  const Child = meta.children ? pascal(meta.children.name) : '';
  const constants = hoist(meta, p, '  ');
  const body = content(p, {
    child: (attrs, text) => element(Child, jsxAttrs(attrs), escapeText(text)),
    slotted: child => element(child.native ? child.element : pascal(child.element), svelteAttrs(child.attrs), escapeText(child.text)),
  }, '  ', '');
  const model = p.model ? ` bind:${p.model.name}` : '';
  return `<script lang="ts">\n  import { ${componentNames(meta, p, pascal).join(', ')} } from 'mtrl/svelte';\n  ${styleImports(context).trim().replaceAll('\n', '\n  ')}\n` +
    (p.model || constants ? '\n' : '') + constants + (constants && p.model ? '\n' : '') +
    (p.model ? `  let ${p.model.name} = $state(${literal(p.model.value)});\n` : '') +
    `</script>\n\n${omittedNote(p, t => `<!-- ${t} -->`)}${callsNote(meta, p, t => `<!-- ${t} -->`)}${element(pascal(meta.name), `${model}${jsxAttrs(p.attrs)}${jsxProps(p.props)}`, body)}\n`;
}

/** The component's code in a framework other than vanilla. */
export function frameworkCode(framework: Exclude<Framework, 'vanilla'>, meta: ElementMeta, config: Config, context: CodeContext): string {
  const p = plan(meta, config);
  switch (framework) {
    case 'html': return html(meta, p, context);
    case 'react': return reactOrSolid(meta, p, context, false);
    case 'solid': return reactOrSolid(meta, p, context, true);
    case 'vue': return vue(meta, p, context);
    case 'svelte': return svelte(meta, p, context);
  }
}
