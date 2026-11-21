import type { StepperConfig } from 'material-addons/components/stepper';
import { choose, pick, section, type ComponentDefinition } from './types';
import { stepperSteps } from './stepper-demo';

const orientations = ['auto', 'horizontal', 'vertical'] as const;

export const stepperComponent: ComponentDefinition<StepperConfig> = {
  group: 'Add-ons', name: 'Stepper', factory: 'createStepper', variable: 'stepper',
  description: 'Break a task into steps and show one panel at a time.',
  summary: 'Guide someone through a multi-step task.',
  styles: [],
  previewLayout: 'fill',
  controls: [
    ...section('Content', [choose('workflow', 'Workflow', ['pickup', 'account'], 'pickup', 'select')]),
    ...section('Layout', [choose('orientation', 'Orientation', orientations, 'auto')]),
  ],
  scenarios: [
    { id: 'pickup-order', name: 'Order pickup', description: 'Edit the store and pickup time before reviewing an order.', options: { workflow: 'pickup' }, source: 'https://github.com/floor/material-addons/tree/v3.2.0#stepper' },
    { id: 'account-setup', name: 'Account setup', description: 'Create an account and workspace, with required fields checked before moving on.', options: { workflow: 'account', orientation: 'vertical' }, source: 'https://github.com/floor/material-addons/tree/v3.2.0#stepper' },
  ],
  config: state => {
    const account = state.workflow === 'account';
    return { steps: stepperSteps(account), ariaLabel: account ? 'Account setup' : 'Order pickup', orientation: pick(state, 'orientation', orientations, 'auto'), autoBreakpoint: 480, linear: true };
  },
};
