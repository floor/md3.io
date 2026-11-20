// Web components: the elements themselves, no framework. The DOM is built with
// createElement/setAttribute/textContent — no HTML string is parsed anywhere.
import "material/elements/css";
import "material-addons/elements/css/avatar";
import { defineAll } from "material/elements";
import { defineAvatar } from "material-addons/elements";
import {
  ARCHIVE_LABEL, ATTACHMENTS_LABEL, BACK_LABEL, CHIPS_LABEL, CLEAR_LABEL, COMPOSE_HEADLINE, DELETE_LABEL, EMPTY_DETAIL,
  FOLDERS, LABELS, MENU_LABEL, RAIL_LABEL, REPLY_ALL_LABEL, ROWS_LABEL, SEARCH_PLACEHOLDER, SENT_TEXT, STAR_LABEL,
  archiveChecked, archiveOpen, anyArchiveable, archiveable, attachmentCountText, badgeFor, canSend, clearChecked, closeCompose,
  closeDrawer, deleteChecked, deleteOpen, emptyText, findMessage, focusHeading, focusList, focusRow, folderName, goBack,
  groupedMessages, icons, initialState, initialsOf, keepRowFocus, mailbox, openCompose, openDrawer, openMessage,
  replyAllToOpen, replyToOpen, selectLabel, selectionText, sendDraft, setFolder, setLabel, setQuery, toggleChecked, toggleStar,
  type FolderId, type MailState, type Message,
} from "./shared";

defineAll();
defineAvatar();

const s: MailState = initialState();
const messages = mailbox();
const app = document.getElementById("app")!;

const el = <T extends HTMLElement = HTMLElement>(tag: string, attrs: Record<string, string> = {}, text?: string): T => {
  const node = document.createElement(tag) as T;
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  if (text !== undefined) node.textContent = text;
  return node;
};

// The static skeleton.
const section = el("section", { class: "mail", "data-reading": "false" });
const rail = el<HTMLElement & { value: string }>("m-navigation-rail", { "aria-label": RAIL_LABEL, value: s.folder });
const drawer = el<HTMLElement & { value: string; open: boolean }>("m-drawer", {
  class: "mail__drawer", modal: "", headline: RAIL_LABEL, value: s.folder,
});
for (const f of FOLDERS) {
  const railItem = el("m-navigation-rail-item", {
    value: f.id, label: f.label, icon: f.icon, "selected-icon": f.activeIcon,
  });
  const drawerItem = el("m-drawer-item", {
    value: f.id, label: f.label, icon: f.icon, "selected-icon": f.activeIcon,
  });
  const badge = badgeFor(messages, f.id);
  if (badge) {
    railItem.setAttribute("badge", badge.badge);
    railItem.setAttribute("badge-label", badge.label);
    drawerItem.setAttribute("badge", badge.badge);
  }
  rail.append(railItem);
  drawer.append(drawerItem);
}
const main = el("div", { class: "mail__main" });
const listPane = el("div", { class: "mail__list-pane" });
const bar = el("m-top-app-bar", { class: "mail__bar", headline: folderName(s.folder), "no-scroll": "" });
const menuBtn = el("m-icon-button", { slot: "leading", class: "mail__menu", icon: icons.menu, "aria-label": MENU_LABEL });
bar.append(menuBtn);
const top = el("header", { class: "mail__top" });
const search = el("m-search", { placeholder: SEARCH_PLACEHOLDER, "no-expand-on-focus": "", "full-width": "" });
const chips = el<HTMLElement & { value: string | null }>("m-chips", { "aria-label": CHIPS_LABEL, selection: "single" });
for (const l of LABELS) chips.append(el("m-chip", { value: l.id, label: l.label }));
top.append(search, chips);
const selection = el("div", { class: "mail__selection" });
const rows = el("ul", { class: "mail__rows", "aria-label": ROWS_LABEL, tabindex: "-1" });
listPane.append(bar, top, selection, rows);
const detailPane = el("div", { class: "mail__detail-pane" });
main.append(listPane, detailPane);
const fab = el("m-extended-fab", { class: "mail__compose", icon: icons.edit }, "Compose");
const dialog = el<HTMLElement & { show(): void; close(): void }>("m-dialog", { class: "mail-compose", headline: COMPOSE_HEADLINE });
const fields = el("div", { class: "mail-compose__fields" });
const to = el<HTMLElement & { value: string }>("m-text-field", { label: "To", variant: "outlined" });
const subject = el<HTMLElement & { value: string }>("m-text-field", { label: "Subject", variant: "outlined" });
const body = el<HTMLElement & { value: string }>("m-text-field", { label: "Message", variant: "outlined", type: "multiline" });
fields.append(to, subject, body);
const cancel = el("m-button", { slot: "actions", variant: "text", class: "mail-compose__cancel" }, "Cancel");
const send = el("m-button", { slot: "actions", class: "mail-compose__send" }, "Send");
dialog.append(fields, cancel, send);
const snackbar = el<HTMLElement & { show(): void }>("m-snackbar", { message: SENT_TEXT });
section.append(rail, drawer, main, fab, dialog, snackbar);
app.append(section);

