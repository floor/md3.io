// Vanilla: the create* factories the elements are built on.
import createButton from "material/components/button";
import createButtonGroup from "material/components/button-group";
import createCard from "material/components/card";
import createChips from "material/components/chips";
import createDialog from "material/components/dialog";
import createBottomSheet from "material/components/bottom-sheet";
import createExtendedFab from "material/components/extended-fab";
import createIconButton from "material/components/icon-button";
import createSearch from "material/components/search";
import createSnackbar from "material/components/snackbar";
import createTextField from "material/components/text-field";
import { DEFAULTS, LABELS, ADD_ICON, DELETE_ICON, GRID_ICON, LIST_ICON, PIN_ICON, labelOf, status, visible, type LabelId, type Note, type State } from "./shared";

const s: State = { ...DEFAULTS, notes: DEFAULTS.notes.map((n) => ({ ...n, labels: [...n.labels] })) };
/** What a chips or button-group change carries, whichever shape the payload takes. */
const asStrings = (value: string | string[] | null): string[] => (Array.isArray(value) ? value : value ? [value] : []);
const narrow = matchMedia("(max-width: 600px)").matches;
const app = document.getElementById("app")!;
const shell = Object.assign(document.createElement("section"), { className: "notes" });

// The bar: search on the left, the view toggle on the right.
const bar = Object.assign(document.createElement("div"), { className: "notes__bar" });
const search = createSearch({ placeholder: "Search notes" });
search.on("input", ({ value }: { value: string }) => {
  s.query = value;
  render();
});
const views = createButtonGroup({
  kind: "connected",
  selection: "single",
  required: true,
  buttons: [
    { icon: GRID_ICON, ariaLabel: "Grid view", value: "grid", selected: s.view === "grid" },
    { icon: LIST_ICON, ariaLabel: "List view", value: "list", selected: s.view === "list" },
  ],
});
views.on("change", ({ value }: { value: string | string[] | null }) => {
  s.view = asStrings(value)[0] === "list" ? "list" : "grid";
  render();
});
bar.append(search.element, views.element);

// The label filter, above the grid. Its own value is the one source of truth,
// so a card chip and this row agree.
const filters = createChips({ chips: LABELS.map(({ value, text }) => ({ type: "filter" as const, label: text, value, selected: s.filter.includes(value) })) });
filters.on("change", ({ value }: { value: string | string[] | null }) => {
  s.filter = asStrings(value) as LabelId[];
  render();
});

const statusLine = Object.assign(document.createElement("output"), { className: "notes__status" });
statusLine.setAttribute("role", "status");
const pinned = Object.assign(document.createElement("section"), { className: "notes__section" });
const rest = Object.assign(document.createElement("section"), { className: "notes__section" });

// One card. Its chips carry the note's labels; clicking one filters by it.
const card = (note: Note): ReturnType<typeof createCard> => {
  const pin = createIconButton({
    icon: PIN_ICON,
    toggle: true,
    selected: note.pinned,
    ariaLabel: `${note.pinned ? "Unpin" : "Pin"} ${note.title}`,
  });
  pin.on("change", () => {
    note.pinned = !note.pinned;
    render();
  });
  const chips =
    note.labels.length > 0
      ? createChips({
          chips: note.labels.map((id) => ({ type: "filter" as const, label: labelOf(id), value: id, selected: s.filter.includes(id) })),
        })
      : null;
  if (chips) {
    chips.on("change", ({ value }: { value: string | string[] | null }) => {
      s.filter = asStrings(value) as LabelId[];
      render();
    });
  }
  const open = createButton({ text: "Open", variant: "text", ariaLabel: `Open ${note.title}` });
  open.on("click", () => editorOpen(note));
  const remove = createIconButton({ icon: DELETE_ICON, ariaLabel: `Delete ${note.title}` });
  remove.on("click", () => deleteNote(note));
  const actions = Object.assign(document.createElement("div"), { className: "notes__card-actions" });
  actions.append(open.element, remove.element);
  return createCard({
    header: { title: note.title, action: pin.element },
    content: { children: [Object.assign(document.createElement("p"), { textContent: note.text }), ...(chips ? [chips.element] : [])] },
    actions: { actions: [actions] },
  });
};

// The editor: a dialog on a wide frame, a bottom sheet on a narrow one, the same
// content in either.
const fields = Object.assign(document.createElement("div"), { className: "notes__fields" });
const titleField = createTextField({ label: "Title" });
const textField = createTextField({ label: "Note", type: "multiline" });
let editorChips = createChips({ chips: [] });
let editorLabels: LabelId[] = [];
const setEditorChips = (labels: LabelId[]): void => {
  editorLabels = [...labels];
  const next = createChips({ chips: LABELS.map(({ value, text }) => ({ type: "filter" as const, label: text, value, selected: labels.includes(value) })) });
  next.on("change", ({ value }: { value: string | string[] | null }) => {
    editorLabels = asStrings(value) as LabelId[];
  });
  editorChips.element.replaceWith(next.element);
  editorChips = next;
};
fields.append(titleField.element, textField.element, editorChips.element);

