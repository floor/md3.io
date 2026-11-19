# Add an example

The Showcase (`/showcase/`) holds complete interfaces — a settings screen, an email client,
a notes app — each one written six times: as web components, and through the React, Vue,
Svelte, Solid and vanilla APIs of the same `material` library. Every tab of an example is
the same interface, not six pages that drift apart: a check loads each variant, drives it
like a visitor would, and compares what they show.

This guide is for anyone adding an example, including by pull request. Copy
`examples/_template/`, work through the steps below, and send the result.

## The folder

```
examples/<slug>/
  meta.ts          the example's page: title, description, components, about, how
  shared.ts        the state every variant shares, and how it is described
  vanilla.ts       the create* factories the elements are built on
  html.ts          the web components themselves, no framework
  react.tsx        material/react
  vue.ts           material/vue
  svelte.svelte    material/svelte
  solid.tsx        material/solid
  styles.css       layout for the example only
  check.ts         the steps a visitor performs, run in every variant
```

- **`meta.ts`** declares the example (`ExampleMeta` in `types.ts`). The slug is the folder's
  name — lower case, hyphens only, the shape the site's routes take. `components` names the
  material components the example uses, by their site slugs: it links the component pages
  beside the example and loads the components' stylesheets into the frame. `about` and `how`
  are the side panel's paragraphs; they are trusted HTML written in the file, so `<code>` is
  available and nothing else should be.
- **`shared.ts`** holds the state type, its defaults, and a `summary()` that describes the
  state in words. Every variant imports it, so all six always agree on what the state is and
  what it says — the check depends on that.
- **The six variant files** have fixed names (`FRAMEWORKS` in `types.ts`); the build bundles
  each one and the page shows its source beside the running example. An example ships all
  six, or lists the ones it has in `meta.variants`.
- **`styles.css`** is layout only: the components bring their own styles. Arrange the
  components; size the example; set spacing. Colour and type stay material's — at most an
  `--mtrl-sys-*` token where plain text needs it, as the status line in the template does.
- **`check.ts`** is one `steps(page)` that clicks and types like a visitor. It runs against
  every variant, so it must only use what all six show: roles and names, not ids or classes.

## Register it

Registration is one line in `examples/index.ts`: import the example's `meta.ts` and add it
to the array, in the order the section should list it. The page, its frame routes, the
section list, search and the sitemap all follow from that list.

One more file lists the pages by hand: `data/published-urls.txt`, which the published-URLs
test checks the sitemap against. Add `/showcase/<slug>/` there too, in sorted order, or
`bun test test/` fails on the new page.

Nothing else looks at the folder: `scripts/build-examples.ts`, the pages and the checks all
read the registered list, and `scripts/write-asset-manifest.ts` skips folders starting with
`_`. That is why `examples/_template/` can sit here fully working without ever being built,
served or published: copy it, rename the folder and the slug in `meta.ts`, and register the
copy. Until you register it, nothing of it ships.

## How the check compares the variants

`scripts/check-examples.ts` loads each variant's frame in Chromium, waits for `#app` to
fill, and takes an accessibility snapshot of it — roles, names, checked, disabled, selected.
It then runs the example's own `steps(page)` from `check.ts` and snapshots again. Every
variant must match the Web Components tab exactly, before and after, and no variant may log
an error or a console warning along the way. The tabs of one example are one interface.

So write `shared.ts` first, then the variants against it, then `check.ts` as a short walk
through the example that ends in visible state — the template toggles its switch and saves,
and every framework must say the same sentence afterwards.

## Run the gates

In your worktree, with each exit code read:

```sh
bun run build          # bundles the site and every example variant
bun run typecheck      # tsc: the site, and every .ts and .tsx in examples/
bun test test/
bun run docs:check
bun run test:browser   # includes scripts/check-examples.ts
```

`tsc` covers every TypeScript file an example ships: `tsconfig.json` includes `examples/`,
and the Solid files carry their own `@jsxImportSource` pragma, so their JSX is checked
against Solid's types, not React's. The one file it cannot read is `svelte.svelte`; the
build compiles it and `check-examples` runs it in Chromium with the rest.

`bun scripts/check-examples.ts` alone runs just the examples check; rebuild first
(`bun scripts/build.ts`), because the frames load what the build wrote. The browser checks
need Playwright's Chromium once: `bunx playwright install chromium`.

## Writing and design rules

- **Original designs.** An example is a design of its own, in Material 3 — not a copy of any
  product's name, look or content. No real brands, logos or people, in the interface, the
  copy or the artwork.
- **Material components only.** Build the interface from `material`'s components; plain
  HTML is for the text around them. The point of the section is those components working
  together.
- **Layout-only CSS.** `styles.css` arranges the components and nothing more: no colours,
  shadows, type or radius of your own — the components carry their look, and the tokens
  above are the only colour it may reference.
- **Every theme.** The frame can be light or dark, and any of material's themes. Never
  hard-code a colour the components did not bring; check the example in dark mode and in a
  second theme before sending it.
- **No console output.** A variant that logs an error or a warning fails the check, even if
  it looks right.

## The pull request

- The folder is a copy of `_template/` renamed, one commit per idea, conventional commits
  (`feat(showcase): …`, `docs(showcase): …`).
- `examples/index.ts` registers the example, and `data/published-urls.txt` lists its page
  (`/showcase/<slug>/`, sorted).
- Every gate above passes; quote each one's last line and exit code in the PR body.
- The six variants behave identically — that is what the examples check asserts; if you had
  to make one differ, say so in the PR and why.

Contributions come by pull request, reviewed like any other change. By sending one, you
offer your example under the MIT licence, the licence the material library uses; nothing
in it may carry a licence notice of its own.
