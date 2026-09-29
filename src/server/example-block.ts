// The neutral `example` fence of the component docs: an example declared once, in
// YAML, and rendered in every framework the site offers.
//
//   ```example
//   switch:                              the component, by its docs slug
//     label: Wi-Fi                       its configuration: the factory's options, as
//     checked: true                      the playground's config names them
//     icon: checkIcon                    an app icon (a name ending in Icon, from the prelude)
//     on change: setWifi(checked)        a handler: an app placeholder, or an action, called
//                                        with payload fields (or literals)
//     action reset:                      an action: a function setting state, called by a
//       set checked: false               handler or by the app. Steps: `set <option>: value`,
//                                        `open`, `close`; one, a map of them, or a list
//   ```
//
// Children and slotted content are configuration too (`tabs: [...]`, a card's
// `buttons`), mapped by the element's spec as the playground's are. The Vanilla code
// is written here; the others come from the playground's generator (`frameworkCode`).
// A component without an element renders in Vanilla only, with a note.
import hljs from 'highlight.js';
import { components, isComponent } from '../shared/components';
import { appName, appRef, FRAMEWORKS, frameworkCode, handlerCall, isField, type ExampleAction, type ExampleHandler, type ExampleStep, type Framework } from '../shared/frameworks';
import { elementMeta } from './elements-meta';
import { componentName, escapeHTML } from './content';

export interface ExampleBlock {
  slug: string;
  config: Record<string, unknown>;
  handlers: ExampleHandler[];
  actions: ExampleAction[];
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
const camel = (name: string): string => name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
const pascal = (name: string): string => camel(name).replace(/^./, c => c.toUpperCase());
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

/** An app icon (`saveIcon`) becomes an app reference, anywhere in the configuration. */
const references = (value: unknown): unknown =>
  typeof value === 'string' && /^[a-z]\w*Icon$/.test(value) ? appRef(value)
    : Array.isArray(value) ? value.map(references)
    : isRecord(value) ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, references(v)]))
    : value;

