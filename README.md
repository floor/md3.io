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

The site includes a compact landing page, a component catalog, all six Actions playgrounds (Button, Icon button, Button group, Split button, FAB, and Extended FAB), all ten Selection & input playgrounds (Checkbox, Switch, Radio buttons, Chips, Slider, Text field, Select, Search, Date picker, and Time picker), all six Navigation playgrounds (Navigation rail, Navigation drawer, Tabs, Menu, and App bar), all seven Containment playgrounds (Card, List, Carousel, Divider, Dialog, Bottom sheet, and Side sheet), all five Communication playgrounds (Badge, Progress, Loading indicator, Snackbar, and Tooltip), and all supplied component documentation. Each playground shares a configuration panel, independent Material theme controls, and preview/code tabs with contextual copying. View code uses a locally bundled highlight.js JavaScript grammar and the vlist.io syntax colors, following the site’s light/dark mode. No benchmark infrastructure is included. The docs include additional/legacy references such as form and colorpicker; their examples are checked by `bun run docs:check`.

The styles and fonts are copied locally rather than served from a sibling project, so the site can be deployed with its own files. Runtime does not depend on vlist.io. Build installs `material` from npm as pinned in `package.json` and `bun.lock`.

## Component pages

Each component has four tabs: Overview, Playground, Develop and Accessibility. The owner set the Overview's shape on 2026-11-26: it is built from sections by property, not by scenario, and follows m3.material.io's figures.

- **At a glance** opens most Overviews: a few points in our own words, never m3.material.io's text, beside the live component in a realistic scene, often in a device frame. The scenes are in `NOTES` in `src/server/component-properties.ts`.
- **A section per property** (Variant, Size, Shape, State and so on) shows the property's values side by side in one stage, numbered, with a legend of names only. The sections are in `PROPERTIES` in the same file, one list per component.
- **Known issues** ends the Overview: what M3 recommends that material does not do yet, and the known bugs, one sentence each. The entries come from material's conformance matrix, sent by material's team with the version and date checked; an entry goes when its fix ships. They are in `KNOWN_ISSUES`.

How the stages are built:

- **In the page, no iframe.** A stage is server-rendered material elements inside `div.catalog-visual.catalog-visual--<slug>`. Iframes slow the page down; the Playground keeps its own.
- **The stage style:** dots every 8px over `surface-container-low`, the first row inset by 8px, a 12px radius, and the height of its content.
- **The client module** `src/client/catalog/<slug>.ts` defines the elements and any figure behaviour; its `define(visual)` may return a cleanup.
- **Overlays shown in place.** Material keeps one menu, one snackbar and one search view open per page, and opens dialogs, modal sheets and pickers in the browser's top layer. So their figures show the real component made visible in the page without opening it, as a catalog surface (`surface()` in `src/client/catalog/surface.ts`). Opening them would move focus, scroll the page or cover it with a scrim. Their buttons still work; a menu's or a search's button opens the real one.
- **Claims:** any statement about what m3.material.io says comes from a page read that day and cites it in the code; facts about the library come from its docs and its code.

When you add or change a section, check it in a browser at 1440px and at phone width, check that nothing takes focus or scrolls the page on load, then run `bun run test:browser`.

## Search (SEO)

The owner set these choices on 2026-11-25. Search Console then showed md3.io at an average position of about 14, with a 3.7% click-through rate, on searches such as "md3", "md3 web" and "material design 3 web".

**Titles.** `documentTitle()` in `src/server/seo.ts` builds every page's `<title>`, `og:title` and `twitter:title`. Each title stays under 65 characters, the most a search result shows. A route passes only the page's own name (for example "Button: Develop"), and that name stays the breadcrumb's.

| Page | Title |
|---|---|
| Home | md3.io – Material 3 Expressive components for the web |
| Components overview | Material 3 Expressive components for the web \| md3.io |
| Component, Overview tab | Button – Material 3 Expressive web component \| md3.io |
| Component, Develop tab | Button API and examples – Material Design 3 \| md3.io |
| Component, Accessibility tab | Button accessibility – Material Design 3 \| md3.io |
| Guide | Theming – Material Design 3 for the web \| md3.io |
| Other pages | Credits \| md3.io |

**"Material 3 Expressive" is the lead term** where a reader lands: the home page, the components overview and a component's Overview tab. Expressive is M3's latest evolution, and few web libraries implement it yet, which sets md3.io apart. Google names it "Material 3 Expressive" / "M3 Expressive" on m3.material.io and its *Building with M3 Expressive* post (read on 2026-11-25). Every component's Overview title says it, including components Expressive did not change, such as Divider, because the library implements M3 Expressive as a whole. The Develop and Accessibility tabs keep "Material Design 3", for people who search the classic name. Descriptions carry both terms.

**Descriptions** say what the page holds and for which frameworks (React, Vue, Svelte, SolidJS, vanilla JS, Web Components). The searchable part comes first, so Google's cut at about 160 characters falls on the tagline.

