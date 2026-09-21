# md3.io

The presentation site for mtrl. Uses the vlist.io stack and shared styles: Bun, Eta, Markdown, and vanilla TypeScript. Material components render inside isolated preview frames; site navigation and controls use plain HTML and CSS.

## Development

Keep `mtrl` alongside this repository and build it first:

```sh
cd ../mtrl
bun run build
cd ../md3.io
bun install
bun run dev
```

Open http://localhost:3339. `PORT` and `HOST` override the defaults. `bun run dev` builds client assets and watches the server. After editing client TypeScript or updating the local mtrl package, run `bun run build` again and reload the page. After rebuilding mtrl, run `bun install --force` to refresh the local file dependency before rebuilding this site.

```sh
bun run typecheck
bun test
bun run build
bun run test:browser
```

The browser check uses Playwright Chromium and writes screenshots to `analysis/browser/`. Install its browser once with `bunx playwright install chromium` if needed. To serve a built site, run `bun start`.

## Structure

- `server.ts`: routes and restricted static asset serving.
- `src/server/shells/`: Eta page templates.
- `src/server/content.ts`: existing Markdown docs, navigation, heading links, and table of contents.
- `src/shared/button.ts`: one configuration model for preview rendering and generated code.
- `src/client/`: site controls, playground controls, and isolated Material preview.
- `styles/`: vlist.io styles copied unchanged, plus `site.css` and preview-only styles.
- `docs/components/`: supplied documentation, retained as the source of truth.

This first iteration includes a compact landing page, the component catalog, the Button playground, and all supplied component documentation. Button establishes the pattern for subsequent playgrounds. No benchmark infrastructure is included. The docs have been integrated as supplied; this is not an API accuracy audit. They include additional/legacy references such as form, colorpicker, and segmented button.

The styles and fonts are copied locally rather than served from a sibling project, so the site can be deployed with its own files. Runtime does not depend on vlist.io. Build requires the local mtrl dependency; deployment is not configured in this iteration.