function row(m: Message): HTMLLIElement {
  const li = el<HTMLLIElement>("li", { class: "mail-row" });
  li.dataset.id = m.id;
  li.toggleAttribute("data-unread", m.unread);
  li.toggleAttribute("data-open", s.open === m.id);

  const check = el("m-checkbox", { class: "mail-row__check", "aria-label": selectLabel(m) });
  check.dataset.id = m.id;
  check.toggleAttribute("checked", s.checked.includes(m.id));

  const avatar = el("m-avatar", {
    class: "mail-row__avatar", variant: "text", size: "medium", text: initialsOf(m.from), decorative: "",
  });

  const open = el<HTMLButtonElement>("button", { type: "button", class: "mail-row__open", "aria-pressed": String(s.open === m.id) });
  open.dataset.id = m.id;
  open.append(
    el("span", { class: "mail-row__sender mtrl-label-large" }, m.from),
    el("span", { class: "mail-row__subject mtrl-body-medium" }, m.subject),
    ...(m.attachments?.length
      ? [el("span", { class: "mail-row__attachments mtrl-label-small" }, attachmentCountText(m.attachments))]
      : []),
    el("span", { class: "mail-row__snippet mtrl-body-small" }, m.snippet),
    el("span", { class: "mail-row__time mtrl-body-small" }, m.time),
  );

  const star = el("m-icon-button", {
    class: "mail-row__star", toggle: "", icon: icons.star, "selected-icon": icons.starFill, "aria-label": STAR_LABEL,
  });
  star.dataset.id = m.id;
  star.toggleAttribute("selected", m.starred);

  li.append(check, avatar, open, star);
  return li;
}

function detail(m: Message): HTMLElement {
  const article = el("article", { class: "mail-message" });
  const head = el("header", { class: "mail-message__head" });
  head.append(
    el("m-icon-button", { class: "mail-message__back", icon: icons.back, "aria-label": BACK_LABEL }),
    el("h2", { class: "mail-message__subject mtrl-title-large", tabindex: "-1" }, m.subject),
  );
  const sender = el("div", { class: "mail-message__sender" });
  const from = el("div", { class: "mail-message__from" });
  from.append(
    el("p", { class: "mail-message__meta mtrl-title-small" }, `${m.from} · ${m.address}`),
    ...(m.to ? [el("p", { class: "mail-message__to mtrl-body-small" }, `To ${m.to}`)] : []),
    ...(m.cc?.length ? [el("p", { class: "mail-message__cc mtrl-body-small" }, `Cc ${m.cc.join(", ")}`)] : []),
    el("p", { class: "mail-message__date mtrl-body-small" }, m.date),
  );
  sender.append(
    el("m-avatar", { class: "mail-message__avatar", variant: "text", size: "medium", text: initialsOf(m.from), decorative: "" }),
    from,
  );
  const text = el("div", { class: "mail-message__body mtrl-body-medium" });
  for (const p of m.body) text.append(el("p", {}, p));
  const attachments = m.attachments?.length
    ? el("ul", { class: "mail-message__attachments", "aria-label": ATTACHMENTS_LABEL })
    : null;
  if (attachments && m.attachments) {
    for (const file of m.attachments) attachments.append(el("li", { class: "mail-message__attachment mtrl-label-medium" }, file));
  }
  const actions = el("footer", { class: "mail-message__actions" });
  actions.append(
    el("m-button", { variant: "outlined", icon: icons.reply, class: "mail-message__reply" }, "Reply"),
    el("m-button", { variant: "outlined", icon: icons.replyAll, class: "mail-message__reply-all" }, REPLY_ALL_LABEL),
    ...(archiveable(m)
      ? [el("m-button", { variant: "outlined", icon: icons.archive, class: "mail-message__archive" }, ARCHIVE_LABEL)]
      : []),
    el("m-button", { variant: "outlined", icon: icons.delete, class: "mail-message__delete" }, DELETE_LABEL),
  );
  article.append(head, sender, text, ...(attachments ? [attachments] : []), actions);
  return article;
}

const syncDraft = (): void => {
  to.value = s.draft.to;
  subject.value = s.draft.subject;
  body.value = s.draft.message;
  send.toggleAttribute("disabled", !canSend(s.draft));
};

