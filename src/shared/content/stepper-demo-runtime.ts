import type { StepperBeforeChangeEvent, StepperComponent } from 'material-addons/components/stepper';

type DemoStepper = { setError(value: string, error: boolean, message?: string): unknown; on?: StepperComponent['on']; off?: StepperComponent['off'] };

/** Bind the same workflow to a factory instance or a framework's stepper element. */
export function wireStepperDemo(root: HTMLElement, stepper: DemoStepper) {
  const controller = new AbortController();
  const panels = [...root.querySelectorAll<HTMLElement>('[data-demo-step]')];
  const value = (name: string) => root.querySelector<HTMLInputElement>(`[name="${name}"]:checked`)?.value
    ?? root.querySelector<HTMLInputElement>(`[name="${name}"]`)?.value ?? '';
  const summary = () => {
    const shop = root.querySelector<HTMLInputElement>('[name="shop"]:checked')?.closest('label')?.innerText.trim() ?? '';
    const text = root.dataset.workflow === 'account'
      ? `${value('name')} · ${value('email')} · ${value('workspace')}`
      : `${shop} · ${value('date')} at ${value('time')}`;
    root.querySelectorAll('[data-demo-summary]').forEach(node => { node.textContent = text; });
  };
  const beforeChange = (event: Event | StepperBeforeChangeEvent) => {
    const move = 'detail' in event ? (event as CustomEvent<StepperBeforeChangeEvent>).detail : event as StepperBeforeChangeEvent;
    summary();
    if (move.direction !== 'forward') return;
    const panel = panels.find(node => node.dataset.demoStep === move.previousValue);
    const invalid = [...(panel?.querySelectorAll<HTMLInputElement>('input') ?? [])].find(input => !input.checkValidity());
    if (invalid) {
      move.preventDefault();
      stepper.setError(move.previousValue, true, 'Complete the required fields');
      invalid.reportValidity();
    } else if (move.previousValue) stepper.setError(move.previousValue, false);
  };
  const complete = () => {
    summary();
    const status = root.querySelector<HTMLElement>('[data-demo-confirmation]');
    if (!status) return;
    status.hidden = false;
    status.textContent = root.dataset.workflow === 'account' ? 'Account setup complete.' : 'Pickup confirmed.';
  };
  root.addEventListener('input', summary, { signal: controller.signal });
  root.addEventListener('change', summary, { signal: controller.signal });
  if (typeof stepper.on === 'function') {
    stepper.on('beforechange', beforeChange);
    stepper.on('complete', complete);
  } else {
    root.addEventListener('beforechange', beforeChange, { signal: controller.signal });
    root.addEventListener('complete', complete, { signal: controller.signal });
  }
  summary();
  return () => {
    controller.abort();
    if (typeof stepper.off === 'function') {
      stepper.off('beforechange', beforeChange);
      stepper.off('complete', complete);
    }
  };
}
