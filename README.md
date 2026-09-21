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
- `src/shared/components.ts`: component definitions, controls, and typed configuration builders shared by previews and generated code.
- `src/client/`: site controls, playground controls, and isolated Material preview.
- `styles/`: vlist.io styles copied unchanged, plus `site.css` and preview-only styles.
- `docs/components/`: supplied documentation, retained as the source of truth.

The site includes a compact landing page, a component catalog, all six Actions playgrounds (Button, Icon button, Button group, Split button, FAB, and Extended FAB), all ten Selection & input playgrounds (Checkbox, Switch, Radio buttons, Chips, Slider, Text field, Select, Search, Date picker, and Time picker), all six Navigation playgrounds (Navigation rail, Drawer, Tabs, Menu, Top app bar, and Bottom app bar), and all supplied component documentation. Each playground shares a configuration panel, independent Material theme controls, and preview/code tabs with contextual copying. View code uses a locally bundled highlight.js JavaScript grammar and the vlist.io syntax colors, following the site’s light/dark mode. No benchmark infrastructure is included. The docs have been integrated as supplied; this is not an API accuracy audit. They include additional/legacy references such as form, colorpicker, and segmented button.

The styles and fonts are copied locally rather than served from a sibling project, so the site can be deployed with its own files. Runtime does not depend on vlist.io. Build requires the local mtrl dependency; deployment is not configured in this iteration.

The Date picker preview and copied example include compatibility handling for the current mtrl build: selectable calendar buttons receive `disabled="false"`, and closing after selection needs an explicit visibility refresh. Its styles currently come from the full mtrl stylesheet because the package has no separate Date picker CSS export.

Fixed Tabs also apply a horizontal flex direction in both the preview and copied example to compensate for the current stylesheet's column direction. Navigation previews include application-owned triggers and actions with matching cleanup in their code examples. App bar scroll/visibility states are controlled directly from the configuration panel.