// The dynamic regions, rebuilt from the state on every change. keepRowFocus puts
// focus back on a row control the rebuild replaced.
function update(): void {
  keepRowFocus(() => {
    section.dataset.reading = String(s.reading);
    bar.setAttribute("headline", folderName(s.folder));
    if (rail.value !== s.folder) rail.value = s.folder;
    if (drawer.value !== s.folder) drawer.value = s.folder;
    drawer.toggleAttribute("open", s.drawer);
    for (const f of FOLDERS) {
      const railItem = rail.querySelector(`m-navigation-rail-item[value="${f.id}"]`)!;
      const drawerItem = drawer.querySelector(`m-drawer-item[value="${f.id}"]`)!;
      const badge = badgeFor(messages, f.id);
      if (badge) {
        railItem.setAttribute("badge", badge.badge);
        railItem.setAttribute("badge-label", badge.label);
        drawerItem.setAttribute("badge", badge.badge);
      } else {
        railItem.removeAttribute("badge");
        railItem.removeAttribute("badge-label");
        drawerItem.removeAttribute("badge");
      }
    }
    selection.replaceChildren();
    if (s.checked.length) {
      selection.append(
        el("m-icon-button", { class: "mail__clear", icon: icons.close, "aria-label": CLEAR_LABEL }),
        el("span", { class: "mail__selection-count mtrl-label-large" }, selectionText(s.checked.length)),
        // Archive only where it can act: the selection holds an unarchived inbox message.
        ...(anyArchiveable(messages, s.checked)
          ? [el("m-icon-button", { class: "mail__archive", icon: icons.archive, "aria-label": ARCHIVE_LABEL })]
          : []),
        el("m-icon-button", { class: "mail__delete", icon: icons.delete, "aria-label": DELETE_LABEL }),
      );
    }
    const groups = groupedMessages(messages, s);
    rows.replaceChildren(
      ...(groups.length
        ? groups.flatMap((g) => [el("li", { class: "mail__day mtrl-label-medium" }, g.label), ...g.messages.map(row)])
        : [el("li", { class: "mail__empty mtrl-body-medium" }, emptyText(s))]),
    );
    const open = findMessage(messages, s.open);
    detailPane.replaceChildren(open ? detail(open) : el("div", { class: "mail__placeholder mtrl-body-medium" }, EMPTY_DETAIL));
  });
}

menuBtn.addEventListener("click", () => {
  openDrawer(s);
  drawer.toggleAttribute("open", true);
});
drawer.addEventListener("close", () => closeDrawer(s));
drawer.addEventListener("change", (e) => {
  setFolder(s, (e as CustomEvent<{ value: string }>).detail.value as FolderId);
  update();
});
rail.addEventListener("change", (e) => {
  setFolder(s, (e as CustomEvent<{ value: string }>).detail.value as FolderId);
  update();
});
search.addEventListener("input", (e) => {
  setQuery(s, messages, (e as CustomEvent<{ value: string }>).detail.value);
  update();
});
chips.addEventListener("change", (e) => {
  setLabel(s, messages, (e as CustomEvent<{ value: string | null }>).detail.value ?? null);
  update();
});

// Row interactions, delegated: the rows are rebuilt on every change.
rows.addEventListener("click", (e) => {
  const opener = (e.target as HTMLElement).closest<HTMLElement>(".mail-row__open");
  if (opener?.dataset.id) {
    openMessage(s, messages, opener.dataset.id);
    update();
    focusHeading();
  }
});
rows.addEventListener("change", (e) => {
  const check = (e.target as HTMLElement).closest<HTMLElement>("m-checkbox.mail-row__check");
  if (check?.dataset.id) {
    toggleChecked(s, check.dataset.id);
    update();
    return;
  }
  const star = (e.target as HTMLElement).closest<HTMLElement>("m-icon-button.mail-row__star");
  if (star?.dataset.id) {
    toggleStar(s, messages, star.dataset.id);
    update();
  }
});

selection.addEventListener("click", (e) => {
  const hit = (e.target as HTMLElement).closest("m-icon-button");
  if (!hit) return;
  if (hit.classList.contains("mail__clear")) clearChecked(s);
  else if (hit.classList.contains("mail__archive")) archiveChecked(s, messages);
  else if (hit.classList.contains("mail__delete")) deleteChecked(s, messages);
  update();
});

detailPane.addEventListener("click", (e) => {
  const hit = (e.target as HTMLElement).closest("m-icon-button.mail-message__back, m-button");
  if (!hit) return;
  if (hit.classList.contains("mail-message__back")) {
    const id = s.open;
    goBack(s);
    update();
    if (id) focusRow(id);
    return;
  }
  if (hit.classList.contains("mail-message__reply")) {
    replyToOpen(s, messages);
    syncDraft();
    dialog.show();
    return;
  }
  if (hit.classList.contains("mail-message__reply-all")) {
    replyAllToOpen(s, messages);
    syncDraft();
    dialog.show();
    return;
  }
  if (hit.classList.contains("mail-message__archive")) archiveOpen(s, messages);
  else if (hit.classList.contains("mail-message__delete")) deleteOpen(s, messages);
  update();
  focusList();
});

fab.addEventListener("click", () => {
  openCompose(s);
  syncDraft();
  dialog.show();
});
cancel.addEventListener("click", () => {
  closeCompose(s);
  dialog.close();
});
send.addEventListener("click", () => {
  sendDraft(s, messages);
  syncDraft();
  dialog.close();
  update();
  snackbar.show();
});
dialog.addEventListener("close", () => closeCompose(s));
for (const [field, key] of [[to, "to"], [subject, "subject"], [body, "message"]] as const) {
  field.addEventListener("input", (e) => {
    s.draft[key] = (e as CustomEvent<{ value: string }>).detail.value;
    send.toggleAttribute("disabled", !canSend(s.draft));
  });
}

update();