**Crawling.** `robots.txt` blocks nothing (`robotsTxt()` in `src/server/seo.ts`). The internal routes, `/preview/` (the playground frames) and `/api/`, answer `X-Robots-Tag: noindex` instead. When `robots.txt` blocked them, Google indexed the preview frames from the component pages' links without fetching them, and never read their `noindex`. Search Console reported this as "Indexed, though blocked by robots.txt". Don't block them again: Google can only drop a page it is allowed to fetch.

**Structured data.** Every page carries a `BreadcrumbList` (Home › section › page). The home page also carries `SoftwareApplication` and `WebSite` with the `/?q=` search action (`structuredData()` in `src/server/seo.ts`).

**For AI tools** (FLO-1564, `src/server/markdown-docs.ts`), the documentation is also served as Markdown, which AI tools, AI search and crawlers read more reliably than HTML:
- `/llms.txt` maps the library: a paragraph, then every guide and component page as Markdown, grouped.
- `/llms-full.txt` holds every guide and component document in one file.
- Every guide has a twin at `/docs/<slug>.md`. A component's Develop and Accessibility tabs have theirs at `/components/<slug>/develop.md` and `…/accessibility.md`, and each HTML page points to its twin with `<link rel="alternate" type="text/markdown">`.
- The Markdown is the docs' own: facts filled in, links made absolute to the twins, and each `example` block expanded into the code the page shows, one fenced block per framework.

**Addresses.**
- The sitemap (`/sitemap.xml`) lists every public page, with its source file's last commit date.
- `data/published-urls.txt` lists every address ever published. `test/published-urls.test.ts` requires each to answer 200 or 301, and requires the sitemap's pages to be listed there.
- A component's documentation is its Develop tab, and `/docs/components/<slug>/` answers 301 there, keeping the query string.
- A renamed address redirects in one hop, never through a second redirect.

## Deploy

md3.io runs on **floor-vps** behind Cloudflare: nginx (`deploy/nginx/md3.io.conf`) proxies to the `md3.io` PM2 process (`ecosystem.production.config.cjs`, port 4300). After the approved main commit is pushed, the operator runs `bash scripts/deploy.sh`. `DEPLOY_HOST` defaults to `admin@46.226.104.226`; `DEPLOY_DIR` defaults to `/home/floor`, containing the `md3.io` checkout. `DRY_RUN=1 bash scripts/deploy.sh` prints the exact remote script without opening SSH.

Before any fetch or reset, deploy requires an active `pm2-admin.service`, a live nonzero `MainPID` matching `/home/admin/.pm2/pm2.pid`, its RPC socket, executable Bun/PM2 files, and a known running `md3.io` process. Every PM2 call repeats the daemon guard. The script uses the unit's `/home/admin/.bun/bin/bun --bun` runtime, `/home/admin/.local/share/fnm/node-versions/v18.17.1/installation/lib/node_modules/pm2/bin/pm2`, and `PM2_HOME=/home/admin/.pm2`; update these paths together with any unit/runtime migration. A host override must provide the same service/runtime layout.

After preflight, deploy records the previous commit, resets the checkout to `origin/main`, moves aside any legacy symlinked `node_modules/material`, installs from `bun.lock`, builds, and rechecks that `md3.io` is still running immediately before reloading it once. A process that stopped during the build is refused. It then checks that the same systemd-owned daemon remains and the site answers HTTP 200. There is no missing-process start fallback. **Do not run PM2 by hand to recover a stopped unit**: a hand-started daemon prevents the systemd unit from starting correctly.

A failure after reset can leave the running process reading changed files, even when no reload occurred. The script reports the previous commit and an exact `git -C … reset --hard …` command to restore the checkout; it does not roll back automatically. The operator must inspect `pm2-admin`, restore the intended commit, reinstall and rebuild, and arrange any recovery reload through the verified systemd-owned daemon.

The Date picker playground requires mtrl PR #182 or newer. It uses the selective Date picker stylesheet and the native calendar/input modes, with configurable date limits and modal confirmation by default. The preview and copied example use the component API directly.

Fixed Tabs also apply a horizontal flex direction in both the preview and copied example to compensate for the current stylesheet's column direction. Navigation previews include application-owned triggers and actions with matching cleanup in their code examples. App bar scroll/visibility states are controlled directly from the configuration panel.

Card and Carousel use bundled SVG artwork in `assets/playground/`. Copied examples identify these demo image paths so they can be replaced with application assets. Dialog and sheet examples include their open buttons; Divider includes a sized container so both orientations and insets can be demonstrated.

Communication previews cover the current library variants, including flat/wavy progress and determinate/indeterminate loading indicators. Badge and Tooltip examples include their target icon buttons, and Snackbar includes its show button and cleanup. Tooltip’s rich variant currently changes its surface styling; the library accepts plain text content.

The List playground requires the full list anatomy API from mtrl PR #181 or newer. It uses typed text/media/control slots, structural dividers/subheaders, and native list actions. Selection stays synchronized with View code; the Save controls act independently of row selection.
