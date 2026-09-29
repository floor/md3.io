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
  /** The item key whose value is the child's text content. */
  text: string;
  /** Item keys written as the child's attributes. */
  attributes: Record<string, AttributeType>;
  /** An item selected in the config becomes the parent's model value. */
  selected?: { key: string; equals: string; value: string };
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
}

type Config = Record<string, unknown>;
type Attr = { name: string; value: string | number | true; ref?: string };
/** A live property: set in script for HTML, a prop in the frameworks. */
type Prop = { name: string; value: string | number | boolean };

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
  /** Config options the element does not expose yet: named in a comment, never dropped silently. */
  omitted: string[];
}

const valueOf = (type: AttributeType, raw: unknown): string | number | true | undefined => {
  if (raw === undefined || raw === null || raw === '' || raw === false) return undefined;
  if (type === 'boolean') return raw ? true : undefined;
  if (type === 'number') return typeof raw === 'number' ? raw : Number(raw);
  return String(raw);
};

function plan(meta: ElementMeta, config: Config): Plan {
  const used = new Set<string>();
  const attrs: Attr[] = [];
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
  const children: Plan['children'] = [];
  const childOmitted: string[] = [];
  const kids = meta.children;
  if (kids && Array.isArray(config[kids.from])) {
    used.add(kids.from);
    for (const item of config[kids.from] as Config[]) {
      const childAttrs: Attr[] = [];
      for (const [key, type] of Object.entries(kids.attributes)) {
        const value = valueOf(type, item[key]);
        if (value !== undefined) childAttrs.push({ name: key, value });
      }
      children.push({ attrs: childAttrs, text: String(item[kids.text] ?? '') });
      for (const [key, value] of Object.entries(item)) {
        const known = key in kids.attributes || key === kids.text || key === kids.selected?.key;
        const name = `${kids.from}[].${key}`;
        if (!known && value !== undefined && value !== '' && value !== false && !childOmitted.includes(name)) childOmitted.push(name);
      }
      if (kids.selected && item[kids.selected.key] === kids.selected.equals && meta.model) {
        model = { name: meta.model, value: item[kids.selected.value] };
      }
    }
  }
  const omitted = Object.keys(config).filter(key => !used.has(key) && !['prefix', 'class', 'ariaLabel'].includes(key)
    && config[key] !== undefined && config[key] !== '' && config[key] !== false).concat(childOmitted);
  return { attrs, model, props, text, children, omitted };
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
  return icons.imports(indent) + icons.declarations(indent);
}

const omittedNote = (p: Plan, comment: (text: string) => string): string =>
  p.omitted.length ? `${comment(`Not yet exposed by the element: ${p.omitted.join(', ')}.`)}\n` : '';

/** HTML attributes; an imported icon (`ref`) is set by the script instead. */
const htmlAttrs = (attrs: Attr[]): string =>
  attrs.filter(a => !a.ref).map(a => (a.value === true ? ` ${a.name}` : ` ${a.name}="${escapeAttr(String(a.value))}"`)).join('');

/** JSX / Svelte props: camelCase, booleans bare, numbers in braces. */
const jsxAttrs = (attrs: Attr[]): string =>
  attrs.map(a => {
    const name = camel(a.name);
    if (a.ref) return ` ${name}={${a.ref}}`;
    if (a.value === true) return ` ${name}`;
    return typeof a.value === 'number' ? ` ${name}={${a.value}}` : ` ${name}=${quoteJs(a.value)}`;
  }).join('');

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

export interface CodeContext {
  theme: string;
  mode: string;
}

const styleImports = (context: CodeContext): string =>
  `import 'mtrl/styles/base';\n${context.theme === 'baseline' ? '' : `import 'mtrl/themes/${context.theme}';\n`}`;

function html(meta: ElementMeta, p: Plan, context: CodeContext): string {
  const tag = `m-${meta.name}`;
  // First: naming the icons marks the attributes the script sets instead of the markup.
  const icons = hoist(meta, p, '  ');
  const modelAttr = p.model && p.model.value !== false && p.model.value !== undefined && p.model.value !== ''
    ? (p.model.value === true ? ` ${p.model.name}` : ` ${p.model.name}="${escapeAttr(String(p.model.value))}"`) : '';
  const children = p.children.map(c => `\n  <m-${meta.children!.name}${htmlAttrs(c.attrs)}>${escapeText(c.text)}</m-${meta.children!.name}>`).join('');
  const body = p.text !== undefined ? escapeText(p.text) : children ? `${children}\n` : '';
  const event = meta.events[0];
  const variable = camel(meta.name);
  const iconAttrs = p.attrs.filter(a => a.ref).map(a => `  ${variable}.setAttribute('${a.name}', ${a.ref});\n`).join('') +
    p.children.flatMap(c => c.attrs.filter(a => a.ref).map(a => {
      const value = c.attrs.find(v => v.name === 'value')?.value;
      const selector = `m-${meta.children!.name}${value === undefined ? '' : `[value="${String(value)}"]`}`;
      return `  ${variable}.querySelector('${selector}').setAttribute('${a.name}', ${a.ref});\n`;
    })).join('');
  const host = event || p.props.length || iconAttrs ? `\n  const ${variable} = document.querySelector('${tag}');\n` : '';
  const props = p.props.map(prop => `  ${variable}.${prop.name} = ${literal(prop.value)};\n`).join('');
  return `<script type="module">\n  ${styleImports(context).trim().replaceAll('\n', '\n  ')}\n  import 'mtrl/elements/css';\n  import { defineAll } from 'mtrl/elements';\n${icons ? `\n${icons}` : ''}\n  defineAll();\n` +
    `  document.documentElement.dataset.theme = '${context.theme}';\n  document.documentElement.dataset.themeMode = '${context.mode}';\n` +
    host + iconAttrs + props +
    (event ? `  ${camel(meta.name)}.addEventListener('${event}', (event) => {\n    console.log(event.detail);\n  });\n` : '') +
    `</script>\n\n${omittedNote(p, t => `<!-- ${t} -->`)}<${tag}${modelAttr}${htmlAttrs(p.attrs)}>${body}</${tag}>\n`;
}

