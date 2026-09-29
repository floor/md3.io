// The framework renderings of a docs example, through each framework's own compiler,
// as the Examples build compiles them (scripts/build-examples.ts): Svelte's, Vue's
// SFC compiler, Bun's TSX transpiler for React, babel-preset-solid for Solid. A
// rendering that does not compile throws with the compiler's message.
import { transformAsync } from '@babel/core';
import { compile } from 'svelte/compiler';
import { compileScript, parse } from 'vue/compiler-sfc';
import type { Framework } from '../../src/shared/frameworks';

const tsx = new Bun.Transpiler({ loader: 'tsx', target: 'browser' });

export async function compileFramework(framework: Exclude<Framework, 'vanilla' | 'html'>, code: string): Promise<void> {
  switch (framework) {
    case 'react':
      tsx.transformSync(code);
      return;
    case 'solid':
      await transformAsync(code, {
        filename: 'example.tsx', babelrc: false, configFile: false,
        presets: [['babel-preset-solid', { generate: 'dom' }], ['@babel/preset-typescript', { isTSX: true, allExtensions: true }]],
      });
      return;
    case 'svelte':
      compile(code, { filename: 'Example.svelte', generate: 'client' });
      return;
    case 'vue': {
      const { descriptor, errors } = parse(code, { filename: 'Example.vue' });
      if (errors.length) throw new Error(errors.map(error => error.message).join('; '));
      // The template compiled inline with the script, as a production build does.
      compileScript(descriptor, { id: 'example', inlineTemplate: true });
      return;
    }
  }
}
