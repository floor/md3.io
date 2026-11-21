/** @jsxImportSource solid-js — this file's JSX is Solid's, not React's; tsc reads it. */
// Solid: material/solid wraps the same elements.
import { createSignal, For, Show, onCleanup, onMount } from "solid-js";
import { BottomSheet, Button, ButtonGroup, ButtonGroupItem, Card, Chip, Chips, Dialog, Drawer, DrawerItem, ExtendedFab, IconButton, Menu, MenuItem, Search, Snackbar, TextField, TopAppBar } from "material/solid";
import { DEFAULTS, LABELS, ADD_ICON, CLOSE_ICON, GRID_ICON, LIST_ICON, MENU_ICON, MORE_ICON, SEARCH_ICON,
  categoryItems, categoryLabels, editedLabel, emptyLabel, labelOf, nextEdit, noteGroups, noteTitle, observeCompact, status, visible,
  type Category, type LabelId, type Note, type State } from "./shared";

interface Draft {
  note: Note | null;
  title: string;
  text: string;
  labels: LabelId[];
}

export default function Notes() {
  const [s, setS] = createSignal<State>({ ...DEFAULTS, notes: DEFAULTS.notes.map((n) => ({ ...n, labels: [...n.labels] })) });
  const [draft, setDraft] = createSignal<Draft | null>(null);
  const [compact, setCompact] = createSignal(false);
  const [drawerOpen, setDrawerOpen] = createSignal(false);
  const [searchOpen, setSearchOpen] = createSignal(false);
  let shell!: HTMLElement;
  onMount(() => onCleanup(observeCompact(shell, (narrow) => {
    setCompact(narrow);
    setDrawerOpen(false);
    setSearchOpen(false);
  })));
  const closeDrawer = () => {
    if (!compact()) return;
    setDrawerOpen(false);
    queueMicrotask(() => shell.querySelector<HTMLElement>(".notes__menu")?.focus());
  };
  const toggleSearch = () => {
    if (searchOpen()) setS(prev => ({ ...prev, query: "" }));
    else requestAnimationFrame(() => shell.querySelector<HTMLElement>(".notes__search")?.focus());
    setSearchOpen(!searchOpen());
  };
  const [snackbar, setSnackbar] = createSignal<{ show: () => void } | null>(null);
  let deleted: { note: Note; at: number } | null = null;

  const open = (note: Note | null): void => {
    setDraft(note ? { note, title: note.title, text: note.text, labels: [...note.labels] } : { note: null, title: "", text: "", labels: categoryLabels(s().category) });
  };
  const save = (): void => {
    const d = draft();
    if (!d) return;
    if (d.note) {
      setS((prev) => ({ ...prev, notes: prev.notes.map((n) => (n === d.note ? { ...n, title: noteTitle(d.title), text: d.text, labels: [...d.labels], editedAt: nextEdit(prev.notes) } : n)) }));
    } else {
      setS((prev) => ({ ...prev, notes: [...prev.notes, { id: crypto.randomUUID(), title: noteTitle(d.title), text: d.text, labels: [...d.labels], pinned: s().category === "pinned", editedAt: nextEdit(prev.notes) }] }));
    }
    setDraft(null);
  };
  const remove = (note: Note): void => {
    deleted = { note, at: s().notes.indexOf(note) };
    setS((prev) => ({ ...prev, notes: prev.notes.filter((n) => n !== note) }));
    setDraft(null);
    snackbar()?.show();
  };
  const asStrings = (value: string | string[] | null): string[] => (Array.isArray(value) ? value : value ? [value] : []);
  const undo = (): void => {
    if (!deleted) return;
    const { note, at } = deleted;
    deleted = null;
    setS((prev) => ({ ...prev, notes: [...prev.notes.slice(0, at), note, ...prev.notes.slice(at)] }));
  };
  const items = () => categoryItems(s());
  const groups = () => noteGroups(visible(s()));
  const search = () => <Search class="notes__search" placeholder="Search notes" value={s().query}
    onInput={(e) => setS(prev => ({ ...prev, query: e.detail.value }))} />;
  const drawer = (modal: boolean) => (
    <Drawer class="notes__drawer" modal={modal} open={!modal || drawerOpen()}
      width="216" value={s().category} ariaLabel="Categories" onClose={closeDrawer}
      onChange={(e) => {
        setS(prev => ({ ...prev, category: e.detail.value as Category }));
        if (modal) setDrawerOpen(false);
      }}>
      <For each={items().slice(0, 2)}>{item => <DrawerItem value={item.id} badge={item.badge}>{item.label}</DrawerItem>}</For>
      <DrawerItem type="section">Labels</DrawerItem>
      <For each={items().slice(2)}>{item => <DrawerItem value={item.id} badge={item.badge}>{item.label}</DrawerItem>}</For>
    </Drawer>
  );
  const noteCard = (note: Note) => {
    const more = `notes-more-${note.id}`;
    return (
      <article class="notes__card" aria-label={note.title}>
        <Card>
          <div class="notes__card-heading">
            <button type="button" class="notes__open" onClick={() => open(note)}>{note.title}</button>
            <IconButton id={more} class="notes__more" icon={MORE_ICON} ariaLabel={`More actions for ${note.title}`} />
          </div>
          <p>{note.text}</p>
          <Show when={note.labels.length > 0}>
            <p class="notes__labels">{note.labels.map(labelOf).join(" · ")}</p>
          </Show>
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

  const editorFields = (
    <div class="notes__fields">
      <TextField label="Title" value={draft()?.title ?? ""} onInput={(e) => setDraft((d) => (d ? { ...d, title: e.detail.value } : d))} />
      <TextField label="Note" type="multiline" value={draft()?.text ?? ""} onInput={(e) => setDraft((d) => (d ? { ...d, text: e.detail.value } : d))} />
      <Chips value={(draft()?.labels ?? []).join(",")} onChange={(e) => setDraft((d) => (d ? { ...d, labels: asStrings(e.detail.value) as LabelId[] } : d))}>
        <For each={LABELS}>{(l) => <Chip label={l.text} value={l.value} />}</For>
      </Chips>
    </div>
  );
  const editorButtons = (
    <>
      <Button variant="outlined" onClick={() => (draft()?.note ? remove(draft()!.note!) : setDraft(null))}>Delete</Button>
      <Button variant="text" onClick={() => setDraft(null)}>Cancel</Button>
      <Button onClick={save}>Save</Button>
    </>
  );

  return (
    <section class="notes" ref={shell} data-compact={compact()}>
      <TopAppBar headline="Notes" noScroll>
        <Show when={compact()}>
          <IconButton slot="leading" class="notes__menu" icon={MENU_ICON}
            ariaLabel="Open categories" onClick={() => setDrawerOpen(true)} />
        </Show>
        <div slot="trailing" class="notes__tools">
          <Show when={compact()} fallback={search()}>
            <IconButton icon={searchOpen() ? CLOSE_ICON : SEARCH_ICON}
              ariaLabel={searchOpen() ? "Close search" : "Search notes"} onClick={toggleSearch} />
          </Show>
          <Show when={!compact()}>
            <ButtonGroup kind="connected" selection="single" required value={s().view}
              onChange={(e) => setS(prev => ({ ...prev, view: e.detail.value === "list" ? "list" : "grid" }))}>
              <ButtonGroupItem icon={GRID_ICON} value="grid" ariaLabel="Grid view" />
              <ButtonGroupItem icon={LIST_ICON} value="list" ariaLabel="List view" />
            </ButtonGroup>
          </Show>
        </div>
      </TopAppBar>
      <Show when={compact()}><div class="notes__mobile-search" hidden={!searchOpen()}>{search()}</div></Show>
      <div class="notes__workspace">
        <Show when={compact()} fallback={drawer(false)}>{drawer(true)}</Show>
        <div class="notes__content">
          <output class="notes__status" role="status">{status(s())}</output>
          <Show when={groups().length > 0} fallback={<div class="notes__empty"><p>{emptyLabel(s())}</p>
            <Show when={!s().query}><Button variant="text" onClick={() => open(null)}>Create note</Button></Show>
          </div>}>
            <For each={groups()}>{group => <section class="notes__section">
              <h2>{group.title}</h2>
              <div class={`notes__grid ${s().view}`}><For each={group.notes}>{noteCard}</For></div>
            </section>}</For>
          </Show>
        </div>
      </div>
      <ExtendedFab icon={ADD_ICON} ariaLabel="New note" onClick={() => open(null)}>New note</ExtendedFab>
      <Show
        when={compact()}
        fallback={
          <Dialog open={draft() !== null} headline={draft()?.note ? "Edit note" : "New note"} onClose={() => setDraft(null)}>
            {editorFields}
            <div slot="actions" class="notes__editor-actions">
              {editorButtons}
            </div>
          </Dialog>
        }
      >
        <BottomSheet open={draft() !== null} title={draft()?.note ? "Edit note" : "New note"} modal onClose={() => setDraft(null)}>
          {editorFields}
          <div class="notes__editor-actions">{editorButtons}</div>
        </BottomSheet>
      </Show>
      <Snackbar ref={setSnackbar} message="Note deleted" action="Undo" duration="4000" dismissible onAction={undo} />
    </section>
  );
}