function reactOrSolid(meta: ElementMeta, p: Plan, context: CodeContext, solid: boolean): string {
  const Name = pascal(meta.name);
  const Child = meta.children ? pascal(meta.children.name) : '';
  const constants = hoist(meta, p);
  const lib = solid ? 'solid' : 'react';
  const event = meta.events[0];
  const state = p.model ? p.model.name : '';
  const setter = `set${pascal(state)}`;
  const read = solid ? `${state}()` : state;
  const hook = solid ? 'createSignal' : 'useState';
  const imports = `${p.model ? `import { ${hook} } from '${solid ? 'solid-js' : 'react'}';\n` : ''}import { ${[Name, Child].filter(Boolean).join(', ')} } from 'mtrl/${lib}';\n${styleImports(context)}`;
  const modelProps = p.model ? ` ${state}={${read}} on${pascal(event ?? 'change')}={(event) => ${setter}(event.detail.${state})}` : '';
  const children = p.children.map(c => `\n      <${Child}${jsxAttrs(c.attrs)}>${escapeText(c.text)}</${Child}>`).join('');
  const body = p.text !== undefined ? escapeText(p.text) : children ? `${children}\n    ` : '';
  return `${imports}\n${constants ? `${constants}\n` : ''}${omittedNote(p, t => `// ${t}`)}export function Example() {\n` +
    (p.model ? `  const [${state}, ${setter}] = ${hook}(${literal(p.model.value)});\n` : '') +
    `  return (\n    ${element(Name, `${modelProps}${jsxAttrs(p.attrs)}${jsxProps(p.props)}`, body)}\n  );\n}\n`;
}

function vue(meta: ElementMeta, p: Plan, context: CodeContext): string {
  const Name = `M${pascal(meta.name)}`;
  const Child = meta.children ? `M${pascal(meta.children.name)}` : '';
  const constants = hoist(meta, p);
  const children = p.children.map(c => `\n    <${Child}${vueAttrs(c.attrs)}>${escapeText(c.text)}</${Child}>`).join('');
  const body = p.text !== undefined ? escapeText(p.text) : children ? `${children}\n  ` : '';
  const model = p.model ? ` v-model="${p.model.name}"` : '';
  const tag = element(Name, `${model}${vueAttrs(p.attrs)}${vueProps(p.props)}`, body);
  return `<script setup lang="ts">\n${p.model ? `import { ref } from 'vue';\n` : ''}import { ${[Name, Child].filter(Boolean).join(', ')} } from 'mtrl/vue';\n${styleImports(context)}` +
    (p.model || constants ? '\n' : '') + constants + (constants && p.model ? '\n' : '') +
    (p.model ? `const ${p.model.name} = ref(${literal(p.model.value)});\n` : '') +
    `</script>\n\n<template>\n${omittedNote(p, t => `  <!-- ${t} -->`)}  ${tag}\n</template>\n`;
}

function svelte(meta: ElementMeta, p: Plan, context: CodeContext): string {
  const Name = pascal(meta.name);
  const Child = meta.children ? pascal(meta.children.name) : '';
  const constants = hoist(meta, p, '  ');
  const children = p.children.map(c => `\n  <${Child}${jsxAttrs(c.attrs)}>${escapeText(c.text)}</${Child}>`).join('');
  const body = p.text !== undefined ? escapeText(p.text) : children ? `${children}\n` : '';
  const model = p.model ? ` bind:${p.model.name}` : '';
  return `<script lang="ts">\n  import { ${[Name, Child].filter(Boolean).join(', ')} } from 'mtrl/svelte';\n  ${styleImports(context).trim().replaceAll('\n', '\n  ')}\n` +
    (p.model || constants ? '\n' : '') + constants + (constants && p.model ? '\n' : '') +
    (p.model ? `  let ${p.model.name} = $state(${literal(p.model.value)});\n` : '') +
    `</script>\n\n${omittedNote(p, t => `<!-- ${t} -->`)}${element(Name, `${model}${jsxAttrs(p.attrs)}${jsxProps(p.props)}`, body)}\n`;
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
