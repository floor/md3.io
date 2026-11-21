import { choose, section, type ComponentDefinition } from './types';

export interface FormDemo {
  label: string;
  name: string;
  email: string;
  submit: string;
}

export const formComponent: ComponentDefinition<FormDemo> = {
  group: 'Add-ons', name: 'Form', factory: 'createForm', variable: 'form',
  description: 'Build fields from a layout, validate their values, and track edits before submission.',
  summary: 'Create a form with fields, validation, and submission.',
  styles: ['text-field', 'button'],
  previewLayout: 'fill',
  controls: section('Content', [choose('workflow', 'Form', ['registration', 'contact'], 'registration', 'select')]),
  scenarios: [
    { id: 'event-registration', name: 'Event registration', description: 'Collect a required name and email address for an event.', options: { workflow: 'registration' }, source: 'https://github.com/floor/material-addons/tree/v3.2.0#form' },
    { id: 'contact-details', name: 'Contact details', description: 'Edit existing contact information and save the changes.', options: { workflow: 'contact' }, source: 'https://github.com/floor/material-addons/tree/v3.2.0#form' },
  ],
  config: state => state.workflow === 'contact'
    ? { label: 'Contact details', name: 'Ada Lovelace', email: 'ada@example.com', submit: 'Save' }
    : { label: 'Event registration', name: '', email: '', submit: 'Register' },
};

export function formSnippet({ label, name, email, submit }: FormDemo): string {
  return `import { createForm } from 'material-addons';
import { createButton, createTextField } from 'material';
import 'material/styles/base';
import 'material/styles/text-field';
import 'material/styles/button';
import 'material-addons/styles';

const form = createForm({
  layout: [
    [createTextField, 'name', { label: 'Name', required: true }],
    [createTextField, 'email', { label: 'Email', type: 'email', required: true }],
    [createButton, 'submit', { text: ${JSON.stringify(submit)} }],
  ],
  data: ${JSON.stringify({ name, email })},
  onSubmit: async data => console.log(data),
});
form.form.setAttribute('aria-label', ${JSON.stringify(label)});
document.body.append(form.element);

// When the view is removed:
// form.destroy();
`;
}
