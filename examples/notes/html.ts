// Web components: the elements themselves, no framework.
import "material/elements/css";
import { defineAll } from "material/elements";
import { DEFAULTS, LABELS, ADD_ICON, DELETE_ICON, GRID_ICON, LIST_ICON, PIN_ICON, labelOf, status, visible, type LabelId, type Note, type State } from "./shared";

defineAll();

const s: State = { ...DEFAULTS, notes: DEFAULTS.notes.map((n) => ({ ...n, labels: [...n.labels] })) };
const narrow = matchMedia("(max-width: 600px)").matches;
const app = document.getElementById("app")!;
const shell = Object.assign(document.createElement("section"), { className: "notes" });

// The bar: search on the left, the view toggle on the right.
const bar = Object.assign(document.createElement("div"), { className: "notes__bar" });
const search = document.createElement("m-search");
search.setAttribute("placeholder", "Search notes");
search.addEventListener("input", (e) => {
  s.query = (e as CustomEvent<{ value: string }>).detail.value;
  render();
});
const views = document.createElement("m-button-group");
views.setAttribute("kind", "connected");
views.setAttribute("selection", "single");
views.setAttribute("required", "true");
for (const [value, icon, label] of [["grid", GRID_ICON, "Grid view"], ["list", LIST_ICON, "List view"]] as const) {
  const item = document.createElement("m-button-group-item");
  item.setAttribute("icon", icon);
  item.setAttribute("value", value);
  item.setAttribute("aria-label", label);
  if (s.view === value) item.setAttribute("selected", "");
  views.append(item);
}
views.addEventListener("change", (e) => {
  s.view = (e as CustomEvent<{ value: string }>).detail.value === "list" ? "list" : "grid";
  render();
});
bar.append(search, views);

// The label filter, above the grid. Its chips are declared once; after that its
// own value is the one source of truth, so a card chip and this row agree.
const filters = document.createElement("m-chips");
for (const { value, text } of LABELS) {
  const chip = document.createElement("m-chip");
  chip.setAttribute("label", text);
  chip.setAttribute("value", value);
  filters.append(chip);
}
filters.addEventListener("change", (e) => {
  s.filter = (e as CustomEvent<{ value: string[] }>).detail.value as LabelId[];
  render();
});

const statusLine = Object.assign(document.createElement("output"), { className: "notes__status" });
statusLine.setAttribute("role", "status");
const pinned = Object.assign(document.createElement("section"), { className: "notes__section" });
const rest = Object.assign(document.createElement("section"), { className: "notes__section" });

// One card. Its chips carry the note's labels; clicking one filters by it.
const card = (note: Note): HTMLElement => {
  const el = document.createElement("m-card");
  el.setAttribute("headline", note.title);
  const pin = document.createElement("m-icon-button");
  pin.setAttribute("slot", "header-action");
  pin.setAttribute("toggle", "");
  if (note.pinned) pin.setAttribute("selected", "");
  pin.setAttribute("icon", PIN_ICON);
  pin.setAttribute("aria-label", `${note.pinned ? "Unpin" : "Pin"} ${note.title}`);
  pin.addEventListener("change", () => {
    note.pinned = !note.pinned;
    render();
  });
  el.append(pin);
  const preview = Object.assign(document.createElement("p"), { textContent: note.text });
  el.append(preview);
  if (note.labels.length > 0) {
    const chips = document.createElement("m-chips");
    for (const id of note.labels) {
      const chip = document.createElement("m-chip");
      chip.setAttribute("label", labelOf(id));
      chip.setAttribute("value", id);
      if (s.filter.includes(id)) chip.setAttribute("selected", "");
      chips.append(chip);
    }
    chips.addEventListener("change", (e) => {
      s.filter = (e as CustomEvent<{ value: string[] }>).detail.value as LabelId[];
      render();
    });
    el.append(chips);
  }
  const actions = document.createElement("div");
  actions.setAttribute("slot", "actions");
  actions.className = "notes__card-actions";
  const open = document.createElement("m-button");
  open.setAttribute("variant", "text");
  open.setAttribute("aria-label", `Open ${note.title}`);
  open.textContent = "Open";
  open.addEventListener("click", () => editNote(note));
  const remove = document.createElement("m-icon-button");
  remove.setAttribute("icon", DELETE_ICON);
  remove.setAttribute("aria-label", `Delete ${note.title}`);
  remove.addEventListener("click", () => deleteNote(note));
  actions.append(open, remove);
  el.append(actions);
  return el;
};

