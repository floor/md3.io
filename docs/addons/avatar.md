---
created: 2026-11-21
updated: 2026-11-21
status: published
---

# Avatar

Avatar identifies a person with an image, a monogram, or an icon. Use the name and supporting text when the avatar needs to identify its subject on its own.

## Install

```install
material-addons material
```

## Create an avatar

```js
import 'material/styles/base';
import 'material-addons/styles';
import { createAvatar } from 'material-addons/components/avatar';

const avatar = createAvatar({
  variant: 'text',
  text: 'AL',
  label: 'Ada Lovelace',
  supportingText: 'Editor',
});

document.body.append(avatar.element);
```

## Configuration

- `variant` accepts `text`, `image` or `icon`. Text avatars display the first two Unicode code points.
- `size` accepts `small`, `medium` or `large`, which draw a 24, 30 or 40 pixel shape.
- `shape` accepts `round` or `square`. Pass trusted image or icon markup through factory `content` or use the element's default slot.
- Set `href` for a link, or use `onClick` when the avatar triggers an action. Interactive avatars have a target of at least 48 by 48 pixels.

Set `ariaLabel` to supply a name for the control. Use `decorative` when surrounding content already names the person.

## Web Component

```html
<script type="module">
  import 'material/styles/base';
  import 'material-addons/elements/css/avatar';
  import { defineAvatar } from 'material-addons/elements/avatar';
  defineAvatar();
</script>
<m-avatar variant="text" text="AL" label="Ada Lovelace" supporting-text="Editor"></m-avatar>
```
