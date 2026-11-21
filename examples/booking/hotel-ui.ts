// The HTML and framework adapters keep their own controls. This only synchronizes
// the addon's responsive label setting; changing it rebuilds the host, so retain
// the completed steps and active value through the public declaration attributes.
import type { StepperElement } from 'material-addons/elements';
export function watchStepper(host: StepperElement): () => void {
  let pending = 0;
  const update = () => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => {
      if (!host.component) return;
      const placement = host.getResolvedOrientation() === 'horizontal' ? 'bottom' : 'end';
      if (host.getAttribute('label-placement') === placement) return;
      const value = host.getValue();
      for (const step of host.getSteps()) {
        const declaration = host.querySelector(`m-step[value="${step.value}"]`);
        declaration?.toggleAttribute('completed', step.completed);
      }
      if (value) host.setAttribute('value', value);
      host.setAttribute('label-placement', placement);
    });
  };
  host.addEventListener('orientationchange', update);
  const observer = new ResizeObserver(update);
  observer.observe(host);
  update();
  return () => { cancelAnimationFrame(pending); observer.disconnect(); host.removeEventListener('orientationchange', update); };
}
export function focusControl(host: HTMLElement | null | undefined): void {
  if (!host) return;
  const root = host.shadowRoot ?? host;
  (root.querySelector<HTMLElement>('input, textarea, button, [role="combobox"]') ?? host).focus();
}
