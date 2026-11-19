// Vanilla: the create* factories the elements are built on. The dialog and the snackbar
// are the elements (they live in the top layer), created with plain DOM.
import createNavigationRail from "material/components/navigation-rail";
import createSearch from "material/components/search";
import createChips from "material/components/chips";
import createCheckbox from "material/components/checkbox";
import createIconButton from "material/components/icon-button";
import createButton from "material/components/button";
import createExtendedFab from "material/components/extended-fab";
import createTextField from "material/components/text-field";
import "material/elements/css/dialog";
import "material/elements/css/snackbar";
import { defineDialog, defineSnackbar } from "material/elements";
import {
  ARCHIVE_LABEL, BACK_LABEL, CHIPS_LABEL, CLEAR_LABEL, COMPOSE_HEADLINE, DELETE_LABEL, EMPTY_DETAIL,
  FOLDERS, LABELS, RAIL_LABEL, ROWS_LABEL, SEARCH_PLACEHOLDER, SENT_TEXT, STAR_LABEL,
  archiveChecked, archiveOpen, anyArchiveable, archiveable, badgeFor, canSend, clearChecked, closeCompose, deleteChecked, deleteOpen,
  emptyText, findMessage, focusHeading, focusList, focusRow, goBack, icons, initialState, keepRowFocus,
  mailbox, openCompose, openMessage, replyToOpen, selectLabel, selectionText, sendDraft, setFolder,
  setLabel, setQuery, toggleChecked, toggleStar, visibleMessages,
  type FolderId, type MailState, type Message,
} from "./shared";

defineDialog();
defineSnackbar();

const s: MailState = initialState();
const messages = mailbox();
const app = document.getElementById("app")!;

const section = Object.assign(document.createElement("section"), { className: "mail" });

// The rail, with a badge where it makes sense.
const rail = createNavigationRail({
  ariaLabel: RAIL_LABEL,
  items: FOLDERS.map((f) => {
    const badge = badgeFor(messages, f.id);
    return {
      id: f.id, label: f.label, icon: f.icon, activeIcon: f.activeIcon,
      active: f.id === s.folder,
      ...(badge ? { badge: badge.badge, badgeLabel: badge.label } : {}),
    };
  }),
});
rail.on("select", ({ id }: { id: string }) => {
  setFolder(s, id as FolderId);
  update();
});

const main = Object.assign(document.createElement("div"), { className: "mail__main" });
const listPane = Object.assign(document.createElement("div"), { className: "mail__list-pane" });
const detailPane = Object.assign(document.createElement("div"), { className: "mail__detail-pane" });

const top = Object.assign(document.createElement("header"), { className: "mail__top" });
const search = createSearch({ placeholder: SEARCH_PLACEHOLDER, expandOnFocus: false, fullWidth: true });
search.on("input", ({ value }: { value: string }) => {
  setQuery(s, messages, value);
  update();
});
const chips = createChips({
  multiSelect: false,
  chips: LABELS.map((l) => ({ label: l.label, value: l.id })),
});
chips.element.setAttribute("aria-label", CHIPS_LABEL);
chips.on("change", ({ value }: { value: string | string[] | null }) => {
  setLabel(s, messages, Array.isArray(value) ? (value[0] ?? null) : value);
  update();
});
top.append(search.element, chips.element);

const selection = Object.assign(document.createElement("div"), { className: "mail__selection" });
const rows = Object.assign(document.createElement("ul"), { className: "mail__rows" });
rows.setAttribute("aria-label", ROWS_LABEL);
rows.tabIndex = -1;
listPane.append(top, selection, rows);

// The compose dialog (the element, in the top layer) with factory fields and buttons.
const dialog = document.createElement("m-dialog") as HTMLElement & { show(): void; close(): void };
dialog.setAttribute("class", "mail-compose");
dialog.setAttribute("headline", COMPOSE_HEADLINE);
const fields = Object.assign(document.createElement("div"), { className: "mail-compose__fields" });
const to = createTextField({ label: "To", variant: "outlined" });
const subject = createTextField({ label: "Subject", variant: "outlined" });
const body = createTextField({ label: "Message", variant: "outlined", type: "multiline" });
fields.append(to.element, subject.element, body.element);
const cancel = createButton({ text: "Cancel", variant: "text" });
const send = createButton({ text: "Send" });
cancel.element.setAttribute("slot", "actions");
send.element.setAttribute("slot", "actions");
dialog.append(fields, cancel.element, send.element);

const snackbar = document.createElement("m-snackbar") as HTMLElement & { show(): void };
snackbar.setAttribute("message", SENT_TEXT);

const fab = createExtendedFab({ icon: icons.edit, text: "Compose", class: "mail__compose" });

const syncDraft = (): void => {
  to.setValue(s.draft.to);
  subject.setValue(s.draft.subject);
  body.setValue(s.draft.message);
  canSend(s.draft) ? send.enable() : send.disable();
};
to.on("input", ({ value }: { value: string }) => { s.draft.to = value; canSend(s.draft) ? send.enable() : send.disable(); });
subject.on("input", ({ value }: { value: string }) => { s.draft.subject = value; });
body.on("input", ({ value }: { value: string }) => { s.draft.message = value; canSend(s.draft) ? send.enable() : send.disable(); });

fab.on("click", () => {
  openCompose(s);
  syncDraft();
  dialog.show();
});
cancel.on("click", () => {
  closeCompose(s);
  dialog.close();
});
send.on("click", () => {
  sendDraft(s, messages);
  syncDraft();
  dialog.close();
  update();
  snackbar.show();
});
dialog.addEventListener("close", () => closeCompose(s));

