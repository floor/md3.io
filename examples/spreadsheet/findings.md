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

## FLO-578 — vlist 3.1.0: focus removal during a large keyboard jump

Independent public-API reproduction and type evidence:
`briefs/flo398-vlist-finding-focus-removal.md` in the coordinator's worktree.
With `table()` and `a11y({ keyboard: false })`, focus a custom cell then call
`scrollToIndex(49999, 'center')`. Removing the focused row causes a synchronous
focusout rerender and a `removeChild` NotFoundError. The last row appears, with 10
rows mounted in the minimal reproduction, but the no-errors assertion fails.
Round 2 uses the allowed public integration: `VList.element` is the documented root
DOM container (https://vlist.io/docs/api), and the composite-widget focus model is
published at https://vlist.io/docs/accessibility. The application gives that root a
native `tabIndex = 0` because `a11y({ keyboard: false })` does not make a table root
focusable. Before `scrollToIndex`, it focuses this stable root, then restores focus
to the destination cell. No row is removed while holding DOM focus. The check
requires zero page errors; no error is ignored, caught, or whitelisted.

## Material multiline text-field initial value

`createTextField({ type: 'multiline', value: 'DSP-00001' })` creates a blank textarea:
`getValue()` is empty, while the `value` attribute is `DSP-00001`. Reproduction and
screenshots: `briefs/flo398-material-finding-multiline-value.md`. FLO-577 is fixed in Material commit `593162e0`, built and linked locally for round 2.
The guard and blocked-editor path are removed. Checks cover initial nonempty value,
unchanged blur, changed commit, export and Undo.

## Material side-sheet close target versus M3

M3 Density requires default targets at least 48×48 CSS pixels. The standard side
sheet's default Close button measures 40×40; its before pseudo-element is also
40×40. Evidence and reproduction: `briefs/flo398-material-finding-side-sheet-target.md`.
FLO-579 is fixed in Material commit `593162e0`: the visual button remains 40×40,
with an external 48×48 `::after` target. Round 2 remeasures its computed target and
pointer hit region, without CSS overrides. The original observation above records
the earlier build, not the round 2 result.
