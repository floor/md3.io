import type { StepperConfig } from 'material-addons/components/stepper';
import type { CodeContext, Framework } from '../frameworks';
import { stepperDemoSource } from './stepper-demo-source' with { type: 'macro' };

const demoStyles = `.stepper-demo { display:grid; gap:18px; text-align:start; }
.stepper-demo h2 { margin:0; font:500 20px/28px var(--mtrl-ref-typeface-plain, sans-serif); }
.stepper-demo p { margin:0; }
.stepper-demo fieldset { display:grid; gap:10px; border:0; padding:0; margin:0; min-width:0; }
.stepper-demo legend { margin-bottom:12px; font-weight:500; }
.stepper-demo .shop { display:flex; gap:12px; align-items:center; padding:14px; border:1px solid var(--mtrl-sys-color-outline-variant); border-radius:12px; cursor:pointer; }
.stepper-demo .shop:has(input:checked) { background:var(--mtrl-sys-color-secondary-container); color:var(--mtrl-sys-color-on-secondary-container); }
.stepper-demo .shop span { display:grid; gap:4px; }
.stepper-demo small { font-size:12px; }
.stepper-demo input { font:inherit; color:inherit; accent-color:var(--mtrl-sys-color-primary); }
.stepper-demo .fields { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(200px,100%),1fr)); gap:16px; }
.stepper-demo .field { display:grid; gap:8px; }
.stepper-demo .field input { box-sizing:border-box; width:100%; min-width:0; padding:12px; border:1px solid var(--mtrl-sys-color-outline); border-radius:6px; background:var(--mtrl-sys-color-surface); }
.stepper-demo .actions { display:flex; flex-wrap:wrap; gap:12px; justify-content:flex-end; }
.stepper-demo [data-demo-summary] { line-height:1.7; }
.stepper-demo [role=status] { color:var(--mtrl-sys-color-primary); font-weight:500; }`;

const actions = (first: boolean, last: boolean) => `<footer class="actions">${first ? '' : '<span data-stepper-prev><m-button variant="outlined">Back</m-button></span>'}<span data-stepper-next><m-button>${last ? 'Confirm' : 'Next'}</m-button></span></footer>`;
const panel = (value: string, title: string, body: string, first: boolean, last = false) => `<section class="stepper-demo" data-demo-step="${value}">
  <h2 tabindex="-1">${title}</h2>
  ${body}
  ${actions(first, last)}
</section>`;

export function stepperSteps(account: boolean): NonNullable<StepperConfig['steps']> {
  const style = `<style>${demoStyles}</style>`;
  return account ? [
    { value: 'details', label: 'Account', content: style + panel('details', 'Create your account', `<p>Enter a name and a valid email address to continue.</p><div class="fields"><label class="field">Full name<input name="name" autocomplete="name" required></label><label class="field">Email<input name="email" type="email" autocomplete="email" required></label></div>`, true) },
    { value: 'workspace', label: 'Workspace', content: panel('workspace', 'Name your workspace', '<label class="field">Workspace name<input name="workspace" required minlength="2" placeholder="Studio team"></label><p>Use at least two characters. Back keeps your account details.</p>', false) },
    { value: 'review', label: 'Review', content: panel('review', 'Review your account', '<p data-demo-summary></p><p>Confirm to finish this example.</p><p role="status" data-demo-confirmation hidden></p>', false, true) },
  ] : [
    { value: 'store', label: 'Store', content: style + panel('store', 'Choose a pickup shop', `<fieldset><legend>Pickup location</legend>
    <label class="shop"><input type="radio" name="shop" value="central" checked><span><strong>Central market</strong><small>12 Market Street · Open until 20:00</small></span></label>
    <label class="shop"><input type="radio" name="shop" value="riverside"><span><strong>Riverside</strong><small>48 River Road · Open until 19:00</small></span></label>
    <label class="shop"><input type="radio" name="shop" value="station"><span><strong>Station square</strong><small>3 Station Square · Open until 22:00</small></span></label>
  </fieldset>`, true) },
    { value: 'time', label: 'Pickup time', content: panel('time', 'Choose your pickup time', '<div class="fields"><label class="field">Pickup date<input name="date" type="date" value="2026-12-10" required></label><label class="field">Pickup time<input name="time" type="time" value="17:30" required></label></div><p>Your order will be ready when you arrive.</p>', false) },
    { value: 'review', label: 'Review', content: panel('review', 'Review your pickup', '<p data-demo-summary></p><p>Check the location and time, or go Back to change them.</p><p role="status" data-demo-confirmation hidden></p>', false, true) },
  ];
}

const literal = (value: string) => '`' + value.replaceAll('`', '\\`').replaceAll('${', '\\${') + '`';
const behaviorSources = stepperDemoSource();
const setup = (context: CodeContext) => `import 'material/styles/base';
import 'material-addons/styles';
import 'material/elements/css/button';
import { defineButton } from 'material/elements';
${context.theme && context.theme !== 'baseline' ? `import 'material/themes/${context.theme}';\n` : ''}
defineButton();
document.documentElement.dataset.theme = ${JSON.stringify(context.theme ?? 'baseline')};
document.documentElement.dataset.themeMode = ${JSON.stringify(context.mode ?? 'light')};
`;

