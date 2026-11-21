import { readFileSync } from 'node:fs';

// Inline the runtime source before minification, so copied samples stay identical.
// https://bun.sh/docs/bundler/macros
export function stepperDemoSource(): { javascript: string; typescript: string } {
  const typescript = readFileSync(new URL('./stepper-demo-runtime.ts', import.meta.url), 'utf8');
  return { typescript, javascript: new Bun.Transpiler({ loader: 'ts' }).transformSync(typescript) };
}
