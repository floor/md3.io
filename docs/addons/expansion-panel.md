---
created: 2026-11-21
updated: 2026-11-21
status: published
---

# Expansion panel

An expansion panel reveals detail from its header. An accordion groups several panels and manages which can open together.

## Create a panel

```js
import { createExpansionPanel } from 'material-addons/components/expansion-panel';
import 'material/styles/base';
import 'material-addons/styles';

const details = createExpansionPanel({
  label: 'Delivery details',
  content: 'Your order arrives in two to four business days.',
  divider: true,
});
document.body.append(details.element);
```

Use `open` to set the initial state and `disabled` to disable the header. The `change` event reports whether a panel opened. For an accordion, pass the panels to `createAccordion` with unique values. Enable `multiSelect` to allow several panels to stay open.

## Keyboard

Give every panel a clear header label. The header is a button that responds to Enter and Space. Focus stays on the header while it opens or closes, so the next Tab can reach controls in the open body.

## Frameworks

Use `<m-expansion-panel>` with body content in the default slot. Define it with `material-addons/elements/expansion-panel` and its shadow CSS. The framework adapters provide `ExpansionPanel` and `Accordion`, with `M` prefixes in Vue.
