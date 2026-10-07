// The dialog's playground content: its named content sets and its registry entry.
import type { DialogConfig } from 'material/components/dialog';
import { type ComponentState, type Control, type Scenario, bool, choose, paragraph, section, string, text, toggle } from './types';

/** A named dialog: the headline, body and action buttons the guidelines figure shows. */
interface DialogSet {
  name: string;
  title: string;
  body: string;
  buttons: NonNullable<DialogConfig['buttons']>;
}

/**
 * Named dialogs from m3.material.io/components/dialogs/guidelines (read 6 October
 * 2026). `default` is not here: today's save-changes dialog stays exactly as it
 * was. The guidelines' create-event figure is not a set: its Create action sits
 * in the header, which this dialog builds from title, subtitle and close only —
 * see briefs/gaps.md.
 */
const dialogSets: Record<string, DialogSet> = {
  'location-permission': {
    name: 'Location permission',
    title: 'Use location service?',
    body: 'Let this service help other apps determine your location. This means sharing anonymous location data, even when no apps are running.',
    buttons: [{ text: 'Disagree', variant: 'text' }, { text: 'Agree', variant: 'tonal' }],
  },
  'discard-draft': {
    name: 'Discard draft',
    title: 'Discard unsaved changes?',
    body: "You have changes that won't be saved if you close.",
    buttons: [{ text: 'Keep editing', variant: 'text' }, { text: 'Discard', variant: 'text' }],
  },
  'out-of-stock': {
    name: 'Out of stock',
    title: 'Out of stock',
    body: 'The item in your cart is no longer available',
    buttons: [{ text: 'OK', variant: 'text' }],
  },
};

const dialogSet = (state: ComponentState): DialogSet | undefined => dialogSets[string(state, 'dialogSet')];

const dialogSetControl: Control = {
  ...choose('dialogSet', 'Dialog', ['default', 'location-permission', 'discard-draft', 'out-of-stock'], 'default', 'select'),
  labels: { default: 'Default', ...Object.fromEntries(Object.entries(dialogSets).map(([id, set]) => [id, set.name])) },
};

/**
 * The dialog's scenarios, from m3.material.io (read 6 October 2026). Options name
 * playground controls only; every one opens declared, like a dialog caught mid-task.
 */
const dialogScenarios: readonly Scenario[] = [
  {
    id: 'location-permission', name: 'Location permission', source: 'https://m3.material.io/components/dialogs/guidelines',
    description: "A first-run ask to share location even when no apps are running; the two buttons make either answer one tap.",
    options: { dialogSet: 'location-permission', open: true, closeButton: false, actions: true },
  },
  {
    id: 'discard-draft', name: 'Discard draft', source: 'https://m3.material.io/components/dialogs/guidelines',
    description: 'Closing an editor with changes unsaved: go back to editing, or throw the draft away.',
    options: { dialogSet: 'discard-draft', open: true, closeButton: false, actions: true },
  },
  {
    id: 'out-of-stock', name: 'Out of stock', source: 'https://m3.material.io/components/dialogs/guidelines',
    description: "Checkout finds the cart's item no longer available; one acknowledgement closes the notice.",
    options: { dialogSet: 'out-of-stock', open: true, closeButton: false, actions: true },
  },
];

export const dialogComponent = {
  group: 'Containment', name: 'Dialog', factory: 'createDialog', variable: 'dialog',
  description: 'Focus on a decision. Open a dialog to try its content, actions, and dismissal behavior.',
  summary: 'A focused surface for a task or decision.', styles: ['progress', 'button', 'divider', 'dialog'],
  scenarios: dialogScenarios,
  controls: [
    ...section('Appearance', [choose('size', 'Size', ['small', 'medium', 'large', 'fullwidth', 'fullscreen'], 'small', 'select'), choose('animation', 'Animation', ['scale', 'slide-up', 'slide-down', 'fade'], 'scale', 'select'), toggle('divider', 'Dividers')]),
    ...section('Content', [dialogSetControl, { ...text('title', 'Title', 'Save your changes?'), enabledWhen: 'dialogContentDefault', replaced: true }, { ...text('subtitle', 'Subtitle', ''), enabledWhen: 'dialogContentDefault', replaced: true }, { ...text('content', 'Body', 'Keep your changes before leaving this view.'), enabledWhen: 'dialogContentDefault', replaced: true }, toggle('actions', 'Show actions', true), choose('footerAlignment', 'Action alignment', ['right', 'left', 'center', 'space-between'], 'right', 'select')]),
    ...section('Behavior', [toggle('open', 'Open'), toggle('closeButton', 'Close button', true), toggle('closeOnOverlayClick', 'Dismiss on scrim', true), toggle('closeOnEscape', 'Dismiss with Escape', true)]),
  ],
  config: (state: ComponentState): DialogConfig => {
    const named = dialogSet(state);
    const title = named?.title ?? string(state, 'title');
    return {
      ...(named ? { title, content: paragraph(named.body) } : { title, subtitle: string(state, 'subtitle'), content: paragraph(string(state, 'content')) }),
      ariaLabel: title.trim() || 'Example dialog',
      size: string(state, 'size'),
      animation: string(state, 'animation'),
      divider: bool(state, 'divider'),
      open: bool(state, 'open'),
      closeButton: bool(state, 'closeButton'),
      closeOnOverlayClick: bool(state, 'closeOnOverlayClick'),
      closeOnEscape: bool(state, 'closeOnEscape'),
      footerAlignment: string(state, 'footerAlignment'),
      buttons: named
        ? (state.actions ? named.buttons.map((button) => ({ ...button, closeDialog: true })) : [])
        : state.actions
          ? [{ text: 'Cancel', variant: 'text', closeDialog: true }, { text: 'Save', variant: 'filled', closeDialog: true }]
          : [],
    };
  },
};
