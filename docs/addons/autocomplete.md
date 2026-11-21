---
created: 2026-11-21
updated: 2026-11-21
status: published
---

# Autocomplete

Autocomplete suggests matching options as someone types. Use it to make a long set of choices searchable.

## Options and selection

Options can be strings or objects with `text`, `value`, and optional `supportingText`. Use `strict` when the field must resolve to a suggestion. Leave it off to accept typed input. The `select` event supplies the chosen option, while `input` follows the text as it changes.

```js
import { createAutocomplete } from 'material-addons/components/autocomplete';
import 'material/styles/text-field';
import 'material-addons/styles';

const destination = createAutocomplete({
  label: 'Destination',
  options: [{ text: 'Athens', value: 'athens' }, { text: 'Lisbon', value: 'lisbon' }],
  openOnFocus: true,
  strict: true,
});
document.body.append(destination.element);
```

## Keyboard

Tab focuses the field. Use the arrow keys to move through suggestions, Enter to choose one, and Escape to dismiss the popup. Supply a visible field label.

## Frameworks

The Web Component and adapters use an Autocomplete option for each choice. Import `defineAutocomplete` from `material-addons/elements/autocomplete` for Web Components. The adapters export `Autocomplete` and `AutocompleteOption`, with `M` prefixes in Vue.
