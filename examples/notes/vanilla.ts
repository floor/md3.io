// Vanilla: the create* factories the elements are built on.
import createButton from "material/components/button";
import createButtonGroup from "material/components/button-group";
import createCard from "material/components/card";
import createChips from "material/components/chips";
import createDialog from "material/components/dialog";
import createBottomSheet from "material/components/bottom-sheet";
import createDrawer from "material/components/drawer";
import createMenu from "material/components/menu";
import createTopAppBar from "material/components/top-app-bar";
import createExtendedFab from "material/components/extended-fab";
import createIconButton from "material/components/icon-button";
import createSearch from "material/components/search";
import createSnackbar from "material/components/snackbar";
import createTextField from "material/components/text-field";
import { DEFAULTS, LABELS, ADD_ICON, CLOSE_ICON, GRID_ICON, LIST_ICON, MENU_ICON, MORE_ICON, SEARCH_ICON,
  categoryItems, categoryLabels, editedLabel, emptyLabel, labelOf, nextEdit, noteGroups, noteTitle, observeCompact, status, visible,
  type Category, type LabelId, type Note, type State } from "./shared";

const s: State = { ...DEFAULTS, notes: DEFAULTS.notes.map((n) => ({ ...n, labels: [...n.labels] })) };
const asStrings = (value: string | string[] | null): string[] => Array.isArray(value) ? value : value ? [value] : [];
const app = document.getElementById("app")!;
const shell = Object.assign(document.createElement("section"), { className: "notes" });
const workspace = Object.assign(document.createElement("div"), { className: "notes__workspace" });
const drawerSlot = Object.assign(document.createElement("div"), { className: "notes__drawer" });
const content = Object.assign(document.createElement("div"), { className: "notes__content" });
const rows = document.createElement("div");
const statusLine = Object.assign(document.createElement("output"), { className: "notes__status" });
statusLine.setAttribute("role", "status");
content.append(statusLine, rows);
workspace.append(drawerSlot, content);

let compact = false;
const createCategories = (modal: boolean) => {
  const items = categoryItems(s).map(item => ({ ...item, active: item.id === s.category }));
  const drawer = createDrawer({
    variant: modal ? "modal" : "standard", open: !modal, layer: modal ? "top" : undefined,
    width: 216, ariaLabel: "Categories",
    items: [...items.slice(0, 2), { type: "section", label: "Labels" }, ...items.slice(2)],
  });
  drawer.on("select", ({ id }) => {
    s.category = id as Category;
    if (modal) drawer.close();
    render();
  });
  if (modal) drawer.on("close", () => { if (compact) menuButton.element.focus(); });
  return drawer;
};
const inlineDrawer = createCategories(false);
const modalDrawer = createCategories(true);

const bar = createTopAppBar({ title: "Notes", scrollable: false });
const tools = Object.assign(document.createElement("div"), { className: "notes__tools" });
const mobileSearch = Object.assign(document.createElement("div"), { className: "notes__mobile-search", hidden: true });
const menuButton = createIconButton({ icon: MENU_ICON, ariaLabel: "Open categories" });
menuButton.element.classList.add("notes__menu");
menuButton.on("click", () => modalDrawer.open());
const search = createSearch({ placeholder: "Search notes" });
search.element.classList.add("notes__search");
search.on("input", ({ value }: { value: string }) => { s.query = value; render(); });
const searchButton = createIconButton({ icon: SEARCH_ICON, ariaLabel: "Search notes" });
searchButton.on("click", () => {
  const opening = mobileSearch.hidden;
  mobileSearch.hidden = !opening;
  searchButton.setIcon(opening ? CLOSE_ICON : SEARCH_ICON);
  searchButton.setAriaLabel(opening ? "Close search" : "Search notes");
  if (opening) requestAnimationFrame(() => search.focus());
  else search.setValue("", true);
});
const views = createButtonGroup({
  kind: "connected", selection: "single", required: true,
  buttons: [
    { icon: GRID_ICON, ariaLabel: "Grid view", value: "grid", selected: s.view === "grid" },
    { icon: LIST_ICON, ariaLabel: "List view", value: "list", selected: s.view === "list" },
  ],
});
views.on("change", ({ value }: { value: string | string[] | null }) => {
  s.view = asStrings(value)[0] === "list" ? "list" : "grid";
  render();
});
bar.addLeadingElement(menuButton.element);
bar.addTrailingElement(tools);

