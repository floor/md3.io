// The framework renderings of a docs example, through each framework's own compiler,
// as the Examples build compiles them (scripts/build-examples.ts): Svelte's, Vue's
// SFC compiler, Bun's TSX transpiler for React, babel-preset-solid for Solid. A
// rendering that does not compile throws with the compiler's message.
import { transformAsync } from '@babel/core';
import { compile } from 'svelte/compiler';
import { compileScript, compileTemplate, parse } from 'vue/compiler-sfc';
import type { Framework } from '../../src/shared/frameworks';

const tsx = new Bun.Transpiler({ loader: 'tsx', target: 'browser' });

/** The line, from 1, a compiler's error points at in the code it was given, when it says. */
export function errorLine(error: unknown): number | undefined {
  const e = error as { position?: { line?: number }; loc?: { line?: number; start?: { line?: number } }; start?: { line?: number }; errors?: unknown[] };
  return e.position?.line ?? e.loc?.start?.line ?? e.loc?.line ?? e.start?.line ?? (e.errors?.length ? errorLine(e.errors[0]) : undefined);
}

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
      if (errors.length) throw Object.assign(new Error(errors.map(error => error.message).join('; ')), { loc: (errors[0] as { loc?: unknown }).loc });
      // The template compiled inline with the script, as a production build does; a
      // component without a script is its template alone
      if (descriptor.script || descriptor.scriptSetup) compileScript(descriptor, { id: 'example', inlineTemplate: true });
      else if (descriptor.template) {
        const { errors } = compileTemplate({ source: descriptor.template.content, ast: descriptor.template.ast, filename: 'Example.vue', id: 'example' });
        if (errors.length) throw errors[0];
      }
      return;
    }
  }
}
