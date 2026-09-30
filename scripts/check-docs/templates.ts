// A vue or svelte block as TypeScript, so the docs check can type it: the block's script
// as written, then its template as calls, one per component or element, that type the
// props against the component's own types (check-docs/templates.d.ts). A listener gets
// its event typed, so `event.detail.checked` is checked as a React handler's is.
//
// It is not the frameworks' language tools, which are not dependencies here, and it
// types what the guides write: props and listeners, bindings, `v-for` and `{#each}`,
// `v-if` and `{#if}`, interpolations. Anything else in a template throws, so a new
// construct is added here rather than skipped.
import ts from 'typescript';
import { parse as parseSvelte } from 'svelte/compiler';
import { parse as parseVue } from 'vue/compiler-sfc';

/** `lines[i]`: the line in the block, from 1, that generated line `i` comes from. */
export type Generated = { source: string; lines: number[]; typescript: boolean };

class Output {
  text: string[] = [];
  lines: number[] = [];
  /** Text from the block's `line`: each of its lines maps to the next line of the block. */
  push(text: string, line: number) {
    text.split('\n').forEach((part, i) => { this.text.push(part); this.lines.push(line + i); });
  }
  done(typescript: boolean): Generated { return { source: this.text.join('\n') + '\n', lines: this.lines, typescript }; }
}

export class TemplateError extends Error {
  constructor(message: string, readonly line: number) { super(message); }
}

/** The names a script makes that its template can read: values, not types. */
function valueNames(script: string) {
  const file = ts.createSourceFile('script.ts', script, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const names: string[] = [];
  const bind = (name: ts.BindingName) => { if (ts.isIdentifier(name)) names.push(name.text); else name.elements.forEach(element => { if (ts.isBindingElement(element)) bind(element.name); }); };
  for (const statement of file.statements) {
    if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause;
      if (!clause || clause.isTypeOnly) continue;
      if (clause.name) names.push(clause.name.text);
      const named = clause.namedBindings;
      if (named && ts.isNamespaceImport(named)) names.push(named.name.text);
      if (named && ts.isNamedImports(named)) names.push(...named.elements.filter(element => !element.isTypeOnly).map(element => element.name.text));
    } else if (ts.isVariableStatement(statement)) statement.declarationList.declarations.forEach(declaration => bind(declaration.name));
    else if ((ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) || ts.isEnumDeclaration(statement)) && statement.name) names.push(statement.name.text);
  }
  return names;
}

const key = (name: string) => /^[A-Za-z_$][\w$]*$/.test(name) ? name : JSON.stringify(name);
const camelize = (name: string) => name.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
const pascal = (name: string) => camelize(name).replace(/^\w/, c => c.toUpperCase());

// Vue: compiler-core's AST, as the SFC parser leaves it
const ELEMENT = 1, TEXT = 2, COMMENT = 3, INTERPOLATION = 5, ATTRIBUTE = 6, DIRECTIVE = 7;
const COMPONENT = 1, TEMPLATE = 3;
type VueLoc = { start: { line: number } };
type VueExpression = { content: string; isStatic?: boolean; loc: VueLoc };
type VueProp = { type: number; name: string; value?: { content: string }; arg?: VueExpression; exp?: VueExpression; loc: VueLoc };
type VueNode = { type: number; tag?: string; tagType?: number; props?: VueProp[]; children?: VueNode[]; content?: VueExpression; loc: VueLoc };
// Vue's own tests for a handler that is a function rather than a statement
const functionExpression = /^\s*(?:async\s*)?(?:\([^)]*?\)|[\w$]+)\s*(?::[^=]+)?=>|^\s*(?:async\s+)?function(?:\s+[\w$]+)?\s*\(/;
const memberExpression = /^[A-Za-z_$][\w$]*(?:\s*(?:\?\.|\.)\s*[A-Za-z_$][\w$]*|\[[^\]]+\])*$/;

