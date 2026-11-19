/** @jsxImportSource solid-js — this file's JSX is Solid's, not React's; tsc reads it. */
// Solid: material/solid wraps the same elements.
import { createSignal, For, Show } from "solid-js";
import { BottomSheet, Button, ButtonGroup, ButtonGroupItem, Card, Chip, Chips, Dialog, ExtendedFab, IconButton, Search, Snackbar, TextField } from "material/solid";
import { DEFAULTS, LABELS, ADD_ICON, DELETE_ICON, GRID_ICON, LIST_ICON, PIN_ICON, labelOf, status, visible, type LabelId, type Note, type State } from "./shared";

const narrow = matchMedia("(max-width: 600px)").matches;

interface Draft {
  note: Note | null;
  title: string;
  text: string;
  labels: LabelId[];
}

export default function Notes() {
  const [s, setS] = createSignal<State>({ ...DEFAULTS, notes: DEFAULTS.notes.map((n) => ({ ...n, labels: [...n.labels] })) });
  const [draft, setDraft] = createSignal<Draft | null>(null);
  const [snackbar, setSnackbar] = createSignal<{ show: () => void } | null>(null);
  let deleted: { note: Note; at: number } | null = null;

  const open = (note: Note | null): void => {
    setDraft(note ? { note, title: note.title, text: note.text, labels: [...note.labels] } : { note: null, title: "", text: "", labels: [] });
  };
  const save = (): void => {
    const d = draft();
    if (!d) return;
    if (d.note) {
      setS((prev) => ({ ...prev, notes: prev.notes.map((n) => (n === d.note ? { ...n, title: d.title, text: d.text, labels: [...d.labels] } : n)) }));
    } else {
      setS((prev) => ({ ...prev, notes: [...prev.notes, { id: crypto.randomUUID(), title: d.title, text: d.text, labels: [...d.labels], pinned: false }] }));
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
  const setFilter = (value: string | string[] | null): void => {
    setS((prev) => ({ ...prev, filter: asStrings(value) as LabelId[] }));
  };
  const pin = (note: Note): void => {
    setS((prev) => ({ ...prev, notes: prev.notes.map((n) => (n === note ? { ...n, pinned: !n.pinned } : n)) }));
  };

  const shownCount = () => visible(s()).length;
  const pinnedNotes = () => visible(s()).filter((n) => n.pinned);
  const otherNotes = () => visible(s()).filter((n) => !n.pinned);
  const noteCard = (note: Note) => (
    <Card headline={note.title}>
      <IconButton
        slot="header-action"
        toggle
        selected={note.pinned}
        icon={PIN_ICON}
        ariaLabel={`Pin ${note.title}`}
        onChange={() => pin(note)}
      />
      <p>{note.text}</p>
      <Show when={note.labels.length > 0}>
        <Chips value={s().filter.join(",")} onChange={(e) => setFilter(e.detail.value)}>
          <For each={note.labels}>{(id) => <Chip label={labelOf(id)} value={id} />}</For>
        </Chips>
      </Show>
      <div slot="actions" class="notes__card-actions">
        <Button variant="text" ariaLabel={`Open ${note.title}`} onClick={() => open(note)}>Open</Button>
        <IconButton icon={DELETE_ICON} ariaLabel={`Delete ${note.title}`} onClick={() => remove(note)} />
      </div>
    </Card>
  );
  const grid = (notes: Note[]) => <div class={`notes__grid ${s().view}`}>{notes.map(noteCard)}</div>;

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
    <section class="notes">
      <div class="notes__bar">
        <Search placeholder="Search notes" onInput={(e) => setS((prev) => ({ ...prev, query: e.detail.value }))} />
        <ButtonGroup kind="connected" selection="single" required value={s().view} onChange={(e) => setS((prev) => ({ ...prev, view: e.detail.value === "list" ? "list" : "grid" }))}>
          <ButtonGroupItem icon={GRID_ICON} value="grid" ariaLabel="Grid view" />
          <ButtonGroupItem icon={LIST_ICON} value="list" ariaLabel="List view" />
        </ButtonGroup>
      </div>
      <Chips value={s().filter.join(",")} onChange={(e) => setFilter(e.detail.value)}>
        <For each={LABELS}>{(l) => <Chip label={l.text} value={l.value} />}</For>
      </Chips>
      <output class="notes__status" role="status">{status(s())}</output>
      <Show
        when={shownCount() > 0}
        fallback={<p class="notes__empty">No notes match.</p>}
      >
        <Show when={pinnedNotes().length > 0}>
          <section class="notes__section">
            <h2>Pinned</h2>
            {grid(pinnedNotes())}
          </section>
        </Show>
        <Show when={otherNotes().length > 0}>
          <section class="notes__section">
            <h2>Notes</h2>
            {grid(otherNotes())}
          </section>
        </Show>
      </Show>
      <ExtendedFab icon={ADD_ICON} ariaLabel="New note" onClick={() => open(null)}>New note</ExtendedFab>
      <Show
        when={narrow}
        fallback={
          <Dialog open={draft() !== null} headline={draft()?.note ? "Edit note" : "New note"} onClose={() => setDraft(null)}>
            {editorFields}
            <div slot="actions" class="notes__editor-actions">
              {editorButtons}
            </div>
          </Dialog>
        }
      >
        <BottomSheet open={draft() !== null} title={draft()?.note ? "Edit note" : "New note"} onClose={() => setDraft(null)}>
          {editorFields}
          <div class="notes__editor-actions">{editorButtons}</div>
        </BottomSheet>
      </Show>
      <Snackbar ref={setSnackbar} message="Note deleted" action="Undo" duration="4000" dismissible onAction={undo} />
    </section>
  );
}
