---
created: 2026-09-30
updated: 2026-09-30
status: published
---

# Vue

`mtrl/vue` has a Vue 3 component for every mtrl web component, for Vue 3.3 or later and Nuxt.
Each one renders its `<m-*>` element, so it looks and behaves exactly as the element does. This
page covers only what is particular to Vue; [Getting started](../getting-started/) has the
install and the base stylesheet, and each component page has its options and events.

## Components

The components are named after the element with an `M` in front: `MButton`, `MSwitch`,
`MTextfield`, `MTabs`. Import them where you use them:

```vue
<script setup lang="ts">
import { MButton, MSwitch } from 'mtrl/vue';
</script>

<template>
  <MSwitch>Wi-Fi</MSwitch>
  <MButton variant="filled">Save</MButton>
</template>
```

There is no plugin to install. For global registration, pass them to `app.component()` as you
would any component. A component registers its element the first time it mounts, and importing
`mtrl/vue` loads the elements' styles, so the base stylesheet is the only CSS you add.

`<m-switch>` written directly in a template is the web component itself, which Vue first tries
to resolve as a Vue component and warns about. If you mix bare elements in, tell the compiler
they are custom elements with `compilerOptions.isCustomElement: (tag) => tag.startsWith('m-')`
(in `@vitejs/plugin-vue`'s `template` options, or `vue.compilerOptions` in `nuxt.config`). The
`M` components don't need it.

## Props

A component's props are its element's attributes, written as any Vue prop: kebab-case or
camelCase, bound with `:` for numbers, booleans and expressions.

```vue
<script setup lang="ts">
import { MSlider, MTextfield } from 'mtrl/vue';
</script>

<template>
  <MTextfield label="Email" type="email" supporting-text="We never share it" required />
  <MSlider aria-label="Volume" :min="0" :max="100" :step="5" />
</template>
```

They are rendered as attributes, so server markup carries them. `false` removes a boolean
attribute. Anything else you pass, such as `class`, `id` or `data-*`, lands on the element as
Vue's fallthrough attributes do.

The live state (`checked`, `value`, `selected`) is a prop too, written to the element as a
property. Its attribute is the element's default, as `checked` is on a native checkbox, and
takes the `default` prefix: `default-checked`, `default-value`.

## Events

Each element event is a Vue event of the same name: `@change`, `@input`, `@open`, `@close`,
`@select`. The payload is the element's `CustomEvent`, with the data in `detail`; every
component page lists its events and their fields.

```vue
<script setup lang="ts">
import { MSwitch, MTextfield } from 'mtrl/vue';

function setWifi(on: boolean) {
  console.log('Wi-Fi', on);
}
function search(query: string) {
  console.log('Searching for', query);
}
</script>

<template>
  <MSwitch @change="setWifi($event.detail.checked)">Wi-Fi</MSwitch>
  <MTextfield label="Search" @input="(event) => search(event.detail.value)" />
</template>
```

The events are typed, so `event.detail` is checked in your editor. Native events such as
`@click` or `@focus` are not the component's own: they fall through to the element, and the
handler receives the browser's event.

## v-model

`v-model` binds the element's model: the property that holds its value.

| Components | `v-model` binds |
|------------|-----------------|
| `MSwitch`, `MCheckbox` | `checked` |
| `MIconButton` (a toggle) | `selected` |
| `MCarousel` | `index` |
| `MTextfield`, `MSlider`, `MSelect`, `MRadios`, `MTabs`, `MChips`, `MList`, `MSearch`, `MDatepicker`, `MTimepicker`, `MNavigationRail`, `MDrawer`, `MButtonGroup` | `value` |

Under it are `modelValue` and `update:modelValue`. Every live property also has its own
`v-model:<name>`, such as `v-model:indeterminate` on a checkbox.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { MSwitch, MTabs, MTab } from 'mtrl/vue';

const wifi = ref(true);
const tab = ref('songs');
</script>

<template>
  <MSwitch v-model="wifi">Wi-Fi</MSwitch>
  <MTabs v-model="tab">
    <MTab value="songs">Songs</MTab>
    <MTab value="albums">Albums</MTab>
  </MTabs>
  <p>Wi-Fi is {{ wifi ? 'on' : 'off' }}, showing {{ tab }}.</p>
</template>
```

The binding updates after each of the element's events, so a text field's `v-model` follows
every keystroke. A prop without a listener doesn't hold the element: as with a native input,
`:checked="false"` alone lets the user turn the switch on. Bind with `v-model`, or pair the prop
with its event.

A dialog, a sheet or a menu opens from its `open` attribute. Bind it, and put your state back in
step when the user closes it:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MDialog } from 'mtrl/vue';

const open = ref(false);
</script>

<template>
  <MButton @click="open = true">Delete</MButton>
  <MDialog :open="open" headline="Delete draft?" @close="open = false">
    <p>The draft will be deleted for good.</p>
    <MButton slot="actions" variant="text" @click="open = false">Cancel</MButton>
    <MButton slot="actions" variant="text" @click="open = false">Delete</MButton>
  </MDialog>
</template>
```

## Slots and children

The default slot becomes the element's children: a button's label, a dialog's or a card's
content. A component's named regions, such as a dialog's `headline` and `actions` or a top app
bar's `leading` and `trailing`, are the element's named slots. Give the child a `slot`
attribute, as the dialog above does. Vue's own named slots (`<template #actions>`) are not
rendered, so the `slot` attribute is the only way in.

Lists of items are declared with child components: `MTab`, `MRadio`, `MChip`, `MListItem`,
`MMenuItem`, `MSelectOption`, `MSearchSuggestion`, `MNavigationRailItem`, `MDrawerItem`,
`MButtonGroupItem` and `MCarouselItem`. They render nothing themselves; their parent reads them.
Keep them direct children of their parent, with no element in between. `v-for` and `v-if` are
fine: the parent reads them again when they change.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { MRadios, MRadio } from 'mtrl/vue';

const sizes = [{ value: 's', label: 'Small' }, { value: 'm', label: 'Medium' }, { value: 'l', label: 'Large' }];
const size = ref('m');
</script>

<template>
  <MRadios v-model="size" aria-label="Size">
    <MRadio v-for="option in sizes" :key="option.value" :value="option.value">{{ option.label }}</MRadio>
  </MRadios>
</template>
```

## Template refs

A template ref gives the component instance, whose `element` is the `<m-*>` element, with its
properties and methods. It is `null` until the component mounts. `Exposed` types it:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MTextfield, type Exposed } from 'mtrl/vue';
import type { TextfieldElement } from 'mtrl/elements';

const field = ref<InstanceType<typeof MTextfield> & Exposed<TextfieldElement>>();
</script>

<template>
  <MTextfield ref="field" label="Name" default-value="Ada Lovelace" />
  <MButton @click="field?.element?.select()">Select the name</MButton>
</template>
```

## Nuxt and server rendering

The components render on the server. Nuxt's HTML has each element's tag, its attributes and
its slotted children, and a bound value as its attribute: `v-model` on a switch that is on
renders `<m-switch checked>`. Every module imports safely without a DOM, and the element
registers in `onMounted`, so it upgrades as the page hydrates. You don't need `<ClientOnly>` for
them; keep it for your own browser-only code. A ref's `element` is `null` on the server, so
reach it in `onMounted` or in an event handler.

Until an element upgrades, it has no shadow root and so none of its styles. The pre-upgrade
stylesheet gives each element its final size and look meanwhile, so the page doesn't shift when
the script arrives. Load it globally, in `app.vue` or in `nuxt.config`'s `css`:

```typescript
import 'mtrl/elements/preupgrade.css';
```

[Server rendering](../server-rendering/) explains what the server sends and how the upgrade
happens, for every framework.
