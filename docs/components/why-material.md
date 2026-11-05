---
created: 2026-11-05
updated: 2026-11-05
status: published
description: Material 3 and Expressive coverage, measured bundle sizes, browser and server support, release history, and alternatives for the web.
---

# Why material

`material` is an independent Material Design 3 component library for the web, with Expressive
components, plain JavaScript factories, web components, and framework bindings. This guide
sets out what it ships, what a page downloads, and the limits to check before choosing it.
See [Getting started](getting-started.md) for installation.

## Material 3 and Expressive coverage

Google describes [M3 Expressive as an evolution of Material 3](https://m3.material.io/blog/building-with-m3-expressive),
with new and updated components, spring motion, and changes to shape, colour and typography.
It does not replace every baseline component. `material` combines baseline components with
Expressive controls and styling; the table below describes its shipped scope, rather than
claiming that every option in the design guidelines is implemented.

These are the library's **37 components**, grouped as in the [component catalogue](/components/).
Each link opens the reference for that component's options and limitations. Forms and colour
pickers are additional references for `material-addons`, outside this count.

### Actions

| Component | What ships |
|-----------|------------|
| [Button](button.md) | Filled, tonal, elevated, outlined and text; Expressive sizes and round or square shapes. |
| [Icon button](icon-button.md) | Standard, filled, tonal and outlined; toggles, Expressive sizes, shapes and widths. |
| [Button group](button-group.md) | Standard and connected groups, with selection and shape changes. |
| [Split button](split-button.md) | A main action paired with a menu action. |
| [FAB](fab.md) | Floating primary actions, size and colour variants. |
| [Extended FAB](extended-fab.md) | A labelled floating action, with size variants and extension or collapse. |
| [FAB menu](fab-menu.md) | Related actions opened from a FAB; rendered in the browser, not by the SSR renderer. |

### Selection & input

| Component | What ships |
|-----------|------------|
| [Checkbox](checkbox.md) | Selected, unselected, indeterminate and error states. |
| [Switch](switch.md) | On/off state, optional icons and form participation. |
| [Radio buttons](radios.md) | Mutually exclusive choices with keyboard navigation. |
| [Chips](chips.md) | Assist, filter, input and suggestion chips. |
| [Slider](slider.md) | Standard, centred and range sliders, discrete steps and Expressive sizes. |
| [Text field](text-field.md) | Filled and outlined fields, multiline input, labels, affixes and validation. |
| [Select](select.md) | A field with a menu of options. |
| [Search](search.md) | A search bar and a docked or full-screen search view. |
| [Date picker](datepicker.md) | Docked and modal pickers, typed input, full-screen and range selection. |
| [Time picker](timepicker.md) | Clock dial or keyboard input in a modal. |

### Navigation

| Component | What ships |
|-----------|------------|
| [Navigation rail](navigation-rail.md) | Expressive collapsed and expanded rails. |
| [Navigation bar](navigation-bar.md) | Destinations with labels below or beside icons, badges and hiding on scroll. |
| [Drawer](drawer.md) | Baseline standard and modal navigation drawers. |
| [Tabs](tabs.md) | Primary and secondary tabs with keyboard navigation. |
| [Menu](menu.md) | Baseline and Expressive vertical menus. |
| [Top app bar](top-app-bar.md) | Small, centre-aligned, medium and large bars; medium and large compress on scroll. |
| [Bottom app bar](bottom-app-bar.md) | The baseline bar remains available for existing designs. |
| [Toolbar](toolbar.md) | Expressive docked and floating toolbars, horizontal or vertical layouts, colour variants and scroll behavior. |

Google's [toolbar overview](https://m3.material.io/components/toolbars/overview) recommends the
docked toolbar in place of the bottom app bar. **Floating-toolbar collapse is not done yet:**
docked toolbars collapse; floating toolbars exit on scroll instead of collapsing into a smaller
control. Choose the behavior that exists today rather than depending on a future update.

### Containment

| Component | What ships |
|-----------|------------|
| [Card](card.md) | Elevated, filled and outlined cards. |
| [List](list.md) | Rows with leading and trailing content, supporting text and selection. |
| [Carousel](carousel.md) | Multi-browse, uncontained, hero, centre-aligned hero and full-screen layouts. |
| [Divider](divider.md) | Horizontal and vertical separators, including inset variants. |
| [Dialog](dialog.md) | Modal decisions and short tasks, with focus management. |
| [Bottom sheet](bottom-sheet.md) | Standard and modal sheets anchored to the bottom. |
| [Side sheet](side-sheet.md) | Standard and modal sheets at the side. |

### Communication

| Component | What ships |
|-----------|------------|
| [Badge](badge.md) | A dot or a short count/status label. |
| [Progress](progress.md) | Linear and circular, determinate and indeterminate, flat and Expressive wavy indicators. |
| [Loading indicator](loading-indicator.md) | The Expressive morphing-shape indicator for short waits. |
| [Snackbar](snackbar.md) | A brief message with an optional action. |
| [Tooltip](tooltip.md) | Hover and focus descriptions, placement and timing; plain and rich colour variants. |

The colour roles, shape tokens and motion are shared across these components. See
[Theming](theming.md) for customisation and [Architecture](architecture.md) for how the same
implementation serves the different bindings.

## Measured bundle sizes

The following is the published **material 3.7.2** size table, taken from its
[README's CI-measured rows](https://github.com/floor/material/blob/v3.7.2/README.md#sizes).
These are minified, gzipped outputs measured from the packed package, not estimates or the
size of an entire app. Here, kB means 1,000 bytes. New releases can change these figures.

| Import | gzip |
|--------|-----:|
| `createButton` from `material`, with code splitting: the initial chunks (the progress indicator loads on demand) | 7.6 kB |
| `createButton`, without code splitting (the progress indicator included) | 13.9 kB |
| `createButton`, `createTextField` and `createCheckbox`, without code splitting | 20.4 kB |
| Everything the root exports (`export * from 'material'`), without code splitting | 127.1 kB |
| `material/styles/base` | 2.9 kB |
| `material/styles/base-lite` | 1.6 kB |
| `material/styles/base` and `material/styles/button` | 5.1 kB |
| `material/styles`, the full stylesheet | 58.7 kB |

The full stylesheet is **about 59 kB gzip**, against a **63.75 kB** gzip
[CI budget](https://github.com/floor/material/blob/v3.7.2/scripts/budgets.ts#L33).
The [release changelog](https://github.com/floor/material/blob/v3.7.2/CHANGELOG.md#372---2026-11-05)
records the underlying package measurements.

A page pays only for what it imports when its bundler tree-shakes the JavaScript and it uses
selective style entries. Importing `material/styles` deliberately brings the whole stylesheet;
importing `material/styles/base` and the needed component styles keeps that cost selective.
Web components and framework bindings carry their shadow-root styles. The
[component catalogue](/components/) shows per-component sizes; shared code means adding
individual figures is not a reliable way to predict a combined bundle. Measure your own
production build too.

## Browser support

The supported target is **current Chrome, Edge, Firefox and Safari**. The
[library's browser support statement](https://github.com/floor/material/blob/v3.7.2/README.md#browser-support)
also names the ES2022 JavaScript floor and the platform features used by its elements.

| Browser | Components, forms and overlays | CSS `linear()` spring motion |
|---------|-------------------------------|------------------------------|
| Chrome, current | Supported | Supported |
| Edge, current | Supported | Supported |
| Firefox, current | Supported | Supported |
| Safari, current | Supported | Safari 17.2 and later |

In older browsers without CSS `linear()`, every component renders correctly without the spring
transitions, provided the browser meets the JavaScript and other platform requirements. This
motion fallback is not a promise of support for every old browser.

The elements use **form-associated custom elements** for form values and validation, and the
**top layer** through `popover` and `<dialog>` for overlays. All current browsers in the table
provide those features. Check your actual browser or embedded webview target when it is older
than the current releases.

## Frameworks and server rendering

There are **zero runtime dependencies**. React, Vue, Svelte and SolidJS are optional peer
dependencies: the library uses the framework your app already has. The
[published README](https://github.com/floor/material/blob/v3.7.2/README.md#react-vue-svelte-and-solid)
describes the shared implementation and binding contracts.

| Way to use it | Entry | Guide |
|---------------|-------|-------|
| Vanilla JavaScript factories | `material` | [Vanilla](vanilla.md) |
| Web Components | `material/elements` | [Web Components](web-components.md) |
| React 18 and 19 | `material/react` | [React](react.md) |
| Vue 3 | `material/vue` | [Vue](vue.md) |
| Svelte 5 | `material/svelte` | [Svelte](svelte.md) |
| SolidJS | `material/solid` | [SolidJS](solid.md) |

For SSR, `renderElement` from **`material/ssr`** emits **Declarative Shadow DOM**, and the
framework bridges are `material/ssr/react`, `material/ssr/vue`, `material/ssr/svelte` and
`material/ssr/solid`. They render the same element roots on the server and hydrate in the
browser. **SSR targets Node and Bun; worker and edge runtimes are unsupported.** Plain factories
need a browser DOM; use the server entry for server output.

The [SSR contract](https://github.com/floor/material/blob/v3.7.2/README.md#server-rendering)
describes inline styles for a styled first paint and link mode for smaller HTML. Link mode can
paint unstyled roots in WebKit until its stylesheets arrive. The FAB menu opts out of server
rendering, and the React and Svelte bridges have limits around context and `Suspense`; check
the [server-rendering guide](server-rendering.md) before designing around those features.

## Release history and reporting issues

As of November 5, 2026, the latest published release is
[3.7.2](https://github.com/floor/material/releases/tag/v3.7.2). Recent releases have been frequent:
[3.7.0](https://github.com/floor/material/releases/tag/v3.7.0) was published on November 4, and
[3.7.1](https://github.com/floor/material/releases/tag/v3.7.1) and 3.7.2 on November 5. That is an
observed recent pace, not a promised release schedule or support response time.

Read the [changelog](https://github.com/floor/material/blob/main/CHANGELOG.md) for changes and
migration notes, and the [release history](https://github.com/floor/material/releases) to check
what has actually shipped. Evaluate that history against the maintenance needs of your app.

Report bugs or request features in the [issue tracker](https://github.com/floor/material/issues).
Include the package version, browser and framework, a small reproduction, and what you expected
to happen. An independent project still needs evidence you can inspect: working examples,
release notes and reproducible issue reports are more useful than a blanket completeness claim.

## Other libraries, as of November 2026

These projects make different tradeoffs. The links below lead to each project's own description;
check its current component docs and maintenance status when deciding.

| Library | Approach and scope |
|---------|--------------------|
| [material](https://github.com/floor/material) | Independent M3 and Expressive implementation with factories, web components and React, Vue, Svelte and SolidJS bindings; scope and limits are listed above. |
| [@material/web](https://github.com/material-components/material-web) | Google's baseline M3 web components. It does not implement the M3 Expressive update; its [roadmap](https://github.com/material-components/material-web/blob/main/docs/roadmap.md) states that it is in maintenance mode with no new features or components planned. |
| [material-esm/material](https://github.com/material-esm/material) | A community fork of Material Web; its README links an Expressive demo and component-specific documentation. It is a separate project from the `material` npm package documented here. |
| [MDUI](https://www.mdui.org/) | A Material Design 3 library built with web components, with dynamic colour, dark mode and on-demand imports. |
| [M3E](https://github.com/matraic/m3e) | An independent Material 3 Expressive web-component project, with web components and React bindings in its package list. |

There is no bundle-size ranking here: different imports, styling strategies and measurement
fixtures would make the figures incomparable. Try the components your app needs and compare
accessibility, integration and production output in the same app.
