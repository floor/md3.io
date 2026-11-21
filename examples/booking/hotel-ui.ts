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
        declaration?.toggleAttribute('error', step.error);
        declaration?.toggleAttribute('no-edit', !step.editable);
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

// Editing an earlier decision invalidates later completion, so linear header
// navigation cannot skip a room that no longer fits the changed party.
import { EXTRAS, STEPS, type Booking } from './shared';
export function invalidateSteps(stepper: {completeStep(target:string,completed:boolean):unknown}|null|undefined, patch:Partial<Booking>):void {
  const keys=Object.keys(patch);
  const start=keys.some(key=>['checkIn','checkOut','adults','children','rooms'].includes(key))?1:
    keys.some(key=>['room','rate'].includes(key))?2:
    keys.some(key=>EXTRAS.some(extra=>extra.key===key))?3:
    keys.some(key=>key!=='roomChosen')?4:0;
  if(start)for(const step of STEPS.slice(start-1))stepper?.completeStep(step.value,false);
}
