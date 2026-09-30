import { describe, expect, test } from 'bun:test';
import { resolve } from 'node:path';
import ts from 'typescript';
import { svelteToTs, vueToTs, type Generated } from '../scripts/check-docs/templates';

/** The generated line that contains `text`, and the block line it maps to. */
const at = ({ source, lines }: Generated, text: string) => {
  const index = source.split('\n').findIndex(line => line.includes(text));
  return index < 0 ? undefined : lines[index];
};

/** Type-checks generated blocks against mtrl as the docs check does: each block's errors, as `line: message`. */
const typeErrors = (blocks: Generated[]) => {
  const root = resolve(import.meta.dir, '..');
  const files = new Map(blocks.map((block, i) => [resolve(root, '.docs-check', `block-${i}.ts`), block]));
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    lib: ['lib.esnext.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'], types: [], skipLibCheck: true, noEmit: true, strict: true,
  };
  const host = ts.createCompilerHost(options);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (file, language, ...rest) => { const block = files.get(resolve(file)); return block ? ts.createSourceFile(file, block.source, language, true) : getSourceFile(file, language, ...rest); };
  const fileExists = host.fileExists.bind(host);
  host.fileExists = file => files.has(resolve(file)) || fileExists(file);
  const program = ts.createProgram([resolve(root, 'scripts/check-docs/templates.d.ts'), ...files.keys()], options, host);
  const errors = blocks.map(() => [] as string[]);
  for (const diagnostic of ts.getPreEmitDiagnostics(program)) {
    const index = [...files.keys()].indexOf(resolve(diagnostic.file?.fileName ?? ''));
    if (index < 0 || diagnostic.start === undefined) throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, ' '));
    const line = diagnostic.file!.getLineAndCharacterOfPosition(diagnostic.start).line;
    errors[index]!.push(`${blocks[index]!.lines[line]}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`);
  }
  return errors;
};

describe('a named slot, typed against mtrl', () => {
  const vue = (region: string) => vueToTs([
    '<script setup lang="ts">',
    "import { MButton, MDialog } from 'mtrl/vue';",
    '</script>',
    '<template>',
    '  <MDialog>',
    `    <template #${region}><MButton variant="text">Cancel</MButton></template>`,
    '  </MDialog>',
    '</template>',
  ].join('\n'));
  const svelte = (region: string, child = '<Button variant="text">Cancel</Button>') => svelteToTs([
    '<script lang="ts">',
    "  import { Button, Card, Dialog } from 'mtrl/svelte';",
    '  let dialog: { element: HTMLElement | null } | undefined = $state();',
    '  const width = () => dialog?.element?.offsetWidth;',
    '</script>',
    '<Dialog bind:this={dialog}>',
    `  {#snippet ${region}()}${child}{/snippet}`,
    '</Dialog>',
    '<Card>{#snippet headerAction()}x{/snippet}{#snippet subhead()}y{/snippet}</Card>',
  ].join('\n'));
  const [declaredVue, undeclaredVue, badContentVue, declaredSvelte, undeclaredSvelte, badContentSvelte] = typeErrors([
    vue('actions'), vue('footer'), vueToTs('<script setup lang="ts">\nimport { MButton, MDialog } from \'mtrl/vue\';\n</script>\n<template>\n  <MDialog>\n    <template #actions>{{ nowhere }}</template>\n  </MDialog>\n</template>'),
    svelte('actions'), svelte('footer'), svelte('actions', '{nowhere}'),
  ]);

  test('a declared slot types, and its content is typed', () => {
    expect(declaredVue).toEqual([]);
    expect(declaredSvelte).toEqual([]);
    expect(badContentVue!.some(error => error.startsWith('6:') && error.includes("'nowhere'"))).toBe(true);
    expect(badContentSvelte!.some(error => error.startsWith('7:') && error.includes("'nowhere'"))).toBe(true);
  });

  test('an undeclared one fails on its line', () => {
    expect(undeclaredVue!.some(error => error.startsWith('6:') && error.includes('"footer"'))).toBe(true);
    expect(undeclaredSvelte!.some(error => error.startsWith('7:') && error.includes("'footer'"))).toBe(true);
  });
});