let menus: ReturnType<typeof createMenu>[] = [];
const card = (note: Note): HTMLElement => {
  const article = Object.assign(document.createElement("article"), { className: "notes__card" });
  article.setAttribute("aria-label", note.title);
  const heading = Object.assign(document.createElement("div"), { className: "notes__card-heading" });
  const open = Object.assign(document.createElement("button"), { className: "notes__open", type: "button", textContent: note.title });
  open.addEventListener("click", () => editorOpen(note));
  const more = createIconButton({ icon: MORE_ICON, ariaLabel: `More actions for ${note.title}` });
  more.element.classList.add("notes__more");
  heading.append(open, more.element);
  const body: HTMLElement[] = [heading, Object.assign(document.createElement("p"), { textContent: note.text })];
  if (note.labels.length) {
    body.push(Object.assign(document.createElement("p"), { className: "notes__labels", textContent: note.labels.map(labelOf).join(" · ") }));
  }
  body.push(Object.assign(document.createElement("time"), { dateTime: new Date(note.editedAt).toISOString(), textContent: editedLabel(note.editedAt) }));
  const surface = createCard({ content: { children: body } });
  article.append(surface.element);
  const menu = createMenu({
    opener: more.element, position: "bottom-end", layer: "top",
    items: [{ id: "pin", text: note.pinned ? "Unpin" : "Pin" }, { id: "labels", text: "Labels" }, { id: "delete", text: "Delete" }],
  });
  menu.on("select", ({ itemId }) => {
    if (itemId === "pin") { note.pinned = !note.pinned; render(); }
    else if (itemId === "labels") editorOpen(note);
    else if (itemId === "delete") deleteNote(note);
  });
  menus.push(menu);
  return article;
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
const save = (): void => {
  if (!editing) return;
  editing.title = noteTitle(titleField.getValue());
  editing.text = textField.getValue();
  editing.labels = [...editorLabels];
  editing.editedAt = nextEdit(s.notes);
  if (!s.notes.includes(editing)) s.notes = [...s.notes, editing];
  if (compact) sheet.close();
  render();
};
const removeEditing = () => {
  if (editing && s.notes.includes(editing)) deleteNote(editing);
  else if (compact) sheet.close();
};
const dialog = createDialog({
  title: "Edit note",
  buttons: [
    { text: "Delete", variant: "outlined", onClick: removeEditing },
    { text: "Cancel", variant: "text" },
    { text: "Save", onClick: save },
  ],
});
const sheetContent = document.createElement("div");
const sheet = createBottomSheet({ title: "Edit note", variant: "modal", content: sheetContent });
const sheetActions = Object.assign(document.createElement("div"), { className: "notes__editor-actions" });
const sheetButton = (text: string, variant: string | undefined, action: () => void) => {
  const button = createButton(variant ? { text, variant } : { text });
  button.on("click", action);
  return button.element;
};
sheetActions.append(
  sheetButton("Delete", "outlined", removeEditing),
  sheetButton("Cancel", "text", () => { sheet.close(); }),
  sheetButton("Save", undefined, save),
);
const editorOpen = (note: Note | null, headline = note ? "Edit note" : "New note"): void => {
  editing = note ?? { id: crypto.randomUUID(), title: "", text: "", labels: categoryLabels(s.category), pinned: s.category === "pinned", editedAt: nextEdit(s.notes) };
  const editor = compact ? sheet : dialog;
  if (compact) {
    fields.append(sheetActions);
    sheetContent.append(fields);
  } else {
    sheetActions.remove();
    dialog.element.querySelector(".mtrl-dialog__content")?.append(fields);
  }
  editor.setTitle(headline);
  titleField.setValue(editing.title);
  textField.setValue(editing.text);
  setEditorChips(editing.labels);
  editor.open();
};

const fab = createExtendedFab({ icon: ADD_ICON, text: "New note", ariaLabel: "New note" });
fab.on("click", () => editorOpen(null));

// Deleting shows the snackbar; Undo puts the note back where it was. The factory
// snackbar joins the top layer, as the element always does: it shows in place and
// hides on the popover's own timer.
const snackbar = createSnackbar({ message: "Note deleted", action: "Undo", duration: 4000, dismissible: true, layer: "top" });
let lastDeleted: { note: Note; at: number } | null = null;
const deleteNote = (note: Note): void => {
  lastDeleted = { note, at: s.notes.indexOf(note) };
  s.notes = s.notes.filter((n) => n !== note);
  if (compact) { if (sheet.isOpen()) sheet.close(); }
  else if (dialog.isOpen()) dialog.close();
  render();
  snackbar.show();
};
snackbar.on("action", () => {
  if (!lastDeleted) return;
  s.notes = [...s.notes.slice(0, lastDeleted.at), lastDeleted.note, ...s.notes.slice(lastDeleted.at)];
  lastDeleted = null;
  render();
});

const render = (): void => {
  statusLine.textContent = status(s);
  const items = categoryItems(s);
  const drawer = compact ? modalDrawer : inlineDrawer;
  if (drawer.getActive() !== s.category) drawer.setActive(s.category);
  for (const item of items) drawer.setBadge(item.id, item.badge);

  menus.forEach(menu => menu.destroy());
  menus = [];
  const groups = noteGroups(visible(s));
  if (groups.length === 0) {
    const empty = Object.assign(document.createElement("div"), { className: "notes__empty" });
    empty.append(Object.assign(document.createElement("p"), { textContent: emptyLabel(s) }));
    if (!s.query) {
      const create = createButton({ text: "Create note", variant: "text" });
      create.on("click", () => editorOpen(null));
      empty.append(create.element);
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

shell.append(bar.element, mobileSearch, workspace, fab.element, dialog.element, sheet.element, snackbar.element);
app.append(shell);
observeCompact(shell, narrow => {
  // The typed fields are a draft until Save. A saved note is not rewritten by the switch.
  const open = dialog.isOpen() || sheet.isOpen();
  const carried = open && editing ? {
    note: s.notes.includes(editing) ? editing : null,
    title: titleField.getValue(),
    text: textField.getValue(),
    labels: [...editorLabels],
  } : null;
  compact = narrow;
  shell.dataset.compact = String(narrow);
  if (modalDrawer.isOpen()) modalDrawer.close();
  if (dialog.isOpen()) dialog.close();
  if (sheet.isOpen()) sheet.close();
  mobileSearch.hidden = true;
  searchButton.setIcon(SEARCH_ICON);
  searchButton.setAriaLabel("Search notes");
  if (narrow) {
    mobileSearch.append(search.element);
    tools.replaceChildren(searchButton.element);
  } else tools.replaceChildren(search.element, views.element);
  menuButton.element.hidden = !narrow;
  drawerSlot.replaceChildren((narrow ? modalDrawer : inlineDrawer).element);
  render();
  if (carried) {
    editorOpen(carried.note);
    titleField.setValue(carried.title);
    textField.setValue(carried.text);
    setEditorChips(carried.labels);
  }
});
