// Web components: the elements themselves, no framework.
import "material/elements/css";
import { defineAll } from "material/elements";
import { DEFAULTS, LABELS, ADD_ICON, CLOSE_ICON, GRID_ICON, LIST_ICON, MENU_ICON, MORE_ICON, SEARCH_ICON,
  categoryItems, categoryLabels, editedLabel, emptyLabel, labelOf, nextEdit, noteGroups, observeCompact, status, visible,
  type Category, type LabelId, type Note, type State } from "./shared";

defineAll();

const s: State = { ...DEFAULTS, notes: DEFAULTS.notes.map((n) => ({ ...n, labels: [...n.labels] })) };
let compact = false;
const app = document.getElementById("app")!;
const shell = Object.assign(document.createElement("section"), { className: "notes" });

const iconButton = (icon: string, label: string) => {
  const button = document.createElement("m-icon-button");
  button.setAttribute("icon", icon);
  button.setAttribute("aria-label", label);
  return button;
};
const bar = document.createElement("m-top-app-bar");
bar.setAttribute("headline", "Notes");
bar.setAttribute("no-scroll", "");
const menuButton = iconButton(MENU_ICON, "Open categories");
menuButton.slot = "leading";
menuButton.className = "notes__menu";
menuButton.addEventListener("click", () => drawer.setAttribute("open", ""));
const tools = Object.assign(document.createElement("div"), { className: "notes__tools", slot: "trailing" });
const mobileSearch = Object.assign(document.createElement("div"), { className: "notes__mobile-search", hidden: true });
const searchButton = iconButton(SEARCH_ICON, "Search notes");
const showSearch = (open: boolean) => {
  mobileSearch.hidden = !open;
  searchButton.setAttribute("icon", open ? CLOSE_ICON : SEARCH_ICON);
  searchButton.setAttribute("aria-label", open ? "Close search" : "Search notes");
};
searchButton.addEventListener("click", () => {
  const opening = mobileSearch.hidden;
  showSearch(opening);
  if (opening) requestAnimationFrame(() => search.focus());
  else {
    search.setAttribute("value", "");
    s.query = "";
    render();
  }
});
bar.append(menuButton, tools);
const search = document.createElement("m-search");
search.className = "notes__search";
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
const workspace = Object.assign(document.createElement("div"), { className: "notes__workspace" });
const drawerSlot = Object.assign(document.createElement("div"), { className: "notes__drawer" });
const content = Object.assign(document.createElement("div"), { className: "notes__content" });
const rows = document.createElement("div");
const statusLine = Object.assign(document.createElement("output"), { className: "notes__status" });
statusLine.setAttribute("role", "status");
content.append(statusLine, rows);
workspace.append(drawerSlot, content);

const createCategories = (modal: boolean) => {
  const drawer = document.createElement("m-drawer");
  drawer.setAttribute("aria-label", "Categories");
  drawer.setAttribute("width", "216");
  drawer.toggleAttribute(modal ? "modal" : "open", true);
  drawer.setAttribute("value", s.category);
  for (const { id, label, badge } of categoryItems(s)) {
    if (id === "ideas") {
      const section = document.createElement("m-drawer-item");
      section.setAttribute("type", "section");
      section.textContent = "Labels";
      drawer.append(section);
    }
    const item = document.createElement("m-drawer-item");
    item.setAttribute("value", id);
    item.setAttribute("badge", badge);
    item.textContent = label;
    drawer.append(item);
  }
  drawer.addEventListener("change", (event) => {
    s.category = (event as CustomEvent<{ value: Category }>).detail.value;
    if (modal) drawer.removeAttribute("open");
    render();
  });
  if (modal) drawer.addEventListener("close", () => { if (compact) menuButton.focus(); });
  return drawer;
};
let drawer: ReturnType<typeof createCategories>;