export function vueToTs(code: string): Generated {
  // Its own file name: the SFC parser caches a descriptor by source and options, and the
  // compiler transforms the cached template in place (check-docs/compile.ts compiles 'Example.vue')
  const { descriptor, errors } = parseVue(code, { filename: 'Template.vue' });
  if (errors.length) throw new TemplateError(errors[0]!.message, (errors[0] as { loc?: VueLoc }).loc?.start.line ?? 1);
  const out = new Output();
  const scripts = [descriptor.script, descriptor.scriptSetup].filter(script => !!script);
  for (const script of scripts) out.push(script.content, script.loc.start.line);
  const names = scripts.flatMap(script => valueNames(script.content));
  out.push(`((__scope: ReturnType<typeof __vueScope<typeof __bindings>>) => {`, 1);
  if (names.length) out.push(`let { ${names.join(', ')} } = __scope;`, 1);
  const expression = (text: string) => `(${text})`;
  const element = (node: VueNode) => {
    const line = node.loc.start.line;
    const props = node.props ?? [];
    const directive = (name: string) => props.find(prop => prop.type === DIRECTIVE && prop.name === name);
    // a scoped slot's props would need the slot's types
    const slot = directive('slot');
    if (slot?.exp) throw new TemplateError('a scoped slot is not typed by the docs check', slot.exp.loc.start.line);
    // v-if, v-else-if, v-else and v-for wrap the element, in that order
    let close = 0;
    const condition = directive('if') ?? directive('else-if');
    if (condition?.exp) { out.push(`if (${condition.exp.content}) {`, condition.exp.loc.start.line); close++; }
    else if (directive('else')) { out.push('{', line); close++; }
    const loop = directive('for');
    if (loop?.exp) {
      const match = /^\s*\(?([\s\S]*?)\)?\s+(?:in|of)\s+([\s\S]+)$/.exec(loop.exp.content);
      if (!match) throw new TemplateError(`v-for="${loop.exp.content}" is not \`item in items\``, loop.exp.loc.start.line);
      const aliases = match[1]!.split(/,(?![^{[]*[}\]])/).map(alias => alias.trim());
      out.push(`for (const [${aliases.join(', ')}] of __vueFor(${match[2]})) {`, loop.exp.loc.start.line);
      close++;
    }
    if (node.tagType !== TEMPLATE) {
      const component = node.tagType === COMPONENT;
      out.push(component ? `__vue(${pascal(node.tag!)}, {` : `__vueElement({`, line);
      const after: [string, number][] = [];
      for (const prop of props) {
        const at = prop.exp?.loc.start.line ?? prop.loc.start.line;
        if (prop.type === ATTRIBUTE) {
          if (prop.name === 'ref') continue;
          out.push(`${key(component ? camelize(prop.name) : prop.name)}: ${prop.value ? JSON.stringify(prop.value.content) : component ? 'true' : "''"},`, at);
          continue;
        }
        // the wrapping ones, above
        if (['if', 'else-if', 'else', 'for'].includes(prop.name)) continue;
        if (['slot', 'show', 'text', 'html', 'once', 'memo', 'pre', 'cloak'].includes(prop.name)) {
          if (prop.exp) after.push([`void ${expression(prop.exp.content)};`, at]);
          continue;
        }
        const arg = prop.arg ? (prop.arg.isStatic ? prop.arg.content : `[${prop.arg.content}]`) : undefined;
        const computed = arg?.startsWith('[');
        if (prop.name === 'bind') {
          if (!arg) { if (prop.exp) out.push(`...${expression(prop.exp.content)},`, at); continue; }
          const name = computed ? arg : key(component ? camelize(arg) : arg);
          out.push(`${name}: ${prop.exp ? expression(prop.exp.content) : camelize(arg)},`, at);
        } else if (prop.name === 'on') {
          if (!arg || computed) { if (prop.exp) after.push([`void ${expression(prop.exp.content)};`, at]); continue; }
          const name = key(`on${camelize(arg).replace(/^\w/, c => c.toUpperCase())}`);
          const handler = !prop.exp ? '() => {}' : functionExpression.test(prop.exp.content) || memberExpression.test(prop.exp.content.trim()) ? prop.exp.content : `($event) => { ${prop.exp.content} }`;
          out.push(`${name}: ${handler},`, at);
        } else if (prop.name === 'model') {
          if (!prop.exp) continue;
          out.push(`${component ? key(arg ? camelize(arg) : 'modelValue') : 'value'}: ${expression(prop.exp.content)},`, at);
          // and writes back what the component emits
          if (component) after.push([`${prop.exp.content} = __vueModel(${pascal(node.tag!)}, ${JSON.stringify(arg ? camelize(arg) : 'modelValue')});`, at]);
        } else throw new TemplateError(`v-${prop.name} is not typed by the docs check`, at);
      }
      out.push('});', line);
      for (const [statement, at] of after) out.push(statement, at);
    }
    children(node.children ?? []);
    for (let i = 0; i < close; i++) out.push('}', line);
  };
  const children = (nodes: VueNode[]) => {
    for (const node of nodes) {
      if (node.type === TEXT || node.type === COMMENT) continue;
      if (node.type === INTERPOLATION) out.push(`void ${expression(node.content!.content)};`, node.content!.loc.start.line);
      else if (node.type === ELEMENT) element(node);
      else throw new TemplateError(`a node of type ${node.type} is not typed by the docs check`, node.loc.start.line);
    }
  };
  if (descriptor.template?.ast) children(descriptor.template.ast.children as unknown as VueNode[]);
  out.push('});', 1);
  out.push(`const __bindings = { ${names.join(', ')} };`, 1);
  out.push('export {};', 1);
  return out.done(scripts.some(script => script.lang === 'ts'));
}