// The editor: a dialog on a wide frame, a bottom sheet on a narrow one, the same
// content in either.
const fields = Object.assign(document.createElement("div"), { className: "notes__fields" });
const titleField = document.createElement("m-text-field");
titleField.setAttribute("label", "Title");
const textField = document.createElement("m-text-field");
textField.setAttribute("label", "Note");
textField.setAttribute("multiline", "");
// The editor's label chips: a fresh element each time the editor opens, so its
// selection starts from the note being edited.
let editorChips: HTMLElement & { value: string } = document.createElement("m-chips") as HTMLElement & { value: string };
let editorLabels: LabelId[] = [];
const setEditorChips = (labels: LabelId[]): void => {
  editorLabels = [...labels];
  const next = document.createElement("m-chips") as HTMLElement & { value: string };
  for (const { value, text } of LABELS) {
    const chip = document.createElement("m-chip");
    chip.setAttribute("label", text);
    chip.setAttribute("value", value);
    if (labels.includes(value)) chip.setAttribute("selected", "");
    next.append(chip);
  }
  next.addEventListener("change", (e) => {
    editorLabels = (e as CustomEvent<{ value: string[] }>).detail.value as LabelId[];
  });
  editorChips.replaceWith(next);
  editorChips = next;
};
fields.append(titleField, textField, editorChips);
const editorActions = Object.assign(document.createElement("div"), { className: "notes__editor-actions" });
const editorDelete = document.createElement("m-button");
editorDelete.setAttribute("variant", "outlined");
editorDelete.textContent = "Delete";
editorDelete.addEventListener("click", () => {
  if (editing) deleteNote(editing);
});
const editorCancel = document.createElement("m-button");
editorCancel.setAttribute("variant", "text");
editorCancel.textContent = "Cancel";
const editorSave = document.createElement("m-button");
editorSave.textContent = "Save";
editorActions.append(editorDelete, editorCancel, editorSave);

let editing: Note | null = null;
const editor = (narrow ? document.createElement("m-bottom-sheet") : document.createElement("m-dialog")) as HTMLElement & { open: boolean };
if (narrow) editor.setAttribute("modal", "");
const editorOpen = (note: Note | null): void => {
  editing = note ?? { id: crypto.randomUUID(), title: "", text: "", labels: [], pinned: false };
  editor.setAttribute("headline", note ? "Edit note" : "New note");
  titleField.value = editing.title;
  textField.value = editing.text;
  setEditorChips(editing.labels);
  editor.open = true;
};
const editorClose = (): void => {
  editor.open = false;
};
editorCancel.addEventListener("click", editorClose);
editor.addEventListener("close", editorClose);
editorSave.addEventListener("click", () => {
  editing!.title = String(titleField.value || "");
  editing!.text = String(textField.value || "");
  editing!.labels = [...editorLabels];
  if (!s.notes.includes(editing!)) s.notes = [...s.notes, editing!];
  editorClose();
  render();
});
const editNote = (note: Note): void => editorOpen(note);
const newNote = (): void => editorOpen(null);

const fab = document.createElement("m-extended-fab");
fab.setAttribute("icon", ADD_ICON);
fab.setAttribute("aria-label", "New note");
fab.textContent = "New note";
fab.addEventListener("click", newNote);

// Deleting shows the snackbar; Undo puts the note back where it was.
const snackbar = document.createElement("m-snackbar");
snackbar.setAttribute("message", "Note deleted");
snackbar.setAttribute("action", "Undo");
snackbar.setAttribute("duration", "4000");
snackbar.setAttribute("dismissible", "");
let lastDeleted: { note: Note; at: number } | null = null;
const deleteNote = (note: Note): void => {
  lastDeleted = { note, at: s.notes.indexOf(note) };
  s.notes = s.notes.filter((n) => n !== note);
  editorClose();
  render();
  snackbar.show();
};
snackbar.addEventListener("action", () => {
  if (!lastDeleted) return;
  s.notes = [...s.notes.slice(0, lastDeleted.at), lastDeleted.note, ...s.notes.slice(lastDeleted.at)];
  lastDeleted = null;
  render();
});

const grid = (notes: Note[]): HTMLElement => {
  const el = Object.assign(document.createElement("div"), { className: `notes__grid ${s.view}` });
  el.append(...notes.map(card));
  return el;
};
const render = (): void => {
  const shown = visible(s);
  statusLine.textContent = status(s);
  filters.value = s.filter.join(",");
  const pinnedNotes = shown.filter((n) => n.pinned);
  const otherNotes = shown.filter((n) => !n.pinned);
  pinned.hidden = pinnedNotes.length === 0;
  pinned.replaceChildren(
    Object.assign(document.createElement("h2"), { textContent: "Pinned" }),
    grid(pinnedNotes),
  );
  rest.replaceChildren(
    Object.assign(document.createElement("h2"), { textContent: "Notes" }),
    otherNotes.length > 0 ? grid(otherNotes) : Object.assign(document.createElement("p"), { className: "notes__empty", textContent: "No notes match." }),
  );
};

if (narrow) {
  editor.append(fields, editorActions);
} else {
  editor.append(fields);
  editorActions.setAttribute("slot", "actions");
  editor.append(editorActions);
}
shell.append(bar, filters, statusLine, pinned, rest, fab, editor, snackbar);
app.append(shell);
render();