const card = (note: Note): HTMLElement => {
  const article = Object.assign(document.createElement("article"), { className: "notes__card" });
  article.setAttribute("aria-label", note.title);
  const surface = document.createElement("m-card");
  const heading = Object.assign(document.createElement("div"), { className: "notes__card-heading" });
  const open = Object.assign(document.createElement("button"), { className: "notes__open", type: "button", textContent: note.title });
  open.addEventListener("click", () => editorOpen(note));
  const more = iconButton(MORE_ICON, `More actions for ${note.title}`);
  more.id = `notes-more-${note.id}`;
  more.className = "notes__more";
  heading.append(open, more);
  surface.append(heading, Object.assign(document.createElement("p"), { textContent: note.text }));
  if (note.labels.length) {
    surface.append(Object.assign(document.createElement("p"), { className: "notes__labels", textContent: note.labels.map(labelOf).join(" · ") }));
  }
  surface.append(Object.assign(document.createElement("time"), { dateTime: new Date(note.editedAt).toISOString(), textContent: editedLabel(note.editedAt) }));
  const menu = document.createElement("m-menu");
  menu.setAttribute("anchor", more.id);
  menu.setAttribute("position", "bottom-end");
  for (const [value, label] of [["pin", note.pinned ? "Unpin" : "Pin"], ["labels", "Labels"], ["delete", "Delete"]]) {
    const item = document.createElement("m-menu-item");
    item.setAttribute("value", value);
    item.textContent = label;
    menu.append(item);
  }
  menu.addEventListener("select", (event) => {
    const action = (event as CustomEvent<{ value: string }>).detail.value;
    if (action === "pin") { note.pinned = !note.pinned; render(); }
    else if (action === "labels") editorOpen(note);
    else if (action === "delete") deleteNote(note);
  });
  article.append(surface, menu);
  return article;
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
  // A note that was never saved is discarded; there is nothing to delete or undo.
  if (!editing) return;
  if (s.notes.includes(editing)) deleteNote(editing);
  else editorClose();
});
const editorCancel = document.createElement("m-button");
editorCancel.setAttribute("variant", "text");
editorCancel.textContent = "Cancel";
const editorSave = document.createElement("m-button");
editorSave.textContent = "Save";
editorActions.append(editorDelete, editorCancel, editorSave);

let editing: Note | null = null;
const dialog = document.createElement("m-dialog");
const sheet = document.createElement("m-bottom-sheet");
sheet.setAttribute("modal", "");
const editorOpen = (note: Note | null): void => {
  editing = note ?? { id: crypto.randomUUID(), title: "", text: "", labels: categoryLabels(s.category), pinned: s.category === "pinned", editedAt: nextEdit(s.notes) };
  const headline = note ? "Edit note" : "New note";
  editorActions.slot = compact ? "" : "actions";
  const editor = compact ? sheet : dialog;
  editor.setAttribute(compact ? "title" : "headline", headline);
  editor.append(fields, editorActions);
  titleField.value = editing.title;
  textField.value = editing.text;
  setEditorChips(editing.labels);
  editor.open = true;
};
const editorClose = (): void => {
  dialog.open = false;
  sheet.open = false;
};
editorCancel.addEventListener("click", editorClose);
editorSave.addEventListener("click", () => {
  if (!editing) return;
  editing.title = String(titleField.value || "");
  editing.text = String(textField.value || "");
  editing.labels = [...editorLabels];
  editing.editedAt = nextEdit(s.notes);
  if (!s.notes.includes(editing)) s.notes = [...s.notes, editing];
  editorClose();
  render();
});

const fab = document.createElement("m-extended-fab");
fab.setAttribute("icon", ADD_ICON);
fab.setAttribute("aria-label", "New note");
fab.textContent = "New note";
fab.addEventListener("click", () => editorOpen(null));

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

const render = (): void => {
  statusLine.textContent = status(s);
  if (drawer.getAttribute("value") !== s.category) drawer.setAttribute("value", s.category);
  for (const { id, badge } of categoryItems(s)) {
    const item = drawer.querySelector(`[value="${id}"]`);
    if (item?.getAttribute("badge") !== badge) item?.setAttribute("badge", badge);
  }
  const groups = noteGroups(visible(s));
  if (groups.length === 0) {
    const empty = Object.assign(document.createElement("div"), { className: "notes__empty" });
    empty.append(Object.assign(document.createElement("p"), { textContent: emptyLabel(s) }));
    if (!s.query) {
      const create = document.createElement("m-button");
      create.textContent = "Create note";
      create.setAttribute("variant", "text");
      create.addEventListener("click", () => editorOpen(null));
      empty.append(create);
    }
    rows.replaceChildren(empty);
    return;
  }
  rows.replaceChildren(...groups.map(group => {
    const section = Object.assign(document.createElement("section"), { className: "notes__section" });
    const grid = Object.assign(document.createElement("div"), { className: `notes__grid ${s.view}` });
    grid.append(...group.notes.map(card));
    section.append(Object.assign(document.createElement("h2"), { textContent: group.title }), grid);
    return section;
  }));
};

shell.append(bar, mobileSearch, workspace, fab, dialog, sheet, snackbar);
app.append(shell);
observeCompact(shell, narrow => {
  compact = narrow;
  shell.dataset.compact = String(compact);
  editorClose();
  showSearch(false);
  if (narrow) {
    mobileSearch.append(search);
    tools.replaceChildren(searchButton);
  } else tools.replaceChildren(search, views);
  menuButton.hidden = !narrow;
  drawer = createCategories(narrow);
  drawerSlot.replaceChildren(drawer);
  render();
});