export function stepperDemoCode(framework: Framework, config: StepperConfig, context: CodeContext): string {
  const behavior = (framework === 'vanilla' || framework === 'html' ? behaviorSources.javascript : behaviorSources.typescript).replace(/^export /gm, '');
  const steps = config.steps ?? [];
  const orientation = JSON.stringify(config.orientation ?? 'auto');
  const ariaLabel = JSON.stringify(config.ariaLabel);
  const first = JSON.stringify(steps[0]?.value);
  const data = `const panels = [\n${steps.map(step => `  { value: ${JSON.stringify(step.value)}, label: ${JSON.stringify(step.label)}, html: ${literal(String(step.content))} }`).join(',\n')}\n];\n`;
  const shared = setup(context) + '\n' + data + '\n' + behavior + '\n';
  const props = `linear orientation={${orientation}} autoBreakpoint={480} ariaLabel={${ariaLabel}} defaultValue={${first}}`;
  if (framework === 'vanilla') return `import { createStepper } from 'material-addons/components/stepper';\n${shared}
const stepper = createStepper({
  orientation: ${orientation}, autoBreakpoint: 480, linear: true, ariaLabel: ${ariaLabel},
  steps: panels.map(panel => ({ value: panel.value, label: panel.label, content: panel.html })),
});
stepper.element.style.cssText = 'width:100%;max-width:880px';
document.body.append(stepper.element);
const dispose = wireStepperDemo(stepper.element, stepper);
// When the view leaves: dispose(); stepper.destroy();\n`;
  if (framework === 'html') return `<m-stepper id="stepper" orientation=${orientation} auto-breakpoint="480" linear aria-label=${ariaLabel} value=${first} style="width:100%;max-width:880px">
${steps.map(step => `  <m-step value="${step.value}" label="${step.label}">${step.content}</m-step>`).join('\n')}
</m-step>
<script type="module">
import 'material-addons/elements/css/stepper';
import { defineStepper } from 'material-addons/elements';
${setup(context)}
${behavior}
defineStepper();
const stepper = document.getElementById('stepper');
const dispose = wireStepperDemo(stepper, stepper);
// When the view leaves: dispose(); stepper.remove();
</script>\n`;
  if (framework === 'react') return `import { useEffect, useRef } from 'react';
import { Stepper, Step } from 'material-addons/react';
import type { StepperElement } from 'material-addons/elements/stepper';
${shared}
export function Example() {
  const ref = useRef<StepperElement | null>(null);
  useEffect(() => ref.current ? wireStepperDemo(ref.current, ref.current) : undefined, []);
  return <Stepper ref={ref} ${props} style={{ width: '100%', maxWidth: '880px' }}>
    {panels.map(panel => <Step key={panel.value} value={panel.value} label={panel.label}><div dangerouslySetInnerHTML={{ __html: panel.html }} /></Step>)}
  </Stepper>;
}\n`;
  if (framework === 'solid') return `import { onMount, onCleanup } from 'solid-js';
import { Stepper, Step } from 'material-addons/solid';
import type { StepperElement } from 'material-addons/elements/stepper';
${shared}
export function Example() {
  let ref: StepperElement | undefined;
  onMount(() => { if (ref) onCleanup(wireStepperDemo(ref, ref)); });
  return <Stepper ref={ref} ${props} style={{ width: '100%', 'max-width': '880px' }}>
    {panels.map(panel => <Step value={panel.value} label={panel.label}><div innerHTML={panel.html} /></Step>)}
  </Stepper>;
}\n`;
  if (framework === 'vue') return `<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { MStepper, MStep } from 'material-addons/vue';
${shared}
const refStepper = ref();
let dispose: (() => void) | undefined;
onMounted(() => { const stepper = refStepper.value.element; dispose = wireStepperDemo(stepper, stepper); });
onUnmounted(() => dispose?.());
</script>
<template>
  <MStepper ref="refStepper" linear orientation=${orientation} :auto-breakpoint="480" aria-label=${ariaLabel} default-value=${first} style="width:100%;max-width:880px">
    <MStep v-for="panel in panels" :key="panel.value" :value="panel.value" :label="panel.label"><div v-html="panel.html" /></MStep>
  </MStepper>
</template>\n`;
  return `<script lang="ts">
import { onMount } from 'svelte';
import { Stepper, Step } from 'material-addons/svelte';
${shared}
let refStepper;
onMount(() => { const stepper = refStepper.element; return wireStepperDemo(stepper, stepper); });
</script>
<Stepper bind:this={refStepper} linear orientation=${orientation} autoBreakpoint={480} ariaLabel=${ariaLabel} defaultValue=${first} style="width:100%;max-width:880px">
  {#each panels as panel (panel.value)}<Step value={panel.value} label={panel.label}><div>{@html panel.html}</div></Step>{/each}
</Stepper>\n`;
}