// Svelte: its modern AST
type SvelteNode = { type: string; start: number; end: number; [field: string]: any };

export function svelteToTs(code: string): Generated {
  const root = parseSvelte(code, { modern: true }) as unknown as { instance?: SvelteNode; module?: SvelteNode; fragment: SvelteNode };
  const starts = [0, ...[...code.matchAll(/\n/g)].map(match => match.index! + 1)];
  const lineAt = (offset: number) => { let line = 0; while (line + 1 < starts.length && starts[line + 1]! <= offset) line++; return line + 1; };
  const text = (node: SvelteNode) => code.slice(node.start, node.end);
  const out = new Output();
  const scripts = [root.module, root.instance].filter(script => !!script);
  for (const script of scripts) out.push(text(script.content), lineAt(script.content.start));
  out.push('function __template() {', 1);
  const value = (node: SvelteNode['value']): string => {
    if (node === true) return 'true';
    if (!Array.isArray(node)) return `(${text(node.expression)})`;
    if (node.length === 1 && node[0].type === 'Text') return JSON.stringify(node[0].data);
    return '`' + node.map((part: SvelteNode) => part.type === 'Text' ? part.data.replace(/[`\\$]/g, '\\$&') : `\${${text(part.expression)}}`).join('') + '`';
  };
  const element = (node: SvelteNode) => {
    const component = node.type === 'Component';
    const line = lineAt(node.start);
    out.push(component ? `__svelte(${node.name}, {` : `__svelteElement(${JSON.stringify(node.name)}, {`, line);
    const after: [string, number][] = [];
    for (const attribute of node.attributes as SvelteNode[]) {
      const at = lineAt(attribute.start);
      switch (attribute.type) {
        case 'Attribute': out.push(`${key(attribute.name)}: ${value(attribute.value)},`, at); break;
        case 'SpreadAttribute': out.push(`...(${text(attribute.expression)}),`, at); break;
        case 'BindDirective':
          if (attribute.name === 'this') { if (!component) after.push([`${text(attribute.expression)} = __svelteThis(${JSON.stringify(node.name)});`, at]); }
          else out.push(`${key(attribute.name)}: (${text(attribute.expression)}),`, at);
          break;
        case 'OnDirective': case 'ClassDirective': case 'UseDirective': case 'TransitionDirective': case 'AnimateDirective': case 'AttachTag':
          if (attribute.expression) after.push([`void (${text(attribute.expression)});`, at]);
          break;
        case 'StyleDirective': if (attribute.value !== true) after.push([`void ${value(attribute.value)};`, at]); break;
        default: throw new TemplateError(`${attribute.type} is not typed by the docs check`, at);
      }
    }
    out.push('});', line);
    for (const [statement, at] of after) out.push(statement, at);
    fragment(node.fragment);
  };
  const fragment = (node: SvelteNode | null | undefined) => {
    for (const child of (node?.nodes ?? []) as SvelteNode[]) {
      const line = lineAt(child.start);
      switch (child.type) {
        case 'Text': case 'Comment': break;
        case 'ExpressionTag': case 'HtmlTag': case 'RenderTag': out.push(`void (${text(child.expression)});`, line); break;
        case 'RegularElement': case 'Component': element(child); break;
        case 'IfBlock':
          out.push(`if (${text(child.test)}) {`, lineAt(child.test.start));
          fragment(child.consequent);
          out.push('} else {', line);
          fragment(child.alternate);
          out.push('}', line);
          break;
        case 'EachBlock':
          out.push(`for (const [${child.context ? text(child.context) : '__item'}, ${child.index ?? '__index'}] of __svelteEach(${text(child.expression)})) {`, lineAt(child.expression.start));
          if (child.key) out.push(`void (${text(child.key)});`, lineAt(child.key.start));
          fragment(child.body);
          out.push('}', line);
          fragment(child.fallback);
          break;
        case 'KeyBlock':
          out.push(`void (${text(child.expression)});`, line);
          fragment(child.fragment);
          break;
        default: throw new TemplateError(`${child.type} is not typed by the docs check`, line);
      }
    }
  };
  fragment(root.fragment);
  out.push('}', 1);
  out.push('export {};', 1);
  const typescript = scripts.some(script => (script.attributes as SvelteNode[]).some(attribute => attribute.name === 'lang' && Array.isArray(attribute.value) && attribute.value[0]?.data === 'ts'));
  return out.done(typescript);
}
