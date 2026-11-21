/** Bind the same workflow to a factory instance or a framework's stepper element. */
export function wireStepperDemo(root, stepper) {
  const controller = new AbortController();
  const panels = [...root.querySelectorAll('[data-demo-step]')];
  const value = name => root.querySelector(`[name="${name}"]:checked`)?.value
    ?? root.querySelector(`[name="${name}"]`)?.value ?? '';
  const summary = () => {
    const shop = root.querySelector('[name="shop"]:checked')?.closest('label')?.innerText.trim() ?? '';
    const text = root.dataset.workflow === 'account'
      ? `${value('name')} · ${value('email')} · ${value('workspace')}`
      : `${shop} · ${value('date')} at ${value('time')}`;
    root.querySelectorAll('[data-demo-summary]').forEach(node => { node.textContent = text; });
  };
  const beforeChange = event => {
    const move = event.detail ?? event;
    summary();
    if (move.direction !== 'forward') return;
    const panel = panels.find(node => node.dataset.demoStep === move.previousValue);
    const invalid = [...(panel?.querySelectorAll('input') ?? [])].find(input => !input.checkValidity());
    if (invalid) {
      move.preventDefault();
      stepper.setError(move.previousValue, true, 'Complete the required fields');
      invalid.reportValidity();
    } else if (move.previousValue) stepper.setError(move.previousValue, false);
  };
  const complete = () => {
    summary();
    const status = root.querySelector('[data-demo-confirmation]');
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
