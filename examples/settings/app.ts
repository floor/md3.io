// The Settings app: a list of categories, a detail pane per category, and a reset
// dialog with an undo snackbar. Vanilla this case study; the other framework variants
// are the ports the owner's answer will decide how to declare.
import createButton from "material/components/button";
import createDialog from "material/components/dialog";
import createIconButton from "material/components/icon-button";
import createList, { type ListItem } from "material/components/list";
import createSnackbar from "material/components/snackbar";
import createTopAppBar from "material/components/top-app-bar";
import { buildControl, type Control } from "./controls";
import { CATEGORIES, type Setting, type Settings } from "./data";
import { ICONS } from "./icons";
import { createStore } from "./state";

// M3's window size classes, read off the app's own box: the example frame adds 24 px of
// page padding around it. Compact below 600 px (one pane), medium from 600 px (two
// panes, 50% each), expanded from 840 px (fixed pane 360 px), large from 1200 px (412).
const TWO_PANE = "(min-width: 600px)";

const titleOf = (id: string): string => CATEGORIES.find((category) => category.id === id)?.title ?? "Settings";

export const createSettingsApp = (): HTMLElement => {
  const store = createStore();
  const controls = new Map<string, Control>();
  const details = new Map<string, HTMLElement>();
  const headings = new Map<string, HTMLElement>();
  const rows = new Map<string, HTMLElement>();
  let current: string | null = null;
  let last: string | null = null;
  let undoState: Settings | null = null;
  let resetConfirmed = false;

  const root = document.createElement("section");
  root.className = "settings-app";

  // One small app bar for the app: on the list screen its title stands alone; in the
  // single-pane detail it carries the category's title and Back, as the list-detail
  // page has the detail show with an app bar. The wide two-pane layout keeps "Settings"
  // and shows the pane's own title instead.
  const bar = createTopAppBar({ type: "small", title: "Settings", scrollable: false });
  bar.getHeadlineElement().tabIndex = -1; // the screen's title takes focus on a screen change
  const back = createIconButton({ icon: ICONS.arrowBack, ariaLabel: "Back" });
  back.on("click", () => goBack());
  const showBack = (show: boolean): void => {
    const leading = bar.getLeadingContainer();
    if (show) leading.replaceChildren(back.element);
    else leading.replaceChildren();
  };

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
      trailing: { type: "icon", content: ICONS.chevronRight },
    })),
  });
  listPane.append(list.element);

  const reset = createButton({ text: "Reset all settings", variant: "outlined" });
  reset.element.classList.add("settings-app__reset");
  listPane.append(reset.element);

  // One detail pane per category, built once, applied on every state change. Each is a
  // list: the group titles are its subheaders and every setting is a row whose trailing
  // slot carries its control (switch, radios or slider), so the row supplies the 48 dp
  // target, the text roles and the states.
  for (const category of CATEGORIES) {
    const detail = document.createElement("section");
    detail.className = "settings-app__detail";
    detail.hidden = true;
    const heading = document.createElement("h2");
    heading.className = "settings-app__detail-title mtrl-headline-small";
    heading.id = `settings-${category.id}-heading`;
    heading.textContent = category.title;
    detail.setAttribute("aria-labelledby", heading.id);
    detail.append(heading);

    const items: ListItem[] = [];
    for (const group of category.groups) {
      items.push({ kind: "subheader", headline: group.title });
      for (const setting of group.settings) {
        const control = buildControl(store, setting);
        controls.set(setting.key, control);
        items.push({
          id: setting.key,
          // A slider shows its own label above its track and takes the handle's name
          // from it, so its row adds no text of its own.
          headline: setting.kind === "slider" ? "" : setting.label,
          supportingText: setting.kind === "switch" ? setting.supportingText : undefined,
          trailing: { type: "control", content: control.element },
        });
      }
    }
    const detailList = createList({ ariaLabel: category.title, trackSelection: false, items });
    // Describe a control with its row's supporting text, as the list does for its own
    // action buttons: the text element's id is the list's.
    for (const group of category.groups) {
      for (const setting of group.settings) {
        if (setting.kind !== "switch" || !setting.supportingText) continue;
        const supporting = detailList.element.querySelector(`[data-id="${setting.key}"] .mtrl-list__supporting`);
        const focusable = controls.get(setting.key)?.focusable;
        if (supporting?.id && focusable) focusable.setAttribute("aria-describedby", supporting.id);
      }
    }
    detail.append(detailList.element);
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

  // An actionable snackbar does not close itself: the guidelines say so for the ones
  // with an action, and the default duration with an action is `indefinite` already. It
  // stays until Undo or its close button; `replace` keeps the "one at a time" rule.
  const snackbar = createSnackbar({
    message: "Settings reset",
    action: "Undo",
    dismissible: true,
    queueBehavior: "replace",
    onAction: () => {
      if (undoState) store.restore(undoState);
    },
  });

  const twoPane = window.matchMedia(TWO_PANE);
  const openCategory = (id: string, focusTitle: boolean): void => {
    current = id;
    last = id;
    for (const [key, detail] of details) detail.hidden = key !== id;
    // Selected state belongs to the list view of a two-pane layout; in the single pane the
    // detail replaces the list, so no row keeps a selection to come back to.
    if (twoPane.matches) {
      list.setSelection([id]); // one row at a time; selectItem would add
      bar.setTitle("Settings");
      showBack(false);
    } else {
      list.clearSelection();
      bar.setTitle(titleOf(id));
      showBack(true);
    }
    root.classList.add("settings-app--detail");
    // In the single pane the app bar's headline is the new screen's title; taking focus
    // there announces the change, and Back puts focus back on the row.
    if (focusTitle) bar.getHeadlineElement().focus();
  };
  const goBack = (): void => {
    if (twoPane.matches) return; // from 600 px both panes stay; there is no Back there
    const id = current;
    for (const detail of details.values()) detail.hidden = true;
    current = null;
    root.classList.remove("settings-app--detail");
    bar.setTitle("Settings");
    showBack(false);
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
      bar.setTitle(current ? titleOf(current) : "Settings");
      showBack(current !== null);
      return;
    }
    bar.setTitle("Settings");
    showBack(false);
    // No selection when the window widens: reopen the category the user was last in —
    // "Consistency is key" — rather than a placeholder or the first one.
    if (!current) openCategory(last ?? CATEGORIES[0]!.id, false);
    else list.setSelection([current]);
  };
  twoPane.addEventListener("change", applyLayout);
  if (twoPane.matches) openCategory(CATEGORIES[0]!.id, false);

  store.subscribe((state) => {
    for (const control of controls.values()) control.apply(state);
  });

  panes.append(listPane, detailPane);
  root.append(bar.element, panes);
  return root;
};
