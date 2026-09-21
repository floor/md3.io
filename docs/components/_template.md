# <Component>

<!--
The template every component doc follows. Copy it, keep the section order, and
delete any section that genuinely does not apply.

Two rules the test suite enforces (test/docs.test.ts):

  1. Every name in an Option or Method table must exist in the component's
     TypeScript source. Do not document an API you have not read.
  2. A doc that no page loads is a failure. Wire it with createDocs() in the
     component's client/content/components/<name>/index.js.

One rule it cannot enforce, so hold yourself to it: every measurement in the
Measurements table names the M3 token it comes from. A number without a source
cannot be checked, and this library has already shipped a wrong one that way.
-->

One paragraph: what the component is and when to reach for it. Say what it is
for, not what it looks like.

## Import

```javascript
import { createComponent } from 'mtrl'
```

## Basic Usage

The shortest thing that works, with real option names.

```javascript
const component = createComponent({
  // ...
})
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `option` | `type` | `default` | What it does |

## Component API

Group the methods under `###` headings when there are more than about six.

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `method(arg)` | `arg: type` | `Component` | What it does |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `change` | `{ value }` | When it fires |

## Examples

Two or three that answer a real question. Prefer the examples the showcase
already demonstrates, so the page and the doc agree.

## Accessibility

What roles and ARIA attributes the component sets, what the keyboard does, and
anything the consumer still has to provide.

## Styling

The CSS custom properties and BEM classes a consumer may reasonably target.

## Measurements

Spec-derived values, each with the token it comes from, so the next person can
check it rather than trust it.

| Attribute | Value | Token |
|-----------|-------|-------|
| Container corner | 16dp | `ContainerShape` (CornerLarge) |