/** `setWifi(checked)`, `track('wifi', checked)`: the function and its arguments. */
function parseCall(text: string, where: string): { call: string; args: string[] } {
  const match = /^([A-Za-z_$][\w$]*)\((.*)\)$/.exec(text.trim());
  if (!match) throw new Error(`${where}: "${text}" is not a call like setWifi(checked)`);
  const args = [...match[2]!.matchAll(/'[^']*'|"[^"]*"|[^,\s][^,]*/g)].map(arg => arg[0].trim());
  for (const arg of args) {
    if (!isField(arg) && !/^('[^']*'|"[^"]*"|-?\d+(\.\d+)?|true|false|null)$/.test(arg)) throw new Error(`${where}: argument ${arg} is neither a payload field nor a literal`);
  }
  return { call: match[1]!, args };
}

function parseSteps(name: string, value: unknown): ExampleStep[] {
  const where = `action ${name}`;
  const step = (key: string, stepValue?: unknown): ExampleStep => {
    if (key === 'open' || key === 'close') return { open: key === 'open' };
    const set = /^set (\S+)$/.exec(key);
    if (!set) throw new Error(`${where}: "${key}" is not a step (set <option>: value, open, close)`);
    return { set: set[1]!, value: references(stepValue) };
  };
  const items = Array.isArray(value) ? value : [value];
  const steps = items.flatMap(item => typeof item === 'string' ? [step(item)] : isRecord(item) ? Object.entries(item).map(([key, v]) => step(key, v)) : []);
  if (!steps.length || steps.length !== items.flatMap(item => (isRecord(item) ? Object.keys(item) : [item])).length) throw new Error(`${where} has no steps, or steps that are not one`);
  return steps;
}

/** A block's YAML as an example. Throws with the reason when it is not one. */
export function parseExample(source: string): ExampleBlock {
  let data: unknown;
  try { data = Bun.YAML.parse(source); } catch (error) { throw new Error(`not YAML: ${(error as Error).message}`); }
  if (!isRecord(data) || Object.keys(data).length !== 1) throw new Error('an example is one component: `slug:` and its configuration below');
  const [slug, body = {}] = Object.entries(data)[0]!;
  if (!isRecord(body) && body !== null) throw new Error(`${slug}: its configuration is a map`);
  const block: ExampleBlock = { slug, config: {}, handlers: [], actions: [] };
  for (const [key, value] of Object.entries(body ?? {})) {
    const on = /^on (\S+)$/.exec(key);
    const action = /^action (\S+)$/.exec(key);
    if (on) {
      if (typeof value !== 'string') throw new Error(`${key}: a handler is a call, like setWifi(checked)`);
      block.handlers.push({ event: on[1]!, ...parseCall(value, key) });
    } else if (action) {
      if (!IDENTIFIER.test(action[1]!)) throw new Error(`${key}: an action is named like a function`);
      block.actions.push({ name: action[1]!, steps: parseSteps(action[1]!, value) });
    } else if (key.includes(' ')) throw new Error(`"${key}" is neither an option, "on <event>" nor "action <name>"`);
    else block.config[key] = references(value);
  }
  return block;
}

/** A value as vanilla code: single quotes, and short objects on one line. */
function vanillaValue(value: unknown, indent = ''): string {
  if (appName(value)) return appName(value)!;
  if (typeof value === 'string') return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('\n', '\\n')}'`;
  if (Array.isArray(value) || isRecord(value)) {
    const inner = `${indent}  `;
    const items = Array.isArray(value) ? value.map(item => vanillaValue(item, inner))
      : Object.entries(value).map(([key, item]) => `${IDENTIFIER.test(key) ? key : `'${key}'`}: ${vanillaValue(item, inner)}`);
    const [open, close] = Array.isArray(value) ? ['[', ']'] : ['{ ', ' }'];
    const line = items.length ? `${open}${items.join(', ')}${close}` : open.trim() + close.trim();
    return line.length + indent.length <= 72 && !line.includes('\n') ? line : `${open.trim()}\n${items.map(item => `${inner}${item},\n`).join('')}${indent}${close.trim()}`;
  }
  return JSON.stringify(value);
}

// Options the factory sets through a method not named set<Option>.
const setters: Record<string, (value: unknown) => string> = {
  disabled: value => (value ? 'disable()' : 'enable()'),
};

/** The Vanilla code: the factory, its handlers, the element placed, and the actions. */
export function vanillaCode(block: ExampleBlock): string {
  const factory = isComponent(block.slug) ? components[block.slug].factory : `create${pascal(block.slug)}`;
  const variable = isComponent(block.slug) ? components[block.slug].variable : camel(block.slug);
  const config = Object.keys(block.config).length ? vanillaValue(block.config) : '';
  const handlers = block.handlers.map(h => {
    const fields = [...new Set(h.args.filter(isField))];
    return `${variable}.on('${h.event}', (${fields.length ? `{ ${fields.join(', ')} }` : ''}) => ${handlerCall(h, field => field)});\n`;
  }).join('');
  const statement = (step: ExampleStep): string => 'open' in step ? `${variable}.${step.open ? 'open' : 'close'}();`
    : `${variable}.${setters[step.set]?.(step.value) ?? `set${pascal(step.set)}(${vanillaValue(step.value)})`};`;
  const actions = block.actions.map(action => `\nfunction ${action.name}() {\n${action.steps.map(step => `  ${statement(step)}\n`).join('')}}\n`).join('');
  return `import { ${factory} } from 'mtrl';\n\nconst ${variable} = ${factory}(${config});\n${handlers}document.body.append(${variable}.element);\n${actions}`;
}

export interface ExampleCode {
  /** Whether the component has an element: without one, only Vanilla is rendered. */
  element: boolean;
  code: Partial<Record<Framework, string>>;
}

/** The example in every framework. Throws when a framework cannot render it. */
export function exampleCode(block: ExampleBlock): ExampleCode {
  const handlerCalls = new Set(block.actions.map(a => a.name));
  for (const handler of block.handlers) {
    if (!handlerCalls.has(handler.call) && !IDENTIFIER.test(handler.call)) throw new Error(`on ${handler.event}: ${handler.call} is not a function name`);
  }
  const meta = elementMeta(block.slug);
  const code: ExampleCode['code'] = { vanilla: vanillaCode(block) };
  if (!meta) return { element: false, code };
  for (const { id } of FRAMEWORKS) {
    if (id === 'vanilla') continue;
    try {
      code[id] = frameworkCode(id, meta, block.config, { example: { handlers: block.handlers, actions: block.actions } });
    } catch (error) {
      throw new Error(`${FRAMEWORKS.find(f => f.id === id)!.label}: ${(error as Error).message}`);
    }
  }
  return { element: true, code };
}

/**
 * The example as six highlighted panels, the Vanilla one shown until the reader's
 * framework is known: `:root[data-framework]` picks the panel, in CSS, before paint.
 */
export function renderExample(source: string): string {
  let rendered: ExampleCode;
  let slug: string;
  try {
    const block = parseExample(source);
    slug = block.slug;
    rendered = exampleCode(block);
  } catch (error) {
    return `<p class="doc-example__error">This example does not render: ${escapeHTML((error as Error).message)}</p>\n`;
  }
  const highlight = (text: string, language: string) => `<pre><code class="hljs language-${language}">${hljs.highlight(text, { language }).value}</code></pre>`;
  const vanilla = highlight(rendered.code.vanilla!, 'javascript');
  const note = `<p class="framework-note">Web Components, React, Vue, Svelte and SolidJS come with the ${escapeHTML(componentName(slug).toLowerCase())} web component; the vanilla factory works in any of them today.</p>`;
  const panels = FRAMEWORKS.map(({ id, label, language }) => {
    const code = rendered.code[id];
    const body = code !== undefined ? (id === 'vanilla' ? vanilla : highlight(code, language)) : `${vanilla}${note}`;
    return `<div class="doc-example__panel" data-framework="${id}"><span class="doc-example__label">${label}</span>${body}</div>`;
  });
  return `<div class="doc-example">${panels.join('')}</div>\n`;
}
