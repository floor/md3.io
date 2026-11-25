---
created: 2026-11-25
updated: 2026-11-25
status: published
---

# Bundle size

material is tree-shakable: an app pays for the components it imports, and nothing else. Every
figure on this page is material's own measurement for **material {{material.version}}**,
measured at commit `{{material.sizeCommit}}` on {{material.sizeDate}}.

## Size table

Each row imports only that component from the package entry, the way an app does, and counts
what a bundler keeps. **Minified** and **Gzipped** are the initial load: the code the import
pulls in before anything loads on demand. **vs core** is the gzipped cost over material's core,
the {{material.sizeCore}} kernel every component starts from. **Deferred** is the gzipped code
that loads later through `import()`, only when a feature needs it (a button's progress
indicator, for example). The figures are JavaScript; stylesheets are measured separately, in
[Why material](/docs/why-material/#measured-bundle-sizes).

{{material.sizeTable}}

An app pays the core once, plus each component's **vs core**. Components share code, so two
components together usually cost less than their two figures added up.

## Tree-shaking

Only the components you import reach your bundle. material checks this for all
{{material.sizeCount}} components: the measurement imports each one alone and fails if its
bundle carries another component's code.

For example, importing only the button produces a **{{material.sizeButton}}** gzipped bundle,
{{material.sizeButtonCore}} over the core:

```ts
// Only the button is bundled: no other component
import { createButton } from 'material';
```

Bundlephobia reports the size of everything the package exports at once
(`export * from 'material'`, {{material.sizeAll}} here). An app that imports a few components
pays a fraction of that.

## Measuring

The numbers come from material's own script, [`scripts/size.ts`](https://github.com/floor/material/blob/v{{material.version}}/scripts/size.ts),
in the material repository:

```bash
bun run size
```

It writes [`SIZES.md`](https://github.com/floor/material/blob/v{{material.version}}/SIZES.md)
with `bun run size --markdown > SIZES.md`, and material's CI fails when a row drifts from a
fresh measurement, so the table at each release tag is that release's measurement. This site
copies the table for the version it runs (`bun run sizes:sync`) and refuses to build while the
copy names another version.
