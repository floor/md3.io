---
created: 2026-11-21
updated: 2026-11-21
status: published
---

# Skeleton

A skeleton reserves the shape of incoming content during loading. It has no keyboard stop.

## Create a placeholder

```js
import { createSkeleton } from 'material-addons/components/skeleton';
import 'material/styles/base';
import 'material-addons/styles';

const placeholder = createSkeleton({ variant: 'text', lines: 3, motion: 'wave' });
document.body.append(placeholder.element);
```

Use `text` for lines, `circle` for an avatar, or `rect` for a block. Choose `pulse` or `wave` for the motion. Match the content's footprint with the size scale or the `blockSize` and `inlineSize` options.

## Loading state

Replace the placeholder when content is ready. For a group of placeholders, set the containing region's busy state and pass `busy: false` to each skeleton. On a standalone skeleton, the default busy state marks its own root.

## Frameworks

Import `defineSkeleton` and the matching shadow stylesheet from `material-addons/elements` and `material-addons/elements/css/skeleton`. The component is `<m-skeleton>`, and the adapters export `Skeleton` or `MSkeleton` in Vue.
