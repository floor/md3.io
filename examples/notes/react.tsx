// React: material/react wraps the same elements.
import { useLayoutEffect, useRef, useState } from "react";
import type { SnackbarElement } from "material/elements";
import { BottomSheet, Button, ButtonGroup, ButtonGroupItem, Card, Chip, Chips, Dialog, Drawer, DrawerItem, ExtendedFab, IconButton, Menu, MenuItem, Search, Snackbar, TextField, TopAppBar } from "material/react";
import { DEFAULTS, LABELS, ADD_ICON, CLOSE_ICON, GRID_ICON, LIST_ICON, MENU_ICON, MORE_ICON, SEARCH_ICON,
  categoryItems, categoryLabels, editedLabel, emptyLabel, labelOf, nextEdit, noteGroups, noteTitle, observeCompact, status, visible,
  type Category, type LabelId, type Note, type State } from "./shared";

type Draft = { note: Note | null; title: string; text: string; labels: LabelId[] };

export default function Notes() {
  const [s, setS] = useState<State>(DEFAULTS);
  const [compact, setCompact] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const shell = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => observeCompact(shell.current!, (narrow) => {
    setCompact(narrow);
    setDrawerOpen(false);
    setSearchOpen(false);
  }), []);

  const closeDrawer = () => {
    if (!compact) return;
    setDrawerOpen(false);
    queueMicrotask(() => shell.current?.querySelector<HTMLElement>(".notes__menu")?.focus());
  };
  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
    if (searchOpen) setS(prev => ({ ...prev, query: "" }));
    else requestAnimationFrame(() => shell.current?.querySelector<HTMLElement>(".notes__search")?.focus());
  };
  const [draft, setDraft] = useState<Draft | null>(null);
  const snackbar = useRef<SnackbarElement | null>(null);
  const deleted = useRef<{ note: Note; at: number } | null>(null);

  const open = (note: Note | null): void =>
    setDraft(note ? { note, title: note.title, text: note.text, labels: [...note.labels] } : { note: null, title: "", text: "", labels: categoryLabels(s.category) });
  const save = (): void => {
    if (!draft) return;
    if (draft.note) {
      const edited = draft.note;
      setS((prev) => ({
        ...prev,
        notes: prev.notes.map((n) => (n === edited ? { ...n, title: noteTitle(draft.title), text: draft.text, labels: [...draft.labels], editedAt: nextEdit(prev.notes) } : n)),
      }));
    } else {
      const note: Note = { id: crypto.randomUUID(), title: noteTitle(draft.title), text: draft.text, labels: [...draft.labels], pinned: s.category === "pinned", editedAt: nextEdit(s.notes) };
      setS((prev) => ({ ...prev, notes: [...prev.notes, note] }));
    }
    setDraft(null);
  };
  const remove = (note: Note): void => {
    deleted.current = { note, at: s.notes.indexOf(note) };
    setS((prev) => ({ ...prev, notes: prev.notes.filter((n) => n !== note) }));
    setDraft(null);
    snackbar.current?.show();
  };
  const undo = (): void => {
    const gone = deleted.current;
    if (!gone) return;
    deleted.current = null;
    setS((prev) => ({ ...prev, notes: [...prev.notes.slice(0, gone.at), gone.note, ...prev.notes.slice(gone.at)] }));
  };

  const items = categoryItems(s);
  const groups = noteGroups(visible(s));
  const search = <Search className="notes__search" placeholder="Search notes" value={s.query}
    onInput={(e) => setS(prev => ({ ...prev, query: e.detail.value }))} />;
  const noteCard = (note: Note) => {
    const more = `notes-more-${note.id}`;
    return (
      <article key={note.id} className="notes__card" aria-label={note.title}>
        <Card>
          <div className="notes__card-heading">
            <button type="button" className="notes__open" onClick={() => open(note)}>{note.title}</button>
            <IconButton id={more} className="notes__more" icon={MORE_ICON} ariaLabel={`More actions for ${note.title}`} />
          </div>
          <p>{note.text}</p>
          {note.labels.length > 0 && <p className="notes__labels">{note.labels.map(labelOf).join(" · ")}</p>}
          <time dateTime={new Date(note.editedAt).toISOString()}>{editedLabel(note.editedAt)}</time>
        </Card>
        <Menu ref={(menu) => { menu?.setAttribute("anchor", more); }} position="bottom-end" onSelect={(e) => {
          if (e.detail.value === "pin") {
            setS(prev => ({ ...prev, notes: prev.notes.map(n => n === note ? { ...n, pinned: !n.pinned } : n) }));
          } else if (e.detail.value === "labels") open(note);
          else if (e.detail.value === "delete") remove(note);
        }}>
          <MenuItem value="pin">{note.pinned ? "Unpin" : "Pin"}</MenuItem>
          <MenuItem value="labels">Labels</MenuItem>
          <MenuItem value="delete">Delete</MenuItem>
        </Menu>
      </article>
    );
  };

  const editorBody = (
    <div className="notes__fields">
      <TextField label="Title" value={draft?.title ?? ""} onInput={(e) => setDraft((d) => (d ? { ...d, title: e.detail.value } : d))} />
      <TextField label="Note" type="multiline" value={draft?.text ?? ""} onInput={(e) => setDraft((d) => (d ? { ...d, text: e.detail.value } : d))} />
      <Chips value={(draft?.labels ?? []).join(",")} onChange={(e) => setDraft((d) => (d ? { ...d, labels: e.detail.value as LabelId[] } : d))}>
        {LABELS.map(({ value, text }) => (
          <Chip key={value} label={text} value={value} />
        ))}
      </Chips>
    </div>
  );
  const editorButtons = (
    <>
      <Button variant="outlined" onClick={() => (draft?.note ? remove(draft.note) : setDraft(null))}>Delete</Button>
      <Button variant="text" onClick={() => setDraft(null)}>Cancel</Button>
      <Button onClick={save}>Save</Button>
    </>
  );
  // The dialog slots its actions; the sheet has only its content.
  const editorActions = (
    <div slot="actions" className="notes__editor-actions">
      {editorButtons}
    </div>
  );
  const sheetActions = <div className="notes__editor-actions">{editorButtons}</div>;

  return (
    <section className="notes" ref={shell} data-compact={compact}>
      <TopAppBar headline="Notes" noScroll>
        {compact && <IconButton slot="leading" className="notes__menu" icon={MENU_ICON}
          ariaLabel="Open categories" onClick={() => setDrawerOpen(true)} />}
        <div slot="trailing" className="notes__tools">
          {compact ? <IconButton icon={searchOpen ? CLOSE_ICON : SEARCH_ICON}
            ariaLabel={searchOpen ? "Close search" : "Search notes"} onClick={toggleSearch} /> : search}
          {!compact && <ButtonGroup kind="connected" selection="single" required value={s.view}
            onChange={(e) => setS(prev => ({ ...prev, view: e.detail.value === "list" ? "list" : "grid" }))}>
            <ButtonGroupItem icon={GRID_ICON} value="grid" ariaLabel="Grid view" />
            <ButtonGroupItem icon={LIST_ICON} value="list" ariaLabel="List view" />
          </ButtonGroup>}
        </div>
      </TopAppBar>
      {compact && <div className="notes__mobile-search" hidden={!searchOpen}>{search}</div>}
      <div className="notes__workspace">
        <Drawer key={String(compact)} className="notes__drawer" modal={compact} open={!compact || drawerOpen}
          width="216" value={s.category} ariaLabel="Categories" onClose={closeDrawer}
          onChange={(e) => {
            setS(prev => ({ ...prev, category: e.detail.value as Category }));
            if (compact) setDrawerOpen(false);
          }}>
          {items.slice(0, 2).map(item => <DrawerItem key={item.id} value={item.id} badge={item.badge}>{item.label}</DrawerItem>)}
          <DrawerItem type="section">Labels</DrawerItem>
          {items.slice(2).map(item => <DrawerItem key={item.id} value={item.id} badge={item.badge}>{item.label}</DrawerItem>)}
        </Drawer>
        <div className="notes__content">
          <output className="notes__status" role="status">{status(s)}</output>
          {groups.length === 0 ? <div className="notes__empty"><p>{emptyLabel(s)}</p>
            {!s.query && <Button variant="text" onClick={() => open(null)}>Create note</Button>}
          </div> : groups.map(group => <section key={group.title} className="notes__section">
            <h2>{group.title}</h2>
            <div className={`notes__grid ${s.view}`}>{group.notes.map(noteCard)}</div>
          </section>)}
        </div>
      </div>
      <ExtendedFab icon={ADD_ICON} ariaLabel="New note" onClick={() => open(null)}>New note</ExtendedFab>
      {compact ? (
        <BottomSheet open={draft !== null} title={draft?.note ? "Edit note" : "New note"} modal onClose={() => setDraft(null)}>
          {editorBody}
          {sheetActions}
        </BottomSheet>
      ) : (
        <Dialog open={draft !== null} headline={draft?.note ? "Edit note" : "New note"} onClose={() => setDraft(null)}>
          {editorBody}
          {editorActions}
        </Dialog>
      )}
      <Snackbar message="Note deleted" action="Undo" duration="4000" dismissible onAction={undo} ref={snackbar} />
    </section>
  );
}
