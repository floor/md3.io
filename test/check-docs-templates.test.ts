import { describe, expect, test } from 'bun:test';
import { svelteToTs, vueToTs, type Generated } from '../scripts/check-docs/templates';

/** The generated line that contains `text`, and the block line it maps to. */
const at = ({ source, lines }: Generated, text: string) => {
  const index = source.split('\n').findIndex(line => line.includes(text));
  return index < 0 ? undefined : lines[index];
};

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

  test('refuses what it does not type', () => {
    expect(() => svelteToTs('{#snippet row(item)}\n  <p>{item}</p>\n{/snippet}')).toThrow('SnippetBlock is not typed');
  });
});
