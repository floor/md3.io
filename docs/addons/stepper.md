---
created: 2026-11-21
updated: 2026-11-21
status: published
---

# Stepper

A stepper breaks a task into an ordered set of panels. It shows progress and keeps the current step identified.

## Create a workflow

```js
import { createStepper } from 'material-addons/components/stepper';
import 'material/styles/base';
import 'material-addons/styles';

const pickup = createStepper({
  ariaLabel: 'Order pickup',
  orientation: 'auto',
  steps: [
    { value: 'store', label: 'Store', content: 'Choose a shop near you.' },
    { value: 'time', label: 'Pickup time', content: 'Select a collection time.' },
  ],
});
document.body.append(pickup.element);
```

Give each step a stable `value` and a clear `label`. Use `linear` when people must complete earlier steps before moving ahead. Call `next()` and `prev()` for panel actions, or `goTo(value)` for a named step. The `beforechange` event can prevent a move, and `change` reports the new step.

## Frameworks

In HTML, declare `<m-step>` children inside `<m-stepper>`. Panel contents stay in the light DOM so inputs and buttons work normally. The adapters provide `Stepper` and `Step`, with `M` prefixes in Vue.

Give the stepper an accessible name that identifies its workflow. The horizontal headers act as tabs. The vertical headers expand their own panels, which suits narrower layouts.
