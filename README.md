# md3.io

The presentation site for mtrl. Uses the vlist.io stack and shared styles: Bun, Eta, Markdown, and vanilla TypeScript. Material components render inside isolated preview frames; site navigation and controls use plain HTML and CSS.

## Development

Keep `material` alongside this repository, update it to main including PR #185 or newer, and build it first:

```sh
cd ../material
bun run build
cd ../md3.io
bun install
bun run dev
```

Open http://localhost:4300, or run it under pm2 with `pm2 start ecosystem.config.cjs`. `PORT` and `HOST` override the defaults. `bun run dev` rebuilds on its own: a change in the local material checkout's `src` rebuilds material, then this site, then restarts the server; a change in `src/client`, `src/shared` or `icons` rebuilds the site; a change in `server.ts` or `src/server` restarts the server. Reload the page to see the result.

```sh
bun run typecheck
bun test
bun run build
bun run test:browser
```

The browser check uses Playwright Chromium and writes screenshots to `analysis/browser/`. Install its browser once with `bunx playwright install chromium` if needed. To serve a built site, run `bun start`.

`bun run docs:check` (part of `test:browser`) checks the code in `docs/components/*.md` against material, and against material-addons (a devDependency) for form and colorpicker: every JavaScript and TypeScript block type-checks and runs in Chromium, each documented event handler receives the fields it reads, and every `.mtrl-…` class a block names exists. `scripts/check-docs.ts` explains the fence annotations, and `scripts/check-docs/prelude.ts` declares what the examples take from the app.

## Structure

- `server.ts`: routes and restricted static asset serving.
- `src/server/shells/`: Eta page templates.
- `src/server/content.ts`: existing Markdown docs, navigation, heading links, and table of contents.
- `src/shared/components.ts`: component definitions, controls, and typed configuration builders shared by previews and generated code.
- `src/client/`: site controls, playground controls, and isolated Material preview.
- `styles/`: vlist.io styles copied unchanged, plus `site.css` and preview-only styles.
- `docs/components/`: supplied documentation; current library source and types guide playground configuration.

The site includes a compact landing page, a component catalog, all six Actions playgrounds (Button, Icon button, Button group, Split button, FAB, and Extended FAB), all ten Selection & input playgrounds (Checkbox, Switch, Radio buttons, Chips, Slider, Text field, Select, Search, Date picker, and Time picker), all six Navigation playgrounds (Navigation rail, Drawer, Tabs, Menu, Top app bar, and Bottom app bar), all seven Containment playgrounds (Card, List, Carousel, Divider, Dialog, Bottom sheet, and Side sheet), all five Communication playgrounds (Badge, Progress, Loading indicator, Snackbar, and Tooltip), and all supplied component documentation. Each playground shares a configuration panel, independent Material theme controls, and preview/code tabs with contextual copying. View code uses a locally bundled highlight.js JavaScript grammar and the vlist.io syntax colors, following the site’s light/dark mode. No benchmark infrastructure is included. The docs include additional/legacy references such as form and colorpicker; their examples are checked by `bun run docs:check`.

The styles and fonts are copied locally rather than served from a sibling project, so the site can be deployed with its own files. Runtime does not depend on vlist.io. Build requires the local material dependency (`file:../material`, a checkout beside this one).

## Deploy

md3.io runs on the floor.io server behind Cloudflare: nginx (`deploy/nginx/md3.io.conf`) proxies to a pm2 process (`ecosystem.production.config.cjs`, port 4300). Push `main`, then run `scripts/deploy.sh`. If `/home/floor/material` is missing, the script clones `https://github.com/floor/material.git` there. A checkout whose origin is not `floor/material` is refused before the site is touched. The library is then fetched and checked out detached at `LIBRARY_REF` (default `origin/main`; a tag such as `v3.0.0-next.0`, a commit or a branch), and built. Only then is this site reset to `origin/main` and built. pm2 reloads only when both builds succeed. `DRY_RUN=1 scripts/deploy.sh` prints those steps and does not open ssh.

The Date picker playground requires mtrl PR #182 or newer. It uses the selective Date picker stylesheet and the native calendar/input modes, with configurable date limits and modal confirmation by default. The preview and copied example use the component API directly.

Fixed Tabs also apply a horizontal flex direction in both the preview and copied example to compensate for the current stylesheet's column direction. Navigation previews include application-owned triggers and actions with matching cleanup in their code examples. App bar scroll/visibility states are controlled directly from the configuration panel.

Card and Carousel use bundled SVG artwork in `assets/playground/`. Copied examples identify these demo image paths so they can be replaced with application assets. Dialog and sheet examples include their open buttons; Divider includes a sized container so both orientations and insets can be demonstrated.

Communication previews cover the current library variants, including flat/wavy progress and determinate/indeterminate loading indicators. Badge and Tooltip examples include their target icon buttons, and Snackbar includes its show button and cleanup. Tooltip’s rich variant currently changes its surface styling; the library accepts plain text content.

The List playground requires the full list anatomy API from mtrl PR #181 or newer. It uses typed text/media/control slots, structural dividers/subheaders, and native list actions. Selection stays synchronized with View code; the Save controls act independently of row selection.
