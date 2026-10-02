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
