# Integration findings

## FLO-576 — vlist 3.1.0 header HTMLElement pointer events

The self-contained maintainer reproduction is recorded in
`briefs/flo398-vlist-finding-header-pointer-events.md` in the coordinator's worktree.
`TableColumn.label` explicitly accepts `string | HTMLElement`, although interactive
descendants are not expressly guaranteed. The shipped `.vlist-table-header-content`
rule sets `pointer-events:none`, inherited by the Material header button. Ordinary
pointer clicks hit the enclosing column header; focusing the button and pressing Enter
opens its menu.

The coordinator permits a documented public integration. The declared `ColumnClickEvent`
has no `column:click` emission in the installed runtime; the public table event reference
lists resize and sort only. No documented general header click hook was established.
No CSS override, private import, synthetic activation or internal header listener is
installed. Pointer column menus wait for FLO-576; the keyboard path and independent
toolbar actions work. The example page states this limitation.

## vlist 3.1.0: focus removal during a large keyboard jump

Independent public-API reproduction and type evidence:
`briefs/flo398-vlist-finding-focus-removal.md` in the coordinator's worktree.
With `table()` and `a11y({ keyboard: false })`, focus a custom cell then call
`scrollToIndex(49999, 'center')`. Removing the focused row causes a synchronous
focusout rerender and a `removeChild` NotFoundError. The last row appears, with 10
rows mounted in the minimal reproduction, but the no-errors assertion fails.
No workaround or error suppression is installed. Spreadsheet's error-free large
keyboard jumps wait on this finding.

## Material multiline text-field initial value

`createTextField({ type: 'multiline', value: 'DSP-00001' })` creates a blank textarea:
`getValue()` is empty, while the `value` attribute is `DSP-00001`. Reproduction and
screenshots: `briefs/flo398-material-finding-multiline-value.md`. The example rejects
an editor that did not initialize to its cell value, preserving the original document.
Nonempty cell editing waits; no setter workaround or library patch is installed.

## Material side-sheet close target versus M3

M3 Density requires default targets at least 48×48 CSS pixels. The standard side
sheet's default Close button measures 40×40; its before pseudo-element is also
40×40. Evidence and reproduction: `briefs/flo398-material-finding-side-sheet-target.md`.
No CSS override is installed. Full exterior hit testing remains unestablished.