let editing: Note | null = null;
// The dialog's own buttons close it; these handlers only apply the edit.
const save = (): void => {
  if (!editing) return;
  editing.title = titleField.getValue();
  editing.text = textField.getValue();
  editing.labels = [...editorLabels];
  if (!s.notes.includes(editing)) s.notes = [...s.notes, editing];
  if (narrow) editor.close();
  render();
};
// On a narrow frame the sheet takes the same buttons the dialog configures.
const sheetActions = Object.assign(document.createElement("div"), { className: "notes__editor-actions" });
const sheetButton = (text: string, variant: string | undefined, run: () => void) => {
  const button = createButton(variant ? { text, variant } : { text });
  button.on("click", () => run());
  return button;
};
const sheetClose = (): void => {
  editor.close();
};
const dialog = narrow
  ? null
  : createDialog({
      title: "Edit note",
      buttons: [
        { text: "Delete", variant: "outlined", onClick: () => { if (editing) deleteNote(editing); } },
        { text: "Cancel", variant: "text" },
        { text: "Save", onClick: () => save() },
      ],
    });
const editor = narrow
  ? createBottomSheet({ title: "Edit note", variant: "modal", content: fields })
  : dialog!;
if (dialog) (dialog as unknown as { structure: { content: HTMLElement } }).structure.content.append(fields);
if (narrow) {
  sheetActions.append(
    sheetButton("Delete", "outlined", () => { if (editing) deleteNote(editing); }).element,
    sheetButton("Cancel", "text", sheetClose).element,
    sheetButton("Save", undefined, () => save()).element,
  );
  fields.append(sheetActions);
}
// The factory dialog shows its content until it has been opened once; the
// element the other variants use hides itself. Keep the factory one out of the
// accessibility tree until it opens, the same as theirs.
editor.element.hidden = true;
editor.on("close", () => (editor.element.hidden = true));
const editorOpen = (note: Note | null): void => {
  editing = note ?? { id: crypto.randomUUID(), title: "", text: "", labels: [], pinned: false };
  editor.setTitle(note ? "Edit note" : "New note");
  titleField.setValue(editing.title);
  textField.setValue(editing.text);
  setEditorChips(editing.labels);
  editor.element.hidden = false;
  editor.open();
};

const fab = createExtendedFab({ icon: ADD_ICON, text: "New note", ariaLabel: "New note" });
fab.on("click", () => editorOpen(null));

// Deleting shows the snackbar; Undo puts the note back where it was. The
// factory snackbar, too, shows itself until told otherwise.
const snackbar = createSnackbar({ message: "Note deleted", action: "Undo", duration: 4000, dismissible: true });
snackbar.element.style.display = "none";
snackbar.on("close", () => (snackbar.element.style.display = "none"));
let lastDeleted: { note: Note; at: number } | null = null;
const deleteNote = (note: Note): void => {
  lastDeleted = { note, at: s.notes.indexOf(note) };
  s.notes = s.notes.filter((n) => n !== note);
  if (editor.isOpen?.()) editor.close();
  render();
  snackbar.element.style.display = "";
  snackbar.show();
};
snackbar.on("action", () => {
  if (!lastDeleted) return;
  s.notes = [...s.notes.slice(0, lastDeleted.at), lastDeleted.note, ...s.notes.slice(lastDeleted.at)];
  lastDeleted = null;
  render();
});

const grid = (notes: Note[]): HTMLElement => {
  const el = Object.assign(document.createElement("div"), { className: `notes__grid ${s.view}` });
  el.append(...notes.map((note) => card(note).element));
  return el;
};
const render = (): void => {
  const shown = visible(s);
  statusLine.textContent = status(s);
  filters.setValue(s.filter);
  const pinnedNotes = shown.filter((n) => n.pinned);
  const otherNotes = shown.filter((n) => !n.pinned);
  pinned.hidden = pinnedNotes.length === 0;
  pinned.replaceChildren(Object.assign(document.createElement("h2"), { textContent: "Pinned" }), grid(pinnedNotes));
  rest.replaceChildren(
    Object.assign(document.createElement("h2"), { textContent: "Notes" }),
    otherNotes.length > 0 ? grid(otherNotes) : Object.assign(document.createElement("p"), { className: "notes__empty", textContent: "No notes match." }),
  );
};

shell.append(bar, filters.element, statusLine, pinned, rest, fab.element, editor.element, snackbar.element);
app.append(shell);
render();
