// The code in docs/components/*.md, checked against the real mtrl (and mtrl-addons, for
// form and colorpicker), at three levels:
//
//   types      every javascript and typescript block type-checks against the published
//              types (node_modules/mtrl);
//   behaviour  every block runs in Chromium against the built mtrl without an error or a
//              warning. Each `x.on('event', handler)` it documents is triggered and must
//              receive the payload fields the handler reads; a handler in a factory's
//              config (`onChange`, `on: { … }`) is checked the same way when it fires;
//   classes    every .mtrl-… class a block names is in the built CSS, or on an element an
//              example built (a class the component sets and the stylesheet leaves
//              alone). Run on its own, this level knows only the CSS.
//
// A page's javascript and typescript imports are shared by its blocks, so an Import
// section covers the page. Fence annotations change what a block is:
//
//   ```javascript fragment    not checked: a signature, a sketch, a partial line (any block)
//   ```javascript continued   continues the previous block, in its scope
//   ```tsx solid, ```tsx react  the framework of a tsx or jsx block (see below)
//
// A neutral ```example block (src/server/example-block.ts) is rendered in all six
// frameworks, and a block a framework cannot render is a failure. Its Vanilla
// rendering joins the units above, checked and run as any block; its Web Components
// rendering runs in Chromium, each handler's event triggered and its payload fields
// read from the event's detail; each action is called. The React, Vue, Svelte and
// SolidJS renderings go through their frameworks' compilers (check-docs/compile.ts).
//
// A plain ```vue, ```svelte, ```tsx or ```jsx block is a module of its own, with its own
// imports (it cannot be `continued`). It goes through its framework's compiler, as an
// example's renderings do, and is type-checked:
//
//   tsx, jsx   against React's or Solid's JSX types and mtrl/react or mtrl/solid. The page
//              says which: a block is Solid on solid.md and React on every other page,
//              unless its fence names the framework: ```tsx solid, ```tsx react.
//   vue        its script, then its template as TypeScript (check-docs/templates.ts): each
//   svelte     component's props and listeners typed with mtrl/vue's or mtrl/svelte's types.
//
// A jsx block, and a vue or svelte block whose script is not lang="ts", is typed loosely,
// as a javascript block is.
//
// A listener the check cannot make fire is named, with the reason, in a comment on the
// line before its fence: <!-- check-docs untriggered 'event': why -->. Any other listener
// that never fires is a failure.
//
// Identifiers the examples take from the app are declared in check-docs/prelude.ts.
//
//   bun run docs:check [--types] [--behaviour] [--classes] [slug…]
import { readdirSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import ts from 'typescript';
import { chromium } from 'playwright';
import { exampleCode, parseExample, type ExampleBlock, type ExampleCode } from '../src/server/example-block';
import { FRAMEWORKS } from '../src/shared/frameworks';
import { compileFramework, errorLine } from './check-docs/compile';
import { svelteToTs, vueToTs, type Generated } from './check-docs/templates';

const root = resolve(import.meta.dir, '..');
const docsDir = resolve(root, 'docs/components');
const preludePath = resolve(import.meta.dir, 'check-docs/prelude.ts');
const templatesPath = resolve(import.meta.dir, 'check-docs/templates.d.ts');
const mtrlDir = resolve(root, 'node_modules/mtrl');
// form and colorpicker document mtrl-addons: the published package, a devDependency
const addonsDir = resolve(root, 'node_modules/mtrl-addons');
const args = process.argv.slice(2);
const levels = ['types', 'behaviour', 'classes'].filter(level => args.includes(`--${level}`));
const run = (level: string) => levels.length === 0 || levels.includes(level);
const only = args.filter(arg => !arg.startsWith('--'));

type Block = { page: string; line: number; lang: string; flags: string[]; code: string; untriggered: Map<string, string> };
/** `tail`: runtime code after the unit's own, not type-checked: an example's actions, exposed to be called. */
type Unit = { id: string; page: string; line: number; lang: string; source: string; runtime: string; lines: number[]; untriggered: Map<string, string>; tail?: string };
type Failure = { page: string; line: number; level: string; message: string };
const failures: Failure[] = [];
const fail = (page: string, line: number, level: string, message: string) => failures.push({ page, line, level, message });

// Blocks, by page
const FLAGS = new Set(['fragment', 'continued', 'react', 'solid']);
const MARKUP = new Set(['vue', 'svelte', 'tsx', 'jsx']);
const pages = readdirSync(docsDir).filter(name => name.endsWith('.md') && !name.startsWith('_')).map(name => name.slice(0, -3)).filter(slug => only.length === 0 || only.includes(slug)).sort();
const blocks: Block[] = [];
for (const page of pages) {
  const text = readFileSync(resolve(docsDir, `${page}.md`), 'utf8');
  for (const match of text.matchAll(/^```(\w*)([^\n]*)\n([\s\S]*?)^```[ \t]*$/gm)) {
    const [, lang = '', info = '', code = ''] = match;
    const line = text.slice(0, match.index).split('\n').length + 1;
    const flags = info.trim().split(/\s+/).filter(Boolean);
    for (const flag of flags) if (!FLAGS.has(flag)) fail(page, line - 1, 'syntax', `unknown fence annotation "${flag}"`);
    for (const flag of flags) if ((flag === 'react' || flag === 'solid') && lang !== 'tsx' && lang !== 'jsx') fail(page, line - 1, 'syntax', `"${flag}" names the framework of a tsx or jsx block, not of a ${lang} block`);
    if (flags.includes('continued') && MARKUP.has(lang)) fail(page, line - 1, 'syntax', `a ${lang} block is a module of its own: it cannot be "continued"`);
    // <!-- check-docs untriggered 'event': why --> on the line before: a listener the
    // check cannot make fire, with the reason, instead of a failure
    const before = text.slice(0, match.index).trimEnd().split('\n').at(-1) ?? '';
    const untriggered = new Map([...before.matchAll(/<!-- check-docs untriggered '([^']+)': (.+?) -->/g)].map(([, event, reason]) => [event!, reason!]));
    blocks.push({ page, line, lang, flags, code, untriggered });
  }
}
const scripts = blocks.filter(block => block.lang === 'javascript' || block.lang === 'typescript');

// Framework blocks: vue, svelte, and tsx or jsx for React or Solid (see the top)
type Markup = { block: Block; framework: 'react' | 'vue' | 'svelte' | 'solid' };
const frameworkOf = (block: Block): Markup['framework'] =>
  block.lang === 'vue' || block.lang === 'svelte' ? block.lang
    : block.flags.includes('solid') ? 'solid' : block.flags.includes('react') ? 'react' : block.page === 'solid' ? 'solid' : 'react';
const markups: Markup[] = blocks.filter(block => MARKUP.has(block.lang) && !block.flags.includes('fragment')).map(block => ({ block, framework: frameworkOf(block) }));
const frameworkLabel = (id: Markup['framework']) => FRAMEWORKS.find(framework => framework.id === id)!.label;
// A vue or svelte block its compiler rejects is not typed too: its template would fail again
const uncompiled = new Set<Markup>();

// Example blocks, rendered in every framework
type Rendered = { block: Block; example: ExampleBlock; code: ExampleCode['code'] };
const examples: Rendered[] = [];
for (const block of blocks.filter(block => block.lang === 'example')) {
  try {
    const example = parseExample(block.code);
    const { element, code } = exampleCode(example);
    examples.push({ block, example, code });
    if (!element) console.log(`  ${block.page}.md:${block.line} ${example.slug}: no element, Vanilla only`);
  } catch (error) {
    fail(block.page, block.line, 'example', (error as Error).message);
  }
}
const actionsTail = (example: ExampleBlock) =>
  example.actions.length ? `\nObject.assign(window.__docsActions, { ${example.actions.map(action => action.name).join(', ')} });\n` : '';

// Units: a block and the blocks that continue it; an example's Vanilla rendering is one
const units: Unit[] = [];
for (const block of blocks) {
  const rendered = examples.find(example => example.block === block);
  if (rendered) {
    const source = rendered.code.vanilla!;
    units.push({ id: `${block.page}/${block.line}`, page: block.page, line: block.line, lang: 'javascript', source, runtime: '', lines: source.split('\n').map(() => block.line), untriggered: new Map(block.untriggered), tail: actionsTail(rendered.example) });
    continue;
  }
  if (!scripts.includes(block)) continue;
  if (block.flags.includes('fragment')) continue;
  const lines = block.code.split('\n').map((_, i) => block.line + i);
  const previous = units.at(-1);
  if (block.flags.includes('continued')) {
    if (!previous || previous.page !== block.page) { fail(block.page, block.line - 1, 'syntax', '"continued" block has nothing to continue'); continue; }
    previous.source += block.code;
    block.untriggered.forEach((reason, event) => previous.untriggered.set(event, reason));
    previous.lines = [...previous.lines.slice(0, -1), ...lines];
    if (block.lang === 'typescript') previous.lang = 'typescript';
    continue;
  }
  units.push({ id: `${block.page}/${block.line}`, page: block.page, line: block.line, lang: block.lang, source: block.code, runtime: '', lines, untriggered: new Map(block.untriggered) });
}

// The page's imports, shared by its units: each unit gets the ones it does not make itself
const parse = (source: string) => ts.createSourceFile('unit.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const importNames = (node: ts.ImportDeclaration) => {
  const clause = node.importClause;
  if (!clause) return [];
  const names = clause.name ? [clause.name.text] : [];
  if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) names.push(clause.namedBindings.name.text);
  if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) names.push(...clause.namedBindings.elements.map(element => element.name.text));
  return names;
};
const topLevelNames = (file: ts.SourceFile) => {
  const names = new Set<string>();
  for (const statement of file.statements) {
    if (ts.isImportDeclaration(statement)) importNames(statement).forEach(name => names.add(name));
    else if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) {
      const visit = (name: ts.BindingName) => { if (ts.isIdentifier(name)) names.add(name.text); else name.elements.forEach(element => { if (ts.isBindingElement(element)) visit(element.name); }); };
      visit(declaration.name);
    } else if ((ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) || ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement) || ts.isEnumDeclaration(statement)) && statement.name) names.add(statement.name.text);
  }
  return names;
};
// Each imported name on its own, the first import of a name winning. At runtime a
// shared name is read off the module, so a name that is only a type (imported by a
// TypeScript block) reads as undefined in the others instead of failing to link.
type Binding = { types: string; runtime: string };
const bindings = (node: ts.ImportDeclaration, file: ts.SourceFile): [string, Binding][] => {
  const clause = node.importClause;
  if (!clause) return [];
  const from = node.moduleSpecifier.getText(file);
  const typeOnly = clause.isTypeOnly;
  const type = typeOnly ? 'type ' : '';
  const read = (local: string, imported: string) => typeOnly ? '' : `import * as $${local} from ${from}; const ${local} = $${local}[${JSON.stringify(imported)}];`;
  const list: [string, Binding][] = [];
  if (clause.name) list.push([clause.name.text, { types: `import ${type}${clause.name.text} from ${from};`, runtime: read(clause.name.text, 'default') }]);
  if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) list.push([clause.namedBindings.name.text, { types: `import ${type}* as ${clause.namedBindings.name.text} from ${from};`, runtime: typeOnly ? '' : `import * as ${clause.namedBindings.name.text} from ${from};` }]);
  if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) for (const element of clause.namedBindings.elements) {
    list.push([element.name.text, { types: `import ${type}{ ${element.getText(file)} } from ${from};`, runtime: element.isTypeOnly ? '' : read(element.name.text, (element.propertyName ?? element.name).text) }]);
  }
  return list;
};
const pageImports = new Map<string, Map<string, Binding>>();
for (const unit of units) {
  const imports = pageImports.get(unit.page) ?? new Map<string, Binding>();
  const file = parse(unit.source);
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    for (const [name, text] of bindings(statement, file)) if (!imports.has(name)) imports.set(name, text);
  }
  pageImports.set(unit.page, imports);
}
for (const unit of units) {
  const own = topLevelNames(parse(unit.source));
  const header = [...(pageImports.get(unit.page) ?? [])].filter(([name]) => !own.has(name)).map(([, binding]) => binding);
  const body = `${unit.source}\nexport {};\n`;
  unit.source = [...header.map(binding => binding.types), body].join('\n');
  unit.runtime = [...header.map(binding => binding.runtime), body + (unit.tail ?? '')].join('\n');
  unit.lines = [...header.map(() => unit.line - 1), ...unit.lines];
}
const docLine = (unit: Unit, line: number) => unit.lines[Math.min(line, unit.lines.length - 1)] ?? unit.line;

