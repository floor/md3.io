import { createForm } from 'material-addons';
import createButton from 'material/components/button';
import createTextField from 'material/components/text-field';
import type { FormDemo } from '../shared/content/form';

export function createFormPreview({ label, name, email, submit }: FormDemo, report: (message: string) => void = () => {}) {
  const form = createForm({
    layout: [
      [createTextField, 'name', { label: 'Name', required: true }],
      [createTextField, 'email', { label: 'Email', type: 'email', required: true }],
      [createButton, 'submit', { text: submit }],
    ],
    data: { name, email },
    onSubmit: async () => { report('Form submitted'); },
  });
  form.form.setAttribute('aria-label', label);
  return form;
}
