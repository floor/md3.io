# md3.io

The presentation site for mtrl. Uses the vlist.io stack and shared styles: Bun, Eta, Markdown, and vanilla TypeScript. Material components render inside isolated preview frames; site navigation and controls use plain HTML and CSS.

## Development

Install dependencies (including `material` from npm via `package.json` and `bun.lock`) and start the development server:

```sh
bun install
bun run dev
```

Open http://localhost:4300, or run it under pm2 with `pm2 start ecosystem.config.cjs`. `PORT` and `HOST` override the defaults. `bun run dev` rebuilds on its own: a change in `src/client`, `src/shared`, `styles` or `icons` rebuilds the site; a change in `server.ts` or `src/server` restarts the server. Reload the page to see the result.

```sh
bun run typecheck
bun test
bun run build
bun run test:browser
```

The browser check uses Playwright Chromium and writes screenshots to `analysis/browser/`. It runs `scripts/check-tabs-batches.ts`, which starts one `check-tabs` process per `CHECK_TABS_BATCH` components (a whole number from 1, otherwise 6) and waits for that process to exit before the next; `CHECK_TABS_ONLY_BATCH` runs a single batch by its index, counting from 1. Install its browser once with `bunx playwright install chromium` if needed. To serve a built site, run `bun start`.

`bun run docs:check` (part of `test:browser`) checks the code in `docs/components/*.md` against material, and against material-addons (a devDependency) for form and colorpicker: every JavaScript and TypeScript block type-checks and runs in Chromium, each documented event handler receives the fields it reads, and every `.mtrl-…` class a block names exists. `scripts/check-docs.ts` explains the fence annotations, and `scripts/check-docs/prelude.ts` declares what the examples take from the app. `CHECK_DOCS_PAGES` is how many Chromium pages that behaviour check opens at once: a whole number from 1 to 6, otherwise 2.

Client-side navigation progressively enhances the complete server pages. `src/client/client-navigation.ts` uses the Navigation API or click/popstate fallback to fetch HTML, wait for stylesheets, update page metadata, and swap content while preserving the header, primary navigation and section drawer. Reloads, direct links and JavaScript-off visits use the same server HTML. Links with `data-full-load`, external destinations, downloads and different layout shells use browser navigation.

Page entries register an initializer with `page-lifecycle.ts`. Each visit gets its content root and a lifecycle that owns event listeners, observers, subscriptions, timers and app teardown; persistent appearance and theme state stay outside that visit. Add a new page entry to `pageScripts` in the router when needed. `scripts/check-navigation.ts` exercises both routing paths and writes a 1440px drawer-navigation video and captures; `check-navigation-components.ts` retains the component-specific navigation playground checks.

## Structure

- `server.ts`: routes and restricted static asset serving.
- `src/server/shells/`: Eta page templates.
- `src/server/content.ts`: existing Markdown docs, navigation, heading links, and table of contents.
- `src/shared/components.ts`: component definitions, controls, and typed configuration builders shared by previews and generated code.
- `src/client/`: site controls, playground controls, and isolated Material preview.
- `styles/`: vlist.io styles copied unchanged, plus `site.css` and preview-only styles.
- `docs/components/`: supplied documentation; current library source and types guide playground configuration.

The site includes a compact landing page, a component catalog, all six Actions playgrounds (Button, Icon button, Button group, Split button, FAB, and Extended FAB), all ten Selection & input playgrounds (Checkbox, Switch, Radio buttons, Chips, Slider, Text field, Select, Search, Date picker, and Time picker), all six Navigation playgrounds (Navigation rail, Navigation drawer, Tabs, Menu, App bar, and Bottom app bar), all seven Containment playgrounds (Card, List, Carousel, Divider, Dialog, Bottom sheet, and Side sheet), all five Communication playgrounds (Badge, Progress, Loading indicator, Snackbar, and Tooltip), and all supplied component documentation. Each playground shares a configuration panel, independent Material theme controls, and preview/code tabs with contextual copying. View code uses a locally bundled highlight.js JavaScript grammar and the vlist.io syntax colors, following the site’s light/dark mode. No benchmark infrastructure is included. The docs include additional/legacy references such as form and colorpicker; their examples are checked by `bun run docs:check`.

The styles and fonts are copied locally rather than served from a sibling project, so the site can be deployed with its own files. Runtime does not depend on vlist.io. Build installs `material` from npm as pinned in `package.json` and `bun.lock`.

## Deploy

md3.io runs on **floor-vps** behind Cloudflare: nginx (`deploy/nginx/md3.io.conf`) proxies to the `md3.io` PM2 process (`ecosystem.production.config.cjs`, port 4300). After the approved main commit is pushed, the operator runs `bash scripts/deploy.sh`. `DEPLOY_HOST` defaults to `admin@46.226.104.226`; `DEPLOY_DIR` defaults to `/home/floor`, containing the `md3.io` checkout. `DRY_RUN=1 bash scripts/deploy.sh` prints the exact remote script without opening SSH.

Before any fetch or reset, deploy requires an active `pm2-admin.service`, a live nonzero `MainPID` matching `/home/admin/.pm2/pm2.pid`, its RPC socket, executable Bun/PM2 files, and a known running `md3.io` process. Every PM2 call repeats the daemon guard. The script uses the unit's `/home/admin/.bun/bin/bun --bun` runtime, `/home/admin/.local/share/fnm/node-versions/v18.17.1/installation/lib/node_modules/pm2/bin/pm2`, and `PM2_HOME=/home/admin/.pm2`; update these paths together with any unit/runtime migration. A host override must provide the same service/runtime layout.

After preflight, deploy records the previous commit, resets the checkout to `origin/main`, moves aside any legacy symlinked `node_modules/material`, installs from `bun.lock`, builds, and reloads `md3.io` once. It then checks that the same systemd-owned daemon remains and the site answers HTTP 200. It never starts a missing app or daemon. **Do not run PM2 by hand to recover a stopped unit**: a hand-started daemon prevents the systemd unit from starting correctly.

A failure after reset can leave the running process reading changed files, even when no reload occurred. The script reports the previous commit and an exact `git -C … reset --hard …` command to restore the checkout; it does not roll back automatically. The operator must inspect `pm2-admin`, restore the intended commit, reinstall and rebuild, and arrange any recovery reload through the verified systemd-owned daemon.

The Date picker playground requires mtrl PR #182 or newer. It uses the selective Date picker stylesheet and the native calendar/input modes, with configurable date limits and modal confirmation by default. The preview and copied example use the component API directly.

Fixed Tabs also apply a horizontal flex direction in both the preview and copied example to compensate for the current stylesheet's column direction. Navigation previews include application-owned triggers and actions with matching cleanup in their code examples. App bar scroll/visibility states are controlled directly from the configuration panel.

Card and Carousel use bundled SVG artwork in `assets/playground/`. Copied examples identify these demo image paths so they can be replaced with application assets. Dialog and sheet examples include their open buttons; Divider includes a sized container so both orientations and insets can be demonstrated.

Communication previews cover the current library variants, including flat/wavy progress and determinate/indeterminate loading indicators. Badge and Tooltip examples include their target icon buttons, and Snackbar includes its show button and cleanup. Tooltip’s rich variant currently changes its surface styling; the library accepts plain text content.

The List playground requires the full list anatomy API from mtrl PR #181 or newer. It uses typed text/media/control slots, structural dividers/subheaders, and native list actions. Selection stays synchronized with View code; the Save controls act independently of row selection.
