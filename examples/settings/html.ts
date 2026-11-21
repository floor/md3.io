// Web components: text is assigned through attributes/properties, never an HTML sink.
import "material/elements/css";
import "material-addons/elements/css/avatar";
import { defineAll } from "material/elements";
import { defineAvatar } from "material-addons/elements/avatar";
import { DEFAULTS, ICONS, mountRowControls, announces, dialog, groups, isNetwork, reduce, wifiRow, type Action, type Row } from "./shared";
defineAll();
defineAvatar();
let s = { ...DEFAULTS };
function element<K extends keyof HTMLElementTagNameMap>(tag: K, attributes: Record<string, string | boolean | undefined> = {}): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) if (value !== undefined && value !== false) node.setAttribute(key, value === true ? "" : value);
  return node;
}
const div = (className: string) => element("div", { class: className });
const paragraph = (text: string) => Object.assign(document.createElement("p"), { textContent: text });
const shell = element("section", { class: "settings" });
const bar = element("m-top-app-bar", { headline: "Settings", type: "small", "no-scroll": true });
const back = element("m-icon-button", { slot: "leading", icon: ICONS.back, "aria-label": "Back" });
back.addEventListener("click", () => send({ type: "back" }));
const searchAction = element("m-icon-button", { slot: "trailing", icon: ICONS.search, "aria-label": "Search settings" });
searchAction.addEventListener("click", () => send({ type: "search" }));
const more = element("m-icon-button", { class: "settings__mobile", slot: "trailing", icon: ICONS.more, "aria-label": "Device information" });
more.addEventListener("click", () => send({ type: "row", id: "version" }));
bar.append(searchAction, more);
const content = div("settings__content");
const searchBox = div("settings__search");
const search = element("m-text-field", { label: "Search settings", type: "search" });
search.addEventListener("input", e => send({ type: "query", value: (e as CustomEvent<{ value: string }>).detail.value }));
searchBox.append(search);
const body = div("settings__grid");
content.append(body);
const modal = element("m-dialog");
modal.addEventListener("close", () => { if (s.dialog) send({ type: "close" }); });
const snackbar = element("m-snackbar", { message: "", duration: "short", dismissible: true });
shell.append(bar, content, modal, snackbar);
document.getElementById("app")!.append(shell);

function list(label: string | undefined, items: Record<string, string | boolean | undefined>[], activate?: (id: string) => void) {
  const node = element("m-list", { selection: activate ? "single" : "none", "aria-label": label });
  for (const item of items) node.append(element("m-list-item", item));
  if (activate) node.addEventListener("activate", e => { node.value = null; activate((e as CustomEvent<{ value: string }>).detail.value); });
  return node;
}
function row(r: Row): HTMLDivElement {
  const wrapper = div("");
  const line = div(`settings__row${r.toggle ? " settings__row--toggle" : r.account ? " settings__row--account" : ""}`);
  if (r.toggle) line.dataset.checked = String(s[r.toggle]);
  if (r.account) line.append(element("m-avatar", { variant: "text", size: "medium", text: "MV", decorative: true }));
  line.append(list(undefined, [{ value: r.id, headline: r.label, "supporting-text": r.supporting, "leading-icon": r.icon || undefined, "trailing-icon": r.toggle ? undefined : ICONS.chevron, disabled: r.disabled }], () => send(r.toggle ? { type: "toggle", key: r.toggle, checked: !s[r.toggle] } : { type: "row", id: r.id })));
  if (r.toggle) {
    const control = element("m-switch", { "aria-label": r.label, checked: s[r.toggle], disabled: r.disabled });
    control.addEventListener("change", e => send({ type: "toggle", key: r.toggle!, checked: (e as CustomEvent<{ checked: boolean }>).detail.checked }));
    line.querySelector("m-list-item")!.append(control);
  }
  wrapper.append(line);
  if (r.storage) {
    const usage = div("settings__storage");
    usage.append(element("m-progress", { variant: "linear", value: "38", max: "128", "aria-label": "Storage used" }));
    wrapper.append(usage);
  }
  return wrapper;
}
function renderBody() {
  body.replaceChildren();
  body.className = s.screen === "home" ? "settings__grid" : "settings__wifi";
  if (s.screen === "home") {
    for (const group of groups(s)) {
      const section = element("section", { class: "settings__group", "aria-label": group.title });
      section.append(list(undefined, [{ kind: "subheader", headline: group.title }]), ...group.rows.map(row));
      body.append(section);
    }
    if (!groups(s).length) body.append(paragraph("No settings found."));
  } else {
    body.append(row(wifiRow(s)));
    if (s.wifi && !s.airplane) body.append(list("Nearby networks", [
      { kind: "subheader", headline: "Nearby networks" },
      ...s.networks.map(n => ({ value: `network:${n.name}`, headline: n.name, "supporting-text": s.connected === n.name ? "Connected" : n.secure ? "Saved · Secured" : "Open network", "leading-icon": ICONS.wifi, "trailing-icon": s.connected === n.name ? ICONS.check : n.secure ? ICONS.lock : ICONS.chevron })),
      { value: "add-network", headline: "Add network", "supporting-text": "Connect to a hidden or new network", "leading-icon": ICONS.add, "trailing-icon": ICONS.chevron },
    ], id => send({ type: "row", id })));
    else body.append(paragraph("Turn on Wi-Fi to see nearby networks."));
  }
}
let connect: ReturnType<typeof element<"m-button">> | undefined;
function renderDialog() {
  if (!s.dialog) { modal.open = false; return; }
  const details = dialog(s);
  modal.setAttribute("headline", details.title);
  modal.replaceChildren(paragraph(details.text));
  if (s.dialog === "add-network") {
    const fields = div("settings__fields");
    for (const [label, type, action] of [["Network name", "text", "name"], ["Password (optional)", "password", "password"]] as const) {
      const input = element("m-text-field", { label, type });
      input.addEventListener("input", e => send({ type: action, value: (e as CustomEvent<{ value: string }>).detail.value }));
      fields.append(input);
    }
    modal.append(fields);
  }
  const actions = div("settings__actions");
  actions.slot = "actions";
  const cancel = element("m-button", { variant: "text" });
  cancel.textContent = isNetwork(s) || s.dialog === "add-network" ? "Cancel" : "Done";
  cancel.addEventListener("click", () => send({ type: "close" }));
  actions.append(cancel);
  if (isNetwork(s) || s.dialog === "add-network") {
    connect = element("m-button", { disabled: s.dialog === "add-network" && !s.draftName.trim() });
    connect.textContent = "Connect";
    connect.addEventListener("click", () => send({ type: s.dialog === "add-network" ? "add" : "connect" }));
    actions.append(connect);
  }
  modal.append(actions);
  modal.open = true;
}
function send(a: Action) {
  const before = s;
  s = reduce(s, a);
  if (a.type === "name" || a.type === "password") { if (connect) connect.disabled = !s.draftName.trim(); return; }
  if (a.type === "query") { renderBody(); return; }
  if (before.screen !== s.screen) {
    bar.setAttribute("headline", s.screen === "wifi" ? "Wi-Fi" : "Settings");
    if (s.screen === "wifi") bar.prepend(back); else back.remove();
  }
  if (s.searching) { if (!searchBox.isConnected) content.prepend(searchBox); } else searchBox.remove();
  search.value = s.query;
  renderBody();
  if (before.dialog !== s.dialog) renderDialog();
  if (announces(a)) { snackbar.component?.setDuration("short"); snackbar.setAttribute("message", s.notice); snackbar.show(); }
}
renderBody();
mountRowControls();