const span = (className: string, text: string): HTMLSpanElement =>
  Object.assign(document.createElement("span"), { className, textContent: text });

// The dynamic regions, rebuilt from the state on every change. keepRowFocus puts
// focus back on a row control the rebuild replaced.
function update(): void {
  keepRowFocus(() => {
    section.dataset.reading = String(s.reading);
    for (const f of FOLDERS) {
      const badge = badgeFor(messages, f.id);
      rail.setBadge(f.id, badge ? badge.badge : (null as unknown as string), badge ? badge.label : undefined);
    }

    selection.replaceChildren();
    if (s.checked.length) {
      const clear = createIconButton({ icon: icons.close, ariaLabel: CLEAR_LABEL });
      clear.on("click", () => { clearChecked(s); update(); });
      selection.append(clear.element, span("mail__selection-count", selectionText(s.checked.length)));
      // Archive only where it can act: the selection holds an unarchived inbox message.
      if (anyArchiveable(messages, s.checked)) {
        const archive = createIconButton({ icon: icons.archive, ariaLabel: ARCHIVE_LABEL });
        archive.on("click", () => { archiveChecked(s, messages); update(); });
        selection.append(archive.element);
      }
      const remove = createIconButton({ icon: icons.delete, ariaLabel: DELETE_LABEL });
      remove.on("click", () => { deleteChecked(s, messages); update(); });
      selection.append(remove.element);
    }

    rows.replaceChildren();
    const visible = visibleMessages(messages, s);
    if (!visible.length) {
      const empty = Object.assign(document.createElement("li"), { className: "mail__empty", textContent: emptyText(s) });
      rows.append(empty);
    }
    for (const m of visible) rows.append(row(m));

    detailPane.replaceChildren();
    const open = findMessage(messages, s.open);
    if (!open) {
      detailPane.append(Object.assign(document.createElement("div"), { className: "mail__placeholder", textContent: EMPTY_DETAIL }));
    } else {
      detailPane.append(detail(open));
    }
  });
}

function row(m: Message): HTMLLIElement {
  const li = Object.assign(document.createElement("li"), { className: "mail-row" });
  li.dataset.id = m.id;
  li.toggleAttribute("data-unread", m.unread);
  li.toggleAttribute("data-open", s.open === m.id);

  const check = createCheckbox({ ariaLabel: selectLabel(m), checked: s.checked.includes(m.id) });
  check.element.classList.add("mail-row__check");
  // The element marks the check icon aria-hidden (syncSlottedIcon); the factory leaves that to the app.
  check.element.querySelector(".mtrl-checkbox__icon")?.setAttribute("aria-hidden", "true");
  check.on("change", () => { toggleChecked(s, m.id); update(); });

  const open = Object.assign(document.createElement("button"), { className: "mail-row__open", type: "button" });
  open.setAttribute("aria-pressed", String(s.open === m.id));
  open.append(
    span("mail-row__sender", m.from),
    span("mail-row__subject", m.subject),
    span("mail-row__snippet", m.snippet),
    span("mail-row__time", m.time),
  );
  open.addEventListener("click", () => { openMessage(s, messages, m.id); update(); focusHeading(); });

  const star = createIconButton({
    icon: icons.star, selectedIcon: icons.starFill, toggle: true, selected: m.starred, ariaLabel: STAR_LABEL,
  });
  star.element.classList.add("mail-row__star");
  star.on("change", () => { toggleStar(s, messages, m.id); update(); });

  li.append(check.element, open, star.element);
  return li;
}

function detail(m: Message): HTMLElement {
  const article = Object.assign(document.createElement("article"), { className: "mail-message" });
  const head = Object.assign(document.createElement("header"), { className: "mail-message__head" });
  const back = createIconButton({ icon: icons.back, ariaLabel: BACK_LABEL });
  back.element.classList.add("mail-message__back");
  back.on("click", () => {
    const id = s.open;
    goBack(s);
    update();
    if (id) focusRow(id);
  });
  const subject = Object.assign(document.createElement("h2"), { className: "mail-message__subject", textContent: m.subject });
  subject.tabIndex = -1;
  head.append(back.element, subject);

  const meta = Object.assign(document.createElement("p"), { className: "mail-message__meta", textContent: `${m.from} · ${m.address}` });
  const date = Object.assign(document.createElement("p"), { className: "mail-message__date", textContent: m.date });
  const text = Object.assign(document.createElement("div"), { className: "mail-message__body" });
  for (const p of m.body) text.append(Object.assign(document.createElement("p"), { textContent: p }));

  const actions = Object.assign(document.createElement("footer"), { className: "mail-message__actions" });
  const reply = createButton({ text: "Reply", variant: "outlined", icon: icons.reply });
  reply.on("click", () => { replyToOpen(s, messages); syncDraft(); dialog.show(); });
  actions.append(reply.element);
  if (archiveable(m)) {
    const archive = createButton({ text: ARCHIVE_LABEL, variant: "outlined", icon: icons.archive });
    archive.on("click", () => { archiveOpen(s, messages); update(); focusList(); });
    actions.append(archive.element);
  }
  const remove = createButton({ text: DELETE_LABEL, variant: "outlined", icon: icons.delete });
  remove.on("click", () => { deleteOpen(s, messages); update(); focusList(); });
  actions.append(remove.element);

  article.append(
    head, meta,
    ...(m.to ? [Object.assign(document.createElement("p"), { className: "mail-message__to", textContent: `To ${m.to}` })] : []),
    date, text, actions,
  );
  return article;
}

main.append(listPane, detailPane);
section.append(rail.element, main, fab.element, dialog, snackbar);
app.append(section);
update();
