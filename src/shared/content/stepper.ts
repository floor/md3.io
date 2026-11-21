import type { StepperConfig } from 'material-addons/components/stepper';
import { choose, pick, section, type ComponentDefinition } from './types';

const orientations = ['auto', 'horizontal', 'vertical'] as const;
const plans = {
  pickup: [
    { value: 'store', label: 'Store', content: 'Choose a shop near you.' },
    { value: 'time', label: 'Pickup time', content: 'Select a time to collect the order.' },
    { value: 'review', label: 'Review', content: 'Check the store and time before placing your order.' },
  ],
  account: [
    { value: 'details', label: 'Account', content: 'Enter the name and email for the account.' },
    { value: 'workspace', label: 'Workspace', content: 'Name the workspace and invite your team.' },
    { value: 'review', label: 'Review', content: 'Check your account and workspace details.' },
  ],
};

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
    { id: 'account-setup', name: 'Account setup', description: 'Review the stages of starting a new workspace.', options: { workflow: 'account', orientation: 'vertical' }, source: 'https://github.com/floor/material-addons/tree/v3.2.0#stepper' },
  ],
  config: state => {
    const account = state.workflow === 'account';
    return { steps: account ? plans.account : plans.pickup, ariaLabel: account ? 'Account setup' : 'Order pickup', orientation: pick(state, 'orientation', orientations, 'auto'), labelPlacement: 'bottom' };
  },
};
