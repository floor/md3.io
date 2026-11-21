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

// Global ARIA attributes on m-button's host do not describe its shadow button.
// Keep the actual control's expanded state and panel reference in sync.
export function watchSummary(root:HTMLElement):()=>void {
  let pending=0;
  const sync=()=>{
    cancelAnimationFrame(pending);
    pending=requestAnimationFrame(()=>{
      const host=root.querySelector<HTMLElement>('.booking__summary-toggle');
      const button=host?.shadowRoot?.querySelector('button')??host;
      const panel=root.querySelector<HTMLElement>('#price-summary');
      if(!button||!panel)return;
      const expanded=String(root.querySelector('.booking__summary-wrap')?.classList.contains('booking__summary-wrap--open')??false);
      if(button.getAttribute('aria-expanded')!==expanded)button.setAttribute('aria-expanded',expanded);
      if(button.getAttribute('aria-controls')!==panel.id)button.setAttribute('aria-controls',panel.id);
      if('ariaControlsElements' in button)(button as HTMLElement&{ariaControlsElements:Element[]}).ariaControlsElements=[panel];
    });
  };
  const observer=new MutationObserver(sync);observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-expanded']});sync();
  return ()=>{cancelAnimationFrame(pending);observer.disconnect();};
}
export function watchHotel(root:HTMLElement,stepper:StepperElement):()=>void {
  const stopStepper=watchStepper(stepper),stopSummary=watchSummary(root);
  return ()=>{stopStepper();stopSummary();};
}
