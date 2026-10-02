// The settings detail panes: one per category, built once, applied on every state change.
// A detail is the category's title — a heading in the app's own markup carrying the
// library's headline-small type role — then per group the group's title (the library's
// title-small role) and the group's settings under it: a switch is a list row with the
// control in its trailing slot, the row supplying the 48 dp target, the text roles and
// the states. The switch is named by the app through its ariaLabel; the row's supporting
// text stays the row's — the list exposes no public handle on it (FLO-590). A slider is
// not a row: the trailing slot is content-sized and does not shrink, so a slider put
// there collapses to the width of its own label — it stands in a block of the pane's
// full width instead, where the component draws its label above a draggable track.
import createList, { type ListItem } from "material/components/list";
import { buildControl, type Control } from "./controls";
import { CATEGORIES } from "./data";
import type { Store } from "./state";

export interface DetailPanes {
  /** The pane per category id, hidden until its category is open. */
  details: Map<string, HTMLElement>;
  /** Destroys the rows' lists, for the app's destroy(). */
  destroy: () => void;
}

export const buildDetails = (
  store: Store,
  controls: Map<string, Control>,
  detailPane: HTMLElement,
): DetailPanes => {
  const details = new Map<string, HTMLElement>();
  const lists: ReturnType<typeof createList>[] = [];

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

    for (const group of category.groups) {
      const groupTitle = document.createElement("h3");
      groupTitle.className = "settings-app__group mtrl-title-small";
      groupTitle.textContent = group.title;
      detail.append(groupTitle);

      let rows: ListItem[] = [];
      // The rows up to here become one list; a slider breaks the run.
      const flush = (): void => {
        if (!rows.length) return;
        const list = createList({ ariaLabel: `${category.title}, ${group.title}`, trackSelection: false, items: rows });
        lists.push(list);
        detail.append(list.element);
        rows = [];
      };

      for (const setting of group.settings) {
        const control = buildControl(store, setting);
        controls.set(setting.key, control);
        if (setting.kind === "slider") {
          // A slider cannot be a list row (see the file comment): a block of its own.
          flush();
          const block = document.createElement("div");
          block.className = "settings-app__control";
          block.dataset.setting = setting.key;
          block.append(control.element);
          detail.append(block);
          continue;
        }
        rows.push({
          id: setting.key,
          headline: setting.label,
          supportingText: setting.supportingText,
          trailing: { type: "control", content: control.element },
        });
      }
      flush();
    }
    details.set(category.id, detail);
    detailPane.append(detail);
  }

  return {
    details,
    destroy: () => {
      for (const list of lists) list.destroy();
    },
  };
};
