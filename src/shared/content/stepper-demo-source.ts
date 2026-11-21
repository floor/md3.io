import { readFileSync } from 'node:fs';

// Inline the runtime source before minification, so copied samples stay identical.
// https://bun.sh/docs/bundler/macros
export function stepperDemoSource(): string {
  return readFileSync(new URL('./stepper-demo-runtime.js', import.meta.url), 'utf8');
}
