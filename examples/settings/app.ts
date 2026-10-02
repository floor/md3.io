// The Settings app: a list of categories, a detail pane per category, and a reset
// dialog with an undo snackbar. Vanilla this case study; the other framework variants
// are the ports the owner's answer will decide how to declare.
import createButton from "material/components/button";
import createDialog from "material/components/dialog";
import createIconButton from "material/components/icon-button";
import createList from "material/components/list";
import createSnackbar from "material/components/snackbar";
import createTopAppBar from "material/components/top-app-bar";
import { type Control } from "./controls";
import { CATEGORIES, type Settings } from "./data";
import { buildDetails } from "./details";
import { ICONS } from "./icons";
import { createStore } from "./state";

// M3's size classes are read from the app's own box, not the window: the stylesheet's
// container queries draw the panes, and this observer is their JS twin, so the layout
// and the app's behaviour (the bar's title, Back, the selected row) switch together
// wherever the frame puts the app. The example frame pads the page by 24 px each side,
// so the first boundary, 600 px of the app, is a 648 px window (888 and 1248 later).
const SPLIT_AT = 600;

const titleOf = (id: string): string => CATEGORIES.find((category) => category.id === id)?.title ?? "Settings";

export interface SettingsApp {
  /** The app's root element, for the caller to mount. */
  element: HTMLElement;
  /** Disconnects the observer and the store, destroys the components and removes the element. */
  destroy: () => void;
}

export const createSettingsApp = (): SettingsApp => {
  const store = createStore();
  const controls = new Map<string, Control>();
  const rows = new Map<string, HTMLElement>();
  // The app's own state, one per mount: a second mount starts from the single-pane
  // layout and its own observer, never from the previous mount's pane mode.
  let twoPane = false;
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

  // One detail pane per category, built once, applied on every state change (details.ts).
  const { details, destroy: destroyDetails } = buildDetails(store, controls, detailPane);

  // The dialog is mounted in the app's own element (its documented `container`), so it
  // sits in the app's subtree: "Dark theme" then carries it along, and the scrim covers
  // the app rather than the page around it.
  const dialog = createDialog({
    container: root,
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

  const openCategory = (id: string, focusTitle: boolean): void => {
    current = id;
    last = id;
    for (const [key, detail] of details) detail.hidden = key !== id;
    // Selected state belongs to the list view of a two-pane layout; in the single pane the
    // detail replaces the list, so no row keeps a selection to come back to.
    if (twoPane) {
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
    if (twoPane) return; // with both panes there is no Back to take
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
    openCategory(event.value, !twoPane);
  });
  const applyLayout = (): void => {
    if (!twoPane) {
      list.clearSelection();
      bar.setTitle(current ? titleOf(current) : "Settings");
      showBack(current !== null);
      return;
    }
    bar.setTitle("Settings");
    showBack(false);
    // No selection when the panes become two: reopen the category the user was last in —
    // "Consistency is key" — rather than a placeholder or the first one.
    if (!current) openCategory(last ?? CATEGORIES[0]!.id, false);
    else list.setSelection([current]);
  };
  // The observer fires once on observe too, so a wide window opens its first category
  // from the same call that keeps the app in step on every later resize.
  const observer = new ResizeObserver(() => {
    const next = root.getBoundingClientRect().width >= SPLIT_AT;
    if (next === twoPane) return;
    twoPane = next;
    applyLayout();
  });
  observer.observe(root);

  // "Dark theme" acts on the app itself: on, the app carries the dark roles for its own
  // subtree — data-theme-mode belongs on the element that has data-theme (theming docs)
  // — and so it darkens while the page around it stays as it is. Off, both attributes
  // go and the app follows the page's appearance, as every other example does. The name
  // is the frame's own theme, so the app darkens within whatever theme is picked.
  const theme = (element: HTMLElement, dark: boolean): void => {
    if (!dark) {
      delete element.dataset.theme;
      delete element.dataset.themeMode;
      return;
    }
    element.dataset.theme = document.documentElement.dataset.theme ?? "baseline";
    element.dataset.themeMode = "dark";
  };
  const applyTheme = (state: Settings): void => {
    theme(root, state.darkTheme);
    // The snackbar is the app's too, but the library always appends it to the document
    // body (`open()` re-appends it there; there is no `container` option), so it cannot
    // sit in the app's subtree. The documented theme attributes work on any element, so
    // the app puts them on the snackbar's own element instead.
    theme(snackbar.element, state.darkTheme);
  };

  const unsubscribe = store.subscribe((state) => {
    applyTheme(state);
    for (const control of controls.values()) control.apply(state);
  });
  applyTheme(store.get());

  // Everything this mount built, in reverse: the observer and the store first, then the
  // components (the controls inside the detail rows, the rows' lists, the dialog, the
  // snackbar, the list, the button and the bar), then the element itself.
  const destroy = (): void => {
    observer.disconnect();
    unsubscribe();
    for (const control of controls.values()) control.destroy();
    destroyDetails();
    dialog.destroy();
    snackbar.destroy();
    list.destroy();
    reset.destroy();
    back.destroy();
    bar.destroy();
    root.remove();
  };

  panes.append(listPane, detailPane);
  root.append(bar.element, panes);
  return { element: root, destroy };
};
