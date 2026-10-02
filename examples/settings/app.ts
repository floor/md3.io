// The Settings app: a list of categories, a detail pane per category, and a reset
// dialog with an undo snackbar. Vanilla this case study; the other framework variants
// are the ports the owner's answer will decide how to declare.
import createButton from "material/components/button";
import createDialog from "material/components/dialog";
import createList from "material/components/list";
import createSnackbar from "material/components/snackbar";
import { buildControl, type Control } from "./controls";
import { CATEGORIES, type Settings } from "./data";
import { ICONS } from "./icons";
import { createStore } from "./state";

// M3's window size classes: compact below 600 px (one pane), medium from 600 px (two
// panes, 50% each), expanded from 840 px (fixed pane 360 px), large from 1200 px (412 px).
const TWO_PANE = "(min-width: 600px)";

export const createSettingsApp = (): HTMLElement => {
  const store = createStore();
  const controls = new Map<string, Control>();
  const details = new Map<string, HTMLElement>();
  const headings = new Map<string, HTMLElement>();
  const rows = new Map<string, HTMLElement>();
  let current: string | null = null;
  let undoState: Settings | null = null;
  let resetConfirmed = false;

  const root = document.createElement("section");
  root.className = "settings-app";
  const header = document.createElement("header");
  header.className = "settings-app__header";
  const title = document.createElement("h1");
  title.className = "mtrl-headline-small"; // the pane title's type-scale role, from the library
  title.textContent = "Settings";
  header.append(title);

  const panes = document.createElement("div");
  panes.className = "settings-app__panes";
  const listPane = document.createElement("section");
  listPane.className = "settings-app__list-pane";
  const detailPane = document.createElement("div");
  detailPane.className = "settings-app__detail-pane";

  const list = createList({
    ariaLabel: "Settings categories",
    trackSelection: true,
    items: CATEGORIES.map((category) => ({
      id: category.id,
      headline: category.title,
      supportingText: category.summary,
      leading: { type: "icon", content: ICONS[category.icon] },
    })),
  });
  listPane.append(list.element);

  const reset = createButton({ text: "Reset all settings", variant: "outlined" });
  reset.element.classList.add("settings-app__reset");
  listPane.append(reset.element);

  // One detail pane per category, built once, applied on every state change.
  for (const category of CATEGORIES) {
    const detail = document.createElement("section");
    detail.className = "settings-app__detail";
    detail.hidden = true;
    const heading = document.createElement("h2");
    heading.className = "settings-app__detail-title mtrl-headline-small";
    heading.id = `settings-${category.id}-heading`;
    heading.tabIndex = -1;
    heading.textContent = category.title;
    detail.setAttribute("aria-labelledby", heading.id);
    const back = createButton({ text: "Back", variant: "text" });
    back.element.classList.add("settings-app__back");
    back.on("click", () => goBack());
    const detailHeader = document.createElement("div");
    detailHeader.className = "settings-app__detail-header";
    detailHeader.append(back.element, heading);
    detail.append(detailHeader);
    for (const group of category.groups) {
      const section = document.createElement("div");
      section.className = "settings-app__group";
      const groupTitle = document.createElement("h3");
      groupTitle.className = "settings-app__group-title mtrl-title-small";
      groupTitle.textContent = group.title;
      section.append(groupTitle);
      for (const setting of group.settings) {
        const control = buildControl(store, setting);
        controls.set(setting.key, control);
        section.append(control.element);
      }
      detail.append(section);
    }
    details.set(category.id, detail);
    headings.set(category.id, heading);
    detailPane.append(detail);
  }

  const dialog = createDialog({
    title: "Reset all settings?",
    content: "Every setting goes back to its default. You can undo this right after.",
    buttons: [
      { text: "Cancel", variant: "text" },
      { text: "Reset", variant: "filled", onClick: () => { resetConfirmed = true; } },
    ],
  });
  dialog.on("close", () => {
    if (!resetConfirmed) return;
    resetConfirmed = false;
    undoState = store.snapshot();
    store.reset();
    snackbar.show();
  });
  reset.on("click", () => dialog.open());

  // Undo lives only while the snackbar is open; a snapshot kept past its close is never
  // reachable, so there is nothing to clear on timeout.
  const snackbar = createSnackbar({
    message: "Settings reset",
    action: "Undo",
    duration: "long",
    onAction: () => {
      if (undoState) store.restore(undoState);
    },
  });

  const twoPane = window.matchMedia(TWO_PANE);
  const openCategory = (id: string, focusHeading: boolean): void => {
    current = id;
    for (const [key, detail] of details) detail.hidden = key !== id;
    // Selected state belongs to the list view of a two-pane layout; in the single pane the
    // detail replaces the list, so no row keeps a selection to come back to.
    if (twoPane.matches) list.setSelection([id]); // one row at a time; selectItem would add
    else list.clearSelection();
    root.classList.add("settings-app--detail");
    if (focusHeading) headings.get(id)?.focus();
  };
  const goBack = (): void => {
    if (twoPane.matches) return; // from 600 px both panes stay; there is no Back there
    const id = current;
    for (const detail of details.values()) detail.hidden = true;
    current = null;
    root.classList.remove("settings-app--detail");
    if (id) rows.get(id)?.focus();
  };
  list.on("select", (event) => {
    // The move is ours: the list's own toggle would deselect a row that is already
    // selected (after Back, or on the row that is open) while its detail is shown.
    event.preventDefault();
    if (event.value === current) return;
    // The event's element is the row; the row's button is what takes focus on return.
    rows.set(event.value, event.element.querySelector("button") ?? event.element);
    openCategory(event.value, !twoPane.matches);
  });
  const applyLayout = (): void => {
    if (!twoPane.matches) {
      list.clearSelection();
      return;
    }
    // No selection when the window widens: open the first category rather than a placeholder.
    if (!current) openCategory(CATEGORIES[0]!.id, false);
    else list.setSelection([current]);
  };
  twoPane.addEventListener("change", applyLayout);
  if (twoPane.matches) openCategory(CATEGORIES[0]!.id, false);

  store.subscribe((state) => {
    for (const control of controls.values()) control.apply(state);
  });

  panes.append(listPane, detailPane);
  root.append(header, panes);
  return root;
};
