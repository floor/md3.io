// React: material/react wraps the same elements.
import { useRef, useState } from "react";
import type { SnackbarElement } from "material/elements";
import { BottomSheet, Button, ButtonGroup, ButtonGroupItem, Card, Chip, Chips, Dialog, ExtendedFab, IconButton, Search, Snackbar, TextField } from "material/react";
import { DEFAULTS, LABELS, ADD_ICON, DELETE_ICON, GRID_ICON, LIST_ICON, PIN_ICON, labelOf, status, visible, type LabelId, type Note, type State } from "./shared";

const narrow = matchMedia("(max-width: 600px)").matches;

type Draft = { note: Note | null; title: string; text: string; labels: LabelId[] };

export default function Notes() {
  const [s, setS] = useState<State>(DEFAULTS);
  const [draft, setDraft] = useState<Draft | null>(null);
  const snackbar = useRef<SnackbarElement | null>(null);
  const deleted = useRef<{ note: Note; at: number } | null>(null);

  const open = (note: Note | null): void =>
    setDraft(note ? { note, title: note.title, text: note.text, labels: [...note.labels] } : { note: null, title: "", text: "", labels: [] });
  const save = (): void => {
    if (!draft) return;
    if (draft.note) {
      const edited = draft.note;
      setS((prev) => ({
        ...prev,
        notes: prev.notes.map((n) => (n === edited ? { ...n, title: draft.title, text: draft.text, labels: [...draft.labels] } : n)),
      }));
    } else {
      const note: Note = { id: crypto.randomUUID(), title: draft.title, text: draft.text, labels: [...draft.labels], pinned: false };
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

  const shown = visible(s);
  const pinnedNotes = shown.filter((n) => n.pinned);
  const otherNotes = shown.filter((n) => !n.pinned);
  const noteCard = (note: Note) => (
    <Card key={note.id} headline={note.title}>
      <IconButton
        slot="header-action"
        toggle
        selected={note.pinned}
        icon={PIN_ICON}
        ariaLabel={`${note.pinned ? "Unpin" : "Pin"} ${note.title}`}
        onChange={() => setS((prev) => ({ ...prev, notes: prev.notes.map((n) => (n === note ? { ...n, pinned: !n.pinned } : n)) }))}
      />
      <p>{note.text}</p>
      {note.labels.length > 0 && (
        <Chips value={s.filter.join(",")} onChange={(e) => setS((prev) => ({ ...prev, filter: e.detail.value as LabelId[] }))}>
          {note.labels.map((id) => (
            <Chip key={id} label={labelOf(id)} value={id} />
          ))}
        </Chips>
      )}
      <div slot="actions" className="notes__card-actions">
        <Button variant="text" ariaLabel={`Open ${note.title}`} onClick={() => open(note)}>Open</Button>
        <IconButton icon={DELETE_ICON} ariaLabel={`Delete ${note.title}`} onClick={() => remove(note)} />
      </div>
    </Card>
  );
  const grid = (notes: Note[]) => <div className={`notes__grid ${s.view}`}>{notes.map(noteCard)}</div>;

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
      <Button variant="outlined" onClick={() => draft?.note && remove(draft.note)}>Delete</Button>
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
    <section className="notes">
      <div className="notes__bar">
        <Search placeholder="Search notes" onInput={(e) => setS((prev) => ({ ...prev, query: e.detail.value }))} />
        <ButtonGroup kind="connected" selection="single" required value={s.view} onChange={(e) => setS((prev) => ({ ...prev, view: e.detail.value === "list" ? "list" : "grid" }))}>
          <ButtonGroupItem icon={GRID_ICON} value="grid" ariaLabel="Grid view" />
          <ButtonGroupItem icon={LIST_ICON} value="list" ariaLabel="List view" />
        </ButtonGroup>
      </div>
      <Chips value={s.filter.join(",")} onChange={(e) => setS((prev) => ({ ...prev, filter: e.detail.value as LabelId[] }))}>
        {LABELS.map(({ value, text }) => (
          <Chip key={value} label={text} value={value} />
        ))}
      </Chips>
      <output className="notes__status" role="status">{status(s)}</output>
      {pinnedNotes.length > 0 && (
        <section className="notes__section">
          <h2>Pinned</h2>
          {grid(pinnedNotes)}
        </section>
      )}
      <section className="notes__section">
        <h2>Notes</h2>
        {otherNotes.length > 0 ? grid(otherNotes) : <p className="notes__empty">No notes match.</p>}
      </section>
      <ExtendedFab icon={ADD_ICON} ariaLabel="New note" onClick={() => open(null)}>New note</ExtendedFab>
      {narrow ? (
        <BottomSheet open={draft !== null} title={draft?.note ? "Edit note" : "New note"} onClose={() => setDraft(null)}>
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