// Level 1: types. Each file a unit or a framework block, in a program of its kind
type Virtual = { page: string; source: string; docLine: (line: number) => number };
function checkTypes() {
  const base: ts.CompilerOptions = {
    target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    lib: ['lib.esnext.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'], types: [], skipLibCheck: true, noEmit: true, strict: true,
  };
  // JavaScript blocks are read as JavaScript is written: parameters without types, and
  // DOM lookups that may be null. TypeScript blocks are held to strict TypeScript.
  const loose: ts.CompilerOptions = { noImplicitAny: false, strictNullChecks: false };
  const jsx: Record<string, ts.CompilerOptions> = { react: { jsx: ts.JsxEmit.ReactJSX, jsxImportSource: 'react' }, solid: { jsx: ts.JsxEmit.Preserve, jsxImportSource: 'solid-js' } };
  const programs = new Map<string, { options: ts.CompilerOptions; roots: string[]; files: Map<string, Virtual> }>();
  const add = (kind: string, options: ts.CompilerOptions, roots: string[], file: string, virtual: Virtual) => {
    const program = programs.get(kind) ?? { options, roots, files: new Map() };
    program.files.set(resolve(root, '.docs-check', file), virtual);
    programs.set(kind, program);
  };
  for (const unit of units) {
    add(unit.lang, unit.lang === 'typescript' ? base : { ...base, ...loose }, [preludePath], `${unit.id}.ts`, { page: unit.page, source: unit.source, docLine: line => docLine(unit, line) });
  }
  for (const markup of markups) {
    const { block, framework } = markup;
    const id = `${block.page}/${block.line}`;
    if (block.lang === 'tsx' || block.lang === 'jsx') {
      const strict = block.lang === 'tsx';
      add(`${framework} ${block.lang}`, { ...base, ...jsx[framework], ...(strict ? {} : loose) }, [preludePath], `${id}.tsx`, { page: block.page, source: block.code, docLine: line => block.line + line });
      continue;
    }
    if (uncompiled.has(markup)) continue;
    let generated: Generated;
    try {
      generated = block.lang === 'vue' ? vueToTs(block.code) : svelteToTs(block.code);
    } catch (error) {
      fail(block.page, block.line + ((error as { line?: number }).line ?? errorLine(error) ?? 1) - 1, 'types', `${frameworkLabel(framework)}: ${(error as Error).message.split('\n')[0]}`);
      continue;
    }
    const { source, lines, typescript } = generated;
    add(`templates ${typescript}`, typescript ? base : { ...base, ...loose }, [preludePath, templatesPath], `${id}.ts`, { page: block.page, source, docLine: line => block.line + (lines[line] ?? 1) - 1 });
  }
  for (const { options, roots, files } of programs.values()) {
    const host = ts.createCompilerHost(options);
    const getSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (file, language, ...rest) => { const virtual = files.get(resolve(file)); return virtual ? ts.createSourceFile(file, virtual.source, language, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS) : getSourceFile(file, language, ...rest); };
    const fileExists = host.fileExists.bind(host);
    host.fileExists = file => files.has(resolve(file)) || fileExists(file);
    const readFile = host.readFile.bind(host);
    host.readFile = file => files.get(resolve(file))?.source ?? readFile(file);
    const program = ts.createProgram([...roots, ...files.keys()], options, host);
    for (const diagnostic of ts.getPreEmitDiagnostics(program)) {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n  ');
      const virtual = diagnostic.file && files.get(resolve(diagnostic.file.fileName));
      if (!virtual || diagnostic.start === undefined) { fail('(program)', 0, 'types', `${diagnostic.file ? relative(root, diagnostic.file.fileName) + ': ' : ''}${message}`); continue; }
      const { line } = diagnostic.file!.getLineAndCharacterOfPosition(diagnostic.start);
      fail(virtual.page, virtual.docLine(line), 'types', `TS${diagnostic.code} ${message}`);
    }
  }
}

