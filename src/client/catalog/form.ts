import { createFormPreview } from '../form-preview';

export const define = (visual: Element): (() => void) => {
  const status = document.createElement('output');
  status.setAttribute('role', 'status');
  const form = createFormPreview({ label: 'Event registration', name: '', email: '', submit: 'Register' }, message => {
    status.textContent = message;
  });
  visual.replaceChildren(form.element, status);
  return () => form.destroy();
};