describe('a vue block as TypeScript', () => {
  const vue = [
    '<script setup lang="ts">',
    "import { ref } from 'vue';",
    "import { MSwitch, MRadios, MRadio } from 'mtrl/vue';",
    'const wifi = ref(true);',
    'const sizes = [{ value: "s" }];',
    '</script>',
    '',
    '<template>',
    '  <MSwitch v-model="wifi" @change="save($event.detail.checked)">Wi-Fi</MSwitch>',
    '  <MRadios aria-label="Size" @input="(event) => save(event.detail.value)">',
    '    <MRadio v-for="option in sizes" :value="option.value" />',
    '  </MRadios>',
    '</template>',
  ].join('\n');
  const generated = vueToTs(vue);

  test('keeps the script, and reads its bindings unwrapped in the template', () => {
    expect(generated.typescript).toBe(true);
    expect(at(generated, 'const wifi = ref(true);')).toBe(4);
    expect(generated.source).toContain('let { ref, MSwitch, MRadios, MRadio, wifi, sizes } = __scope;');
  });

  test('types each component, its listeners and v-model, on the line it is written', () => {
    expect(at(generated, '__vue(MSwitch, {')).toBe(9);
    expect(at(generated, 'onChange: ($event) => { save($event.detail.checked) },')).toBe(9);
    expect(at(generated, 'wifi = __vueModel(MSwitch, "modelValue");')).toBe(9);
    expect(at(generated, 'ariaLabel: "Size",')).toBe(10);
    expect(at(generated, 'onInput: (event) => save(event.detail.value),')).toBe(10);
    expect(at(generated, 'for (const [option] of __vueFor(sizes)) {')).toBe(11);
  });

  test('types a named slot as one of the component\'s slots, and its content', () => {
    const slots = vueToTs([
      '<template>',
      '  <MDialog headline="Delete draft?">',
      '    <template #actions>',
      '      <MButton variant="text" @click="close">Cancel</MButton>',
      '    </template>',
      '    <template v-slot:headline>Delete {{ name }}?</template>',
      '  </MDialog>',
      '  <MCard v-slot:header-action><MIconButton icon="more" /></MCard>',
      '</template>',
    ].join('\n'));
    expect(at(slots, '__vueSlot(MDialog, "actions");')).toBe(3);
    expect(at(slots, '__vue(MButton, {')).toBe(4);
    expect(at(slots, 'onClick: close,')).toBe(4);
    expect(at(slots, '__vueSlot(MDialog, "headline");')).toBe(6);
    expect(at(slots, 'void (name);')).toBe(6);
    expect(at(slots, '__vueSlot(MCard, "header-action");')).toBe(8);
    expect(slots.source).not.toContain('slot:');
  });

  test('refuses a named slot it cannot type', () => {
    expect(() => vueToTs('<template>\n  <div>\n    <template #actions>x</template>\n  </div>\n</template>')).toThrow('a named slot outside a component');
    expect(() => vueToTs('<template>\n  <MDialog>\n    <template #[region]>x</template>\n  </MDialog>\n</template>')).toThrow('a dynamic slot name');
  });

  test('refuses what it does not type', () => {
    expect(() => vueToTs('<template>\n  <MList>\n    <template #item="{ item }">{{ item }}</template>\n  </MList>\n</template>')).toThrow('a scoped slot is not typed');
  });
});

describe('a svelte block as TypeScript', () => {
  const svelte = [
    '<script lang="ts">',
    "  import { Switch, Radios, Radio } from 'mtrl/svelte';",
    '  let wifi = $state(true);',
    '  const sizes = [{ value: "s" }];',
    '</script>',
    '',
    '<Switch bind:checked={wifi} onchange={(event) => save(event.detail.checked)}>Wi-Fi</Switch>',
    '<Radios ariaLabel="Size">',
    '  {#each sizes as option, i (option.value)}',
    '    <Radio value={option.value} {...{ slot: `item-${i}` }} />',
    '  {/each}',
    '</Radios>',
  ].join('\n');
  const generated = svelteToTs(svelte);

  test('types each component, its bindings, listeners and blocks, on the line it is written', () => {
    expect(generated.typescript).toBe(true);
    expect(at(generated, 'let wifi = $state(true);')).toBe(3);
    expect(at(generated, 'checked: (wifi),')).toBe(7);
    expect(at(generated, 'onchange: ((event) => save(event.detail.checked)),')).toBe(7);
    expect(at(generated, 'ariaLabel: "Size",')).toBe(8);
    expect(at(generated, 'for (const [option, i] of __svelteEach(sizes)) {')).toBe(9);
    expect(at(generated, '...({ slot: `item-${i}` }),')).toBe(10);
  });

  test('types a named snippet as the component\'s prop, with its content, and bind:this as its instance', () => {
    const snippets = svelteToTs([
      '<script lang="ts">',
      "  import { Card, Dialog, Button } from 'mtrl/svelte';",
      '  let dialog = $state();',
      '</script>',
      '',
      '<Dialog bind:this={dialog} open>',
      '  {#snippet headline()}Delete {name}?{/snippet}',
      '  <p>Gone for good.</p>',
      '  {#snippet actions()}',
      '    <Button onclick={close}>Cancel</Button>',
      '  {/snippet}',
      '</Dialog>',
      '<Card>{#snippet headerAction(size: number)}<b>{size}</b>{/snippet}</Card>',
    ].join('\n'));
    expect(at(snippets, 'headline: __svelteSnippet(() => {')).toBe(7);
    expect(at(snippets, 'void (name);')).toBe(7);
    expect(at(snippets, 'actions: __svelteSnippet(() => {')).toBe(9);
    expect(at(snippets, 'onclick: (close),')).toBe(10);
    expect(at(snippets, 'dialog = __svelteInstance(Dialog);')).toBe(6);
    expect(at(snippets, 'headerAction: __svelteSnippet((size: number) => {')).toBe(13);
    expect(at(snippets, 'void (size);')).toBe(13);
    // the snippets are the component's props, before its children
    const source = snippets.source;
    expect(source.indexOf('actions: __svelteSnippet')).toBeLessThan(source.indexOf('__svelteElement("p"'));
  });

  test('refuses a snippet it cannot type', () => {
    expect(() => svelteToTs('{#snippet row(item)}\n  <p>{item}</p>\n{/snippet}')).toThrow('a snippet outside a component');
    expect(() => svelteToTs('<div>\n  {#snippet row()}x{/snippet}\n</div>')).toThrow('a snippet outside a component');
    expect(() => svelteToTs('<Button>\n  {#snippet onclick()}x{/snippet}\n</Button>')).toThrow('named as an event prop');
  });
});