// Level 2: behaviour. Each `x.on('event', handler)` becomes `__docs.on(x, 'event', handler,
// listen)`, which listens through the component and records the payloads; a config handler
// becomes `__docs.hook(id, handler, listen)`, bound to its component by `__docs.bind`.
type Listen = { event: string; fields: string[]; line: number; config?: boolean };
function instrument(unit: Unit) {
  const file = parse(unit.runtime);
  const listens: Listen[] = [];
  const isOn = (node: ts.Node): node is ts.CallExpression => ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'on' && node.arguments.length >= 2 && ts.isStringLiteralLike(node.arguments[0]!);
  const fieldsRead = (handler: ts.Expression) => {
    if (!ts.isArrowFunction(handler) && !ts.isFunctionExpression(handler)) return [];
    const param = handler.parameters[0]?.name;
    if (!param) return [];
    if (ts.isObjectBindingPattern(param)) return param.elements.filter(element => !element.dotDotDotToken).map(element => (element.propertyName ?? element.name).getText(file));
    if (!ts.isIdentifier(param)) return [];
    const fields = new Set<string>();
    const visit = (node: ts.Node) => {
      if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === param.text) fields.add(node.name.text);
      ts.forEachChild(node, visit);
    };
    visit(handler.body);
    return [...fields];
  };
  // Handlers in a factory's config, `onChange: fn` and `on: { change: fn }`: checked when
  // they fire, not required to
  const isFunction = (node: ts.Node | undefined): node is ts.ArrowFunction | ts.FunctionExpression => !!node && (ts.isArrowFunction(node) || ts.isFunctionExpression(node));
  const hooks = (config: ts.ObjectLiteralExpression) => config.properties.flatMap(property => {
    if (!ts.isPropertyAssignment(property)) return [];
    const name = property.name.getText(file).replace(/['"]/g, '');
    if (/^on[A-Z]/.test(name) && isFunction(property.initializer)) return [{ event: name[2]!.toLowerCase() + name.slice(3), handler: property.initializer }];
    if (name === 'on' && ts.isObjectLiteralExpression(property.initializer)) return property.initializer.properties.flatMap(inner => ts.isPropertyAssignment(inner) && isFunction(inner.initializer) ? [{ event: inner.name.getText(file).replace(/['"]/g, ''), handler: inner.initializer }] : []);
    return [];
  });
  const isConfig = (node: ts.Node): node is ts.CallExpression => ts.isCallExpression(node) && ts.isIdentifier(node.expression) && /^create[A-Z]/.test(node.expression.text) && !!node.arguments[0] && ts.isObjectLiteralExpression(node.arguments[0]) && hooks(node.arguments[0]).length > 0;
  const contains = (node: ts.Node): boolean => isOn(node) || isConfig(node) || (ts.forEachChild(node, contains) ?? false);
  let hookId = 0;
  const hooked = new Map<ts.Node, string>();
  const emit = (node: ts.Node): string => {
    if (hooked.has(node)) {
      const text = hooked.get(node)!;
      hooked.delete(node);
      return text.replace('%', () => emit(node));
    }
    const holdsHook = [...hooked.keys()].some(handler => handler.pos >= node.pos && handler.end <= node.end);
    if (!contains(node) && !holdsHook) return node.getText(file);
    if (isOn(node)) {
      const target = (node.expression as ts.PropertyAccessExpression).expression;
      const [event, handler, ...rest] = node.arguments;
      const line = docLine(unit, file.getLineAndCharacterOfPosition(node.getStart(file)).line);
      const listen = { event: (event as ts.StringLiteral).text, fields: fieldsRead(handler!), line };
      listens.push(listen);
      return `__docs.on(${emit(target)}, ${[event!, handler!, ...rest].map(emit).join(', ')}, ${JSON.stringify(listen)})`;
    }
    if (isConfig(node)) {
      const ids = hooks(node.arguments[0] as ts.ObjectLiteralExpression).map(({ event, handler }) => {
        const id = hookId++;
        const line = docLine(unit, file.getLineAndCharacterOfPosition(handler.getStart(file)).line);
        const listen = { event, fields: fieldsRead(handler), line, config: true };
        listens.push(listen);
        hooked.set(handler, `__docs.hook(${id}, %, ${JSON.stringify(listen)})`);
        return id;
      });
      return `__docs.bind(${emitChildren(node)}, ${JSON.stringify(ids)})`;
    }
    return emitChildren(node);
  };
  const emitChildren = (node: ts.Node): string => {
    let out = '';
    let position = node.getStart(file);
    ts.forEachChild(node, child => {
      const start = child.getStart(file);
      out += unit.runtime.slice(position, start) + emit(child);
      position = child.end;
    });
    return out + unit.runtime.slice(position, node.end);
  };
  const source = file.statements.map(statement => emit(statement)).join('\n');
  return { source, listens };
}

const transpiler = new Bun.Transpiler({ loader: 'ts', target: 'browser' });
// TypeScript drops imports that only name types; JavaScript keeps every import
const typescript = new Bun.Transpiler({ loader: 'ts', target: 'browser', trimUnusedImports: true });
// Where each package's modules are served from, by the directories they resolve into
const served = [
  { url: '/mtrl/', dirs: [resolve(mtrlDir, 'dist'), resolve(Bun.resolveSync('mtrl', root), '..')] },
  { url: '/addons/', dirs: [resolve(addonsDir, 'dist'), resolve(Bun.resolveSync('mtrl-addons', root), '..')] },
];
function browserModule(source: string, lang: string) {
  return (lang === 'typescript' ? typescript : transpiler).transformSync(source).replace(/((?:from|import)\s*\(?\s*)(["'])(mtrl(?:-addons)?(?:\/[^"']*)?)\2/g, (_, before: string, quote: string, specifier: string) => {
    // Stylesheet imports are the bundler's; the page already has mtrl's CSS, so they run as
    // nothing. So does a .css file (the pre-upgrade stylesheet), which only styles elements
    // before they are defined.
    if (/^mtrl(?:-addons)?\/(?:styles|themes)(?:\/|$)|\.css$/.test(specifier)) return `${before}${quote}data:text/javascript,${quote}`;
    const file = Bun.resolveSync(specifier, root);
    for (const { url, dirs } of served) for (const dir of dirs) if (file.startsWith(dir + '/')) return `${before}${quote}${url}${file.slice(dir.length + 1)}${quote}`;
    throw new Error(`${specifier} resolves outside the served packages: ${file}`);
  });
}

const harness = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/mtrl/styles.css"><link rel="stylesheet" href="/addons/styles.css"></head><body><script type="module">
import '/prelude.js';
const listeners = [];
// What an example's own handler logs is the example talking, not a failure
let inHandler = 0;
for (const level of ['error', 'warn']) {
  const original = console[level].bind(console);
  console[level] = (...args) => inHandler ? console.info('[handler]', ...args) : original(...args);
}
// Every mtrl class an element carries at any moment, in the page or not
const seen = new Set();
const created = [];
const createElement = document.createElement.bind(document);
document.createElement = (...args) => { const element = createElement(...args); created.push(element); return element; };
const note = names => { for (const name of names) if (typeof name === 'string' && name.startsWith('mtrl-')) seen.add(name); };
for (const method of ['add', 'toggle', 'replace']) {
  const original = DOMTokenList.prototype[method];
  DOMTokenList.prototype[method] = function (...names) { note(method === 'replace' ? names.slice(1) : method === 'toggle' ? names.slice(0, 1) : names); return original.apply(this, names); };
}
const className = Object.getOwnPropertyDescriptor(Element.prototype, 'className');
Object.defineProperty(Element.prototype, 'className', { ...className, set(value) { note(String(value).split(/\s+/)); className.set.call(this, value); } });
const setAttribute = Element.prototype.setAttribute;
Element.prototype.setAttribute = function (name, value) { if (name === 'class') note(String(value).split(/\s+/)); return setAttribute.call(this, name, value); };
const innerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
Object.defineProperty(Element.prototype, 'innerHTML', { ...innerHTML, set(value) { for (const [, names] of String(value).matchAll(/class="([^"]*)"/g)) note(names.split(/\s+/)); innerHTML.set.call(this, value); } });
const hooks = new Map();
window.__docs = {
  hook(id, handler, listen) {
    const record = { target: null, calls: [], ...listen };
    listeners.push(record);
    hooks.set(id, record);
    return function (...args) {
      record.calls.push(args[0]);
      inHandler++;
      try { return handler.apply(this, args); } finally { inHandler--; }
    };
  },
  bind(target, ids) {
    for (const id of ids) hooks.get(id).target = target;
    return target;
  },
  on(target, event, handler, listen) {
    const record = { target, calls: [], ...listen };
    listeners.push(record);
    return target.on(event, function (...args) {
      record.calls.push(args[0]);
      inHandler++;
      try { return handler.apply(this, args); } finally { inHandler--; }
    });
  },
};
// The elements an example looks up, so it has somewhere to put its component
function scaffold(source) {
  for (const [, selector] of source.matchAll(/querySelector(?:All)?\\(\\s*['"\`]([^'"\`]+)['"\`]\\s*\\)/g)) {
    if (document.querySelector(selector)) continue;
    let parent = document.body;
    for (const part of selector.trim().split(/\\s*>\\s*|\\s+/)) {
      const tag = /^[a-z][\\w-]*/i.exec(part)?.[0] ?? 'div';
      const element = document.createElement(tag);
      const id = /#([\\w-]+)/.exec(part)?.[1];
      if (id) element.id = id;
      for (const [, name] of part.matchAll(/\\.([\\w-]+)/g)) element.classList.add(name);
      for (const [, name, value] of part.matchAll(/\\[([\\w-]+)(?:=["']?([^"'\\]]*)["']?)?\\]/g)) element.setAttribute(name, value ?? '');
      parent.append(element);
      parent = element;
    }
  }
  const ids = [...source.matchAll(/getElementById\\(\\s*['"\`]([^'"\`]+)['"\`]\\s*\\)/g), ...source.matchAll(/['"\`]#([\\w-]+)['"\`]/g)];
  for (const [, id] of ids) {
    if (document.getElementById(id)) continue;
    const element = document.createElement('div');
    element.id = id;
    document.body.append(element);
  }
}
const elementOf = target => target instanceof Element ? target : target?.element instanceof Element ? target.element : null;
const input = element => element.matches('input, textarea, select') ? element : element.querySelector('input, textarea, select');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
// Makes the component emit the event: as a user would first, then through its own API.
// Each attempt stops the search once the listener has been called.
const visible = element => element.getClientRects().length > 0 && !element.closest('[aria-disabled="true"], [disabled], [class*="--disabled"]');
const choices = '[role="option"]:not([aria-selected="true"]), [role="tab"]:not([aria-selected="true"]), [role="menuitem"], [role="menuitemradio"], [role="radio"]:not([aria-checked="true"]), button[aria-pressed="false"], [role="gridcell"] button, [data-id]:is(button, a):not([aria-current])';
const pick = (scope, selector) => [...scope.querySelectorAll(selector)].find(visible);
const key = (element, name) => { for (const type of ['keydown', 'keyup']) element.dispatchEvent(new KeyboardEvent(type, { key: name, bubbles: true })); };
const type = (field, value) => { field.focus(); field.value = value; field.dispatchEvent(new Event('input', { bubbles: true })); field.dispatchEvent(new Event('change', { bubbles: true })); };
async function trigger(record) {
  const target = record.target;
  const element = elementOf(target);
  if (element && !element.isConnected) document.body.append(element);
  const field = element && input(element);
  const has = name => typeof target?.[name] === 'function';
  const event = record.event;
  const attempts = [];
  if (event === 'click') attempts.push(() => (element?.querySelector('button, [role="button"]') ?? element)?.click());
  // a snackbar's action: shown, then its action button pressed
  if (event === 'action') attempts.push(async () => { if (has('show')) target.show(); await wait(150); target?.actionButton?.click(); });
  if (event === 'focus') attempts.push(() => (field ?? element)?.focus());
  if (event === 'blur') attempts.push(() => { (field ?? element)?.focus(); (field ?? element)?.blur(); });
  if (/close|hide|dismiss/i.test(event)) attempts.push(async () => { has('open') ? target.open() : has('show') && target.show(); await wait(100); has('close') ? target.close() : has('hide') ? target.hide() : has('dismiss') && target.dismiss(); await wait(400); });
  // A component with an opener (the menu) opens from it, as a user opens it: its trigger
  else if (/open|show/i.test(event) && has('getOpener')) attempts.push(() => target.getOpener()?.click());
  else if (/open|show/i.test(event)) attempts.push(() => has('open') ? target.open() : has('show') && target.show());
  if (/change|input|select|remove|confirm|complete/i.test(event)) {
    if (field?.type === 'checkbox' || field?.type === 'radio') attempts.push(() => field.click());
    else if (field?.type === 'range') attempts.push(() => type(field, String(Number(field.value) + Number(field.step || 1))));
    // the component itself a choice (a toggle icon button), a choice inside it, a handle
    // to move, a menu to open
    if (element?.matches(choices) && visible(element)) attempts.push(() => element.click());
    if (element) attempts.push(() => pick(element, choices)?.click());
    if (element) attempts.push(() => { const handle = pick(element, '[role="slider"]'); if (handle) { handle.focus(); key(handle, 'ArrowRight'); } });
    if (element) attempts.push(() => pick(element, 'button[aria-expanded="false"]')?.click());
    if (/remove/i.test(event) && element) attempts.push(() => pick(element, 'button[aria-label^="Remove" i], [aria-label^="Remove" i]')?.click());
    // opened elsewhere: an item of a menu or list, a dialog's confirming button; or in
    // its web component's shadow root, as a select's menu and a date picker's dialog are
    const shadow = element?.getRootNode();
    const root = shadow instanceof ShadowRoot ? shadow : document;
    attempts.push(async () => { if (has('open')) target.open(); await wait(150); pick(document, choices)?.click(); });
    if (shadow instanceof ShadowRoot) attempts.push(async () => { if (has('open')) target.open(); await wait(150); pick(shadow, choices)?.click(); });
    const confirm = () => { const buttons = [...root.querySelectorAll('dialog[open] button, [role="dialog"] button')].filter(visible); (buttons.find(button => /^(ok|save|done|confirm)$/i.test(button.textContent.trim())) ?? buttons.at(-1))?.click(); };
    attempts.push(async () => { if (has('open')) target.open(); await wait(150); confirm(); });
    // a range: two choices, then the confirming button
    attempts.push(async () => { if (has('open')) target.open(); await wait(150); pick(root, choices)?.click(); await wait(60); [...root.querySelectorAll(choices)].filter(visible).at(3)?.click(); await wait(60); confirm(); });
    // a field to type in
    if (field && field.type !== 'checkbox' && field.type !== 'radio' && field.type !== 'range' && !field.readOnly) attempts.push(() => type(field, 'x'));
  }
  // the component's own API, for events no gesture reaches here
  const api = {
    change: () => has('next') ? target.next() : has('setFieldValue') ? target.setFieldValue(target.getFieldNames()[0], 'x') : null,
    complete: () => has('setValue') && target.setValue(100, false),
    'state:change': () => has('setFieldValue') && target.setFieldValue(target.getFieldNames()[0], 'x'),
    'field:change': () => has('setFieldValue') && target.setFieldValue(target.getFieldNames()[0], 'x'),
    'data:set': () => has('setData') && target.setData({}),
    'data:get': () => has('getData') && target.getData(),
    reset: () => has('reset') && target.reset(true),
    submit: () => has('submit') && target.submit(),
    'submit:success': () => has('submit') && target.submit(),
    'submit:error': () => has('submit') && target.submit({ handler: async () => { throw new Error('offline'); } }),
    'validation:error': () => has('validate') && target.validate(),
  };
  if (api[event]) attempts.push(api[event]);
  const before = record.calls.length;
  for (const attempt of attempts) {
    try { await attempt(); } catch {}
    await wait(60);
    if (record.calls.length > before) break;
  }
}
// An example's actions, called once its listeners have run
window.__docsActions = {};
async function runActions() {
  for (const action of Object.values(window.__docsActions)) { await action(); await wait(50); }
}
// The listeners an example's web component code adds, recognised by the call they make
const expected = [];
const addEventListener = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function (type, listener, options) {
  const record = this instanceof Element && typeof listener === 'function'
    ? expected.find(r => r.tag === this.localName && r.event === type && String(listener).includes(r.call + '(')) : undefined;
  if (!record) return addEventListener.call(this, type, listener, options);
  record.registered = true;
  return addEventListener.call(this, type, function (event) {
    record.calls.push(event.detail);
    inHandler++;
    try { return listener.call(this, event); } finally { inHandler--; }
  }, options);
};
window.__runElement = async (id, handlers) => {
  expected.push(...handlers.map(handler => ({ ...handler, calls: [], registered: false })));
  await import('/element/' + id + '.js');
  await wait(100);
  // Through the element's component, as a user would: its events reach the element's listeners
  for (const record of expected) {
    record.target = document.querySelector(record.tag)?.component;
    if (record.target) await trigger(record);
  }
  await runActions();
  await wait(50);
  return expected.map(({ event, fields, registered, calls }) => ({ event, fields, registered, calls: calls.map(detail => detail == null ? null : Object.fromEntries(fields.map(field => [field, field in Object(detail)]))) }));
};
window.__run = async (id, source) => {
  scaffold(source);
  const done = import('/unit/' + id + '.js');
  let settled = false;
  done.then(() => { settled = true; }, () => { settled = true; });
  await Promise.race([done, wait(1000)]);
  // An example awaiting the user, as dialog.confirm() does: answer the dialog it opened
  if (!settled) [...document.querySelectorAll('[role="dialog"] button, [role="alertdialog"] button')].filter(button => button.offsetParent).at(-1)?.click();
  await Promise.race([done, wait(2000).then(() => { throw new Error('did not finish in 3s'); })]);
  await wait(50);
  // Every listener, even one already called: a cascade from another may carry less
  for (const record of listeners) await trigger(record);
  await runActions();
  await wait(50);
  const listens = listeners.map(({ event, fields, line, calls, config }) => ({ event, fields, line, config, calls: calls.map(payload => payload == null ? null : Object.fromEntries(fields.map(field => [field, field in Object(payload)]))) }));
  // and what the elements carry at the end, markup parsed from strings included
  note([document.documentElement, ...created].flatMap(element => [element, ...element.querySelectorAll('[class]')]).flatMap(element => [...element.classList]));
  return { listens, classes: [...seen] };
};
window.__ready = true;
</script></body></html>`;

async function checkBehaviour() {
  const modules = new Map<string, { unit: Unit; code: string; listens: Listen[] }>();
  for (const unit of units) {
    try {
      const { source, listens } = instrument(unit);
      modules.set(unit.id, { unit, code: browserModule(source, unit.lang), listens });
    } catch (error) {
      fail(unit.page, unit.line, 'behaviour', `does not compile: ${(error as Error).message}`);
    }
  }
  // Each example's web component rendering: its markup in the page, the elements
  // defined, then its script
  const elementModules = new Map<string, { rendered: Rendered; code: string }>();
  for (const rendered of examples) {
    const html = rendered.code.html;
    if (html === undefined) continue;
    const script = /<script type="module">\n([\s\S]*?)<\/script>/.exec(html)?.[1] ?? '';
    const markup = html.replace(/<script type="module">[\s\S]*?<\/script>\n?/, '').trim();
    const source = `import 'mtrl/elements/css';\nimport { defineAll } from 'mtrl/elements';\ndocument.body.insertAdjacentHTML('beforeend', ${JSON.stringify(markup)});\ndefineAll();\n${script}${actionsTail(rendered.example)}`;
    try {
      elementModules.set(`${rendered.block.page}/${rendered.block.line}`, { rendered, code: browserModule(source, 'javascript') });
    } catch (error) {
      fail(rendered.block.page, rendered.block.line, 'behaviour', `Web Components: does not compile: ${(error as Error).message}`);
    }
  }
  const prelude = transpiler.transformSync(readFileSync(preludePath, 'utf8'));
  const server = Bun.serve({
    port: 0, hostname: '127.0.0.1',
    async fetch(request) {
      const path = new URL(request.url).pathname;
      if (path === '/') return new Response(harness, { headers: { 'content-type': 'text/html' } });
      if (path === '/prelude.js') return new Response(prelude, { headers: { 'content-type': 'text/javascript' } });
      if (path.startsWith('/element/')) {
        const module = elementModules.get(path.slice(9, -3));
        return module ? new Response(module.code, { headers: { 'content-type': 'text/javascript' } }) : new Response('', { status: 404 });
      }
      if (path.startsWith('/unit/')) {
        const module = modules.get(path.slice(6, -3));
        return module ? new Response(module.code, { headers: { 'content-type': 'text/javascript' } }) : new Response('', { status: 404 });
      }
      if (path.startsWith('/mtrl/')) {
        const file = Bun.file(resolve(mtrlDir, 'dist', path.slice(6)));
        if (await file.exists()) return new Response(file);
      }
      if (path.startsWith('/addons/')) {
        const file = Bun.file(resolve(addonsDir, 'dist', path.slice(8)));
        if (!(await file.exists())) return new Response('', { status: 404 });
        if (!path.endsWith('.mjs')) return new Response(file);
        // Its mtrl is ours
        return new Response((await file.text()).replace(/from\s*"mtrl"/g, 'from "/mtrl/index.js"'), { headers: { 'content-type': 'text/javascript' } });
      }
      // The app's images: a placeholder for every picture an example shows
      if (/\.(jpe?g|png|webp|gif|svg)$/i.test(path)) return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="9"/>', { headers: { 'content-type': 'image/svg+xml' } });
      return new Response('', { status: 404 });
    },
  });
  const browser = await chromium.launch();
  const stats = { units: 0, listeners: 0, exercised: 0, configUncalled: 0, untriggered: [] as string[], classes: new Set<string>(), elements: 0, elementListeners: 0 };
  try {
    const queue = [...modules.values()];
    const worker = async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        const { unit } = job;
        const page = await browser.newPage();
        const problems: string[] = [];
        page.on('pageerror', error => problems.push(error.message.split('\n')[0]!));
        page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') problems.push(`console.${message.type()}: ${message.text().split('\n')[0]}`); });
        page.on('response', response => { if (response.status() >= 400) problems.push(`${response.status()} ${response.url()}`); });
        try {
          await page.goto(`${server.url}`);
          await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready);
          type Result = { listens: { event: string; fields: string[]; line: number; config?: boolean; calls: (Record<string, boolean> | null)[] }[]; classes: string[] };
          const { listens: results, classes } = await page.evaluate(([id, source]) => (window as unknown as { __run: (id: string, source: string) => Promise<Result> }).__run(id!, source!), [unit.id, unit.source]);
          classes.forEach(name => stats.classes.add(name));
          for (const result of results) {
            stats.listeners++;
            const reason = unit.untriggered.get(result.event);
            if (!result.calls.length && result.config) { stats.configUncalled++; continue; }
            if (!result.calls.length) {
              if (reason) stats.untriggered.push(`${unit.page}.md:${result.line} '${result.event}' (${reason})`);
              else fail(unit.page, result.line, 'behaviour', `'${result.event}' was never emitted: the check could not make it fire`);
              continue;
            }
            if (reason) fail(unit.page, result.line, 'behaviour', `'${result.event}' fired: remove its untriggered comment`);
            stats.exercised++;
            // A field may be optional (nativeEvent is there for user changes only), so it
            // must be in one payload at least
            const missing = result.fields.filter(field => !result.calls.some(call => call?.[field]));
            if (missing.length) fail(unit.page, result.line, 'behaviour', `'${result.event}' payload has no ${missing.map(field => `\`${field}\``).join(', ')}`);
          }
        } catch (error) {
          problems.push((error as Error).message.split('\n')[0]!);
        }
        for (const problem of [...new Set(problems)]) fail(unit.page, unit.line, 'behaviour', problem);
        stats.units++;
        await page.close();
      }
    };
    // Every name the prelude declares has a value at runtime
    const declared: string[] = [];
    const visit = (node: ts.Node) => {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) declared.push(node.name.text);
      else if (ts.isFunctionDeclaration(node) && node.name) declared.push(node.name.text);
      ts.forEachChild(node, visit);
    };
    const preludeFile = parse(readFileSync(preludePath, 'utf8'));
    preludeFile.statements.filter(statement => ts.isModuleDeclaration(statement)).forEach(visit);
    const page = await browser.newPage();
    await page.goto(`${server.url}`);
    await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready);
    const missing = await page.evaluate(names => names.filter(name => !(name in window)), declared);
    for (const name of missing) fail('(prelude)', 0, 'behaviour', `${name} is declared but has no value`);
    await page.close();
    await Promise.all(Array.from({ length: 6 }, worker));
    // The web component renderings: every handler's event fires, with its fields in the detail
    const elementQueue = [...elementModules];
    const elementWorker = async () => {
      for (let job = elementQueue.shift(); job; job = elementQueue.shift()) {
        const [id, { rendered }] = job;
        const { page: slug, line } = rendered.block;
        const page = await browser.newPage();
        const problems: string[] = [];
        page.on('pageerror', error => problems.push(error.message.split('\n')[0]!));
        page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') problems.push(`console.${message.type()}: ${message.text().split('\n')[0]}`); });
        page.on('response', response => { if (response.status() >= 400) problems.push(`${response.status()} ${response.url()}`); });
        const tag = `m-${rendered.example.slug}`;
        const handlers = rendered.example.handlers.map(handler => ({ tag, event: handler.event, call: handler.call, fields: [...new Set(handler.args.filter(arg => /^[A-Za-z_$][\w$]*$/.test(arg) && !['true', 'false', 'null'].includes(arg)))] }));
        try {
          await page.goto(`${server.url}`);
          await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready);
          type Result = { event: string; fields: string[]; registered: boolean; calls: (Record<string, boolean> | null)[] }[];
          const results = await page.evaluate(([id, handlers]) => (window as unknown as { __runElement: (id: string, handlers: unknown) => Promise<Result> }).__runElement(id as string, handlers), [id, handlers] as const);
          for (const result of results) {
            stats.elementListeners++;
            const reason = rendered.block.untriggered.get(result.event);
            if (!result.registered) fail(slug, line, 'behaviour', `Web Components: no '${result.event}' listener was added`);
            else if (!result.calls.length) {
              if (reason) stats.untriggered.push(`${slug}.md:${line} Web Components '${result.event}' (${reason})`);
              else fail(slug, line, 'behaviour', `Web Components: '${result.event}' was never dispatched: the check could not make it fire`);
            } else {
              const missing = result.fields.filter(field => !result.calls.some(call => call?.[field]));
              if (missing.length) fail(slug, line, 'behaviour', `Web Components: '${result.event}' detail has no ${missing.map(field => `\`${field}\``).join(', ')}`);
            }
          }
        } catch (error) {
          problems.push((error as Error).message.split('\n')[0]!);
        }
        for (const problem of [...new Set(problems)]) fail(slug, line, 'behaviour', `Web Components: ${problem}`);
        stats.elements++;
        await page.close();
      }
    };
    await Promise.all(Array.from({ length: 6 }, elementWorker));
  } finally {
    await browser.close();
    server.stop(true);
  }
  return stats;
}

// Level 3: classes. A class counts when mtrl's CSS styles it or, after a behaviour run,
// when an example's DOM carries it: a state class the component sets without a rule.
function checkClasses(rendered = new Set<string>()) {
  const css = readFileSync(resolve(mtrlDir, 'dist/styles.css'), 'utf8') + readFileSync(resolve(addonsDir, 'dist/styles.css'), 'utf8');
  const known = new Set([...css.matchAll(/\.(mtrl-[\w-]+)/g)].map(match => match[1]!).concat(...rendered));
  let count = 0;
  for (const block of blocks) {
    const names = block.lang === 'css' ? [...block.code.matchAll(/\.(mtrl-[\w-]+)/g)].map(match => ({ name: match[1]!, index: match.index }))
      : block.lang === 'html' ? [...block.code.matchAll(/class="([^"]*)"/g)].flatMap(match => match[1]!.split(/\s+/).filter(name => name.startsWith('mtrl-')).map(name => ({ name, index: match.index })))
      : [...block.code.matchAll(/['"`][^'"`\n]*?\.(mtrl-[\w-]+)/g)].map(match => ({ name: match[1]!, index: match.index }));
    for (const { name, index } of names) {
      count++;
      if (!known.has(name)) fail(block.page, block.line + block.code.slice(0, index).split('\n').length - 1, 'classes', `.${name} is not in mtrl's CSS`);
    }
  }
  return count;
}

// The React, Vue, Svelte and SolidJS renderings, and the framework blocks, through their compilers
// (Babel names the file it was given with the working directory in front)
const compileMessage = (error: unknown) => (error as Error).message.split('\n')[0]!.replace(`${process.cwd()}/`, '');
async function checkCompile() {
  let count = 0;
  for (const { block, code } of examples) {
    for (const { id, label } of FRAMEWORKS) {
      if (id === 'vanilla' || id === 'html' || code[id] === undefined) continue;
      count++;
      try { await compileFramework(id, code[id]!); } catch (error) { fail(block.page, block.line, 'compile', `${label}: ${compileMessage(error)}`); }
    }
  }
  for (const markup of markups) {
    const { block, framework } = markup;
    try { await compileFramework(framework, block.code); } catch (error) { uncompiled.add(markup); fail(block.page, block.line + (errorLine(error) ?? 1) - 1, 'compile', `${frameworkLabel(framework)}: ${compileMessage(error)}`); }
  }
  return count;
}

const summary: string[] = [];
if (examples.length || blocks.some(block => block.lang === 'example')) summary.push(`examples: ${blocks.filter(block => block.lang === 'example').length} blocks, ${examples.length} rendered in every framework they have`);
if (run('types')) summary.push(`compile: ${await checkCompile()} React, Vue, Svelte and SolidJS renderings`);
if (run('types')) {
  const count = (lang: string, framework?: string) => markups.filter(markup => markup.block.lang === lang && (!framework || markup.framework === framework)).length;
  const fragments = blocks.filter(block => MARKUP.has(block.lang) && block.flags.includes('fragment')).length;
  summary.push(`frameworks: ${markups.length} blocks compiled and type-checked: ${count('vue')} vue, ${count('svelte')} svelte, ${count('tsx', 'react')} tsx and ${count('jsx', 'react')} jsx React, ${count('tsx', 'solid')} tsx and ${count('jsx', 'solid')} jsx SolidJS (${fragments} fragments)`);
}
let rendered: Set<string> | undefined;
if (run('types')) { checkTypes(); summary.push(`types: ${units.length} units from ${scripts.length} blocks (${scripts.filter(block => block.flags.includes('fragment')).length} fragments) and ${examples.length} examples' Vanilla`); }
if (run('behaviour')) {
  const stats = await checkBehaviour();
  rendered = stats.classes;
  summary.push(`behaviour: ${stats.units} units run, ${stats.exercised}/${stats.listeners} event handlers exercised (${stats.configUncalled} config handlers not reached); ${stats.elements} web component renderings, ${stats.elementListeners} listeners`);
  if (stats.untriggered.length) summary.push(`  untriggered by comment: ${stats.untriggered.join('; ')}`);
}
if (run('classes')) summary.push(`classes: ${checkClasses(rendered)} class names in ${blocks.filter(block => block.lang !== 'javascript' && block.lang !== 'typescript').length} css and html blocks, and the scripts`);

const byPage = new Map<string, Failure[]>();
for (const failure of failures.sort((a, b) => a.page.localeCompare(b.page) || a.line - b.line)) byPage.set(failure.page, [...(byPage.get(failure.page) ?? []), failure]);
for (const [page, list] of byPage) {
  const name = page.startsWith('(') ? page : `${page}.md`;
  console.log(`\n${name} (${list.length})`);
  for (const failure of list) console.log(`  ${name}${failure.line ? `:${failure.line}` : ''} [${failure.level}] ${failure.message}`);
}
console.log(`\n${summary.join('\n')}\ndocs: ${pages.length} pages, ${failures.length} failures`);
if (failures.length) process.exit(1);
