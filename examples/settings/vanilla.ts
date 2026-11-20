// Vanilla: Material's factories, with their lifecycle cleaned up when rows change.
import createButton from "material/components/button";
import createDialog from "material/components/dialog";
import createIconButton from "material/components/icon-button";
import createList, { type ListItem } from "material/components/list";
import createProgress from "material/components/progress";
import createSnackbar from "material/components/snackbar";
import createSwitch from "material/components/switch";
import createTextField from "material/components/text-field";
import createTopAppBar from "material/components/top-app-bar";
import { createAvatar } from "material-addons/components/avatar";
import { DEFAULTS, ICONS, mountRowControls, announces, dialog, groups, isNetwork, reduce, wifiRow, type Action, type Row } from "./shared";
let s = { ...DEFAULTS };
const div = (className: string) => Object.assign(document.createElement("div"), { className });
const paragraph = (text: string) => Object.assign(document.createElement("p"), { textContent: text });
const shell = Object.assign(document.createElement("section"), { className: "settings" });
const bar = createTopAppBar({ title: "Settings", type: "small", scrollable: false });
const back = createIconButton({ icon: ICONS.back, ariaLabel: "Back" });
back.on("click", () => send({ type: "back" }));
const searchAction = createIconButton({ icon: ICONS.search, ariaLabel: "Search settings" });
searchAction.on("click", () => send({ type: "search" }));
const more = createIconButton({ icon: ICONS.more, ariaLabel: "Device information", class: "settings__mobile" });
more.on("click", () => send({ type: "row", id: "version" }));
bar.addTrailingElement(searchAction.element).addTrailingElement(more.element);
const content = div("settings__content");
const searchBox = div("settings__search");
const search = createTextField({ label: "Search settings", type: "search" });
search.on("input", e => send({ type: "query", value: e.value }));
searchBox.append(search.element);
const body = div("settings__grid");
content.append(body);
const modal = createDialog({ title: " ", content: " ", layer: "top", container: shell, buttons: [{ text: "Done", onClick: () => send({ type: "close" }) }] });
modal.on("close", () => { if (s.dialog) send({ type: "close" }); });
const snackbar = createSnackbar({ message: "Airplane mode off", duration: "short", dismissible: true, layer: "top" });
shell.append(bar.element, content, modal.element, snackbar.element);
document.getElementById("app")!.append(shell);
let bodyControls: { destroy(): void }[] = [];
function list(label: string | undefined, items: ListItem[], activate?: (id: string) => void, controlRow = false) {
  const control = createList({ ariaLabel: label, items, trackSelection: !!activate && !controlRow });
  bodyControls.push(control);
  if (activate && controlRow) control.element.addEventListener("click", () => {
    if (!items[0]?.disabled) activate(String(items[0]?.id));
  });
  else if (activate) control.on("select", e => { e.preventDefault(); activate(String(e.item.id)); });
  return control.element;
}
function row(r: Row): HTMLDivElement {
  const wrapper = div("");
  const line = div(`settings__row${r.toggle ? " settings__row--toggle" : r.account ? " settings__row--account" : ""}`);
  if (r.account) {
    const avatar = createAvatar({ variant: "text", size: "medium", text: "MV", decorative: true });
    bodyControls.push(avatar);
    line.append(avatar.element);
  }
  let control: ReturnType<typeof createSwitch> | undefined;
  if (r.toggle) {
    control = createSwitch({ ariaLabel: r.label, checked: s[r.toggle], disabled: r.disabled });
    control.on("change", e => send({ type: "toggle", key: r.toggle!, checked: e.checked }));
    bodyControls.push(control);
  }
  line.append(list(undefined, [{
    id: r.id, headline: r.label, supportingText: r.supporting,
    leading: r.icon ? { type: "icon", content: r.icon } : undefined,
    trailing: control ? { type: "control", content: control.element } : { type: "icon", content: ICONS.chevron },
    disabled: r.disabled,
  }], () => send(r.toggle ? { type: "toggle", key: r.toggle, checked: !s[r.toggle] } : { type: "row", id: r.id }), !!r.toggle));
  wrapper.append(line);
  if (r.storage) {
    const usage = div("settings__storage");
    const progress = createProgress({ variant: "linear", value: 38, max: 128, ariaLabel: "Storage used" });
    bodyControls.push(progress);
    usage.append(progress.element);
    wrapper.append(usage);
  }
  return wrapper;
}
function renderBody() {
  for (const control of bodyControls) control.destroy();
  bodyControls = [];
  body.replaceChildren();
  body.className = s.screen === "home" ? "settings__grid" : "settings__wifi";
  if (s.screen === "home") {
    for (const group of groups(s)) {
      const section = Object.assign(document.createElement("section"), { className: "settings__group" });
      section.setAttribute("aria-label", group.title);
      section.append(list(undefined, [{ kind: "subheader", headline: group.title }]), ...group.rows.map(row));
      body.append(section);
    }
    if (!groups(s).length) body.append(paragraph("No settings found."));
  } else {
    body.append(row(wifiRow(s)));
    if (s.wifi && !s.airplane) body.append(list("Nearby networks", [
      { kind: "subheader", headline: "Nearby networks" },
      ...s.networks.map(n => ({ id: `network:${n.name}`, headline: n.name, supportingText: s.connected === n.name ? "Connected" : n.secure ? "Saved · Secured" : "Open network", leading: { type: "icon" as const, content: ICONS.wifi }, trailing: { type: "icon" as const, content: s.connected === n.name ? ICONS.check : n.secure ? ICONS.lock : ICONS.chevron } })),
      { id: "add-network", headline: "Add network", supportingText: "Connect to a hidden or new network", leading: { type: "icon", content: ICONS.add }, trailing: { type: "icon", content: ICONS.chevron } },
    ], id => send({ type: "row", id })));
    else body.append(paragraph("Turn on Wi-Fi to see nearby networks."));
  }
}
let dialogControls: { destroy(): void }[] = [];
let connect: ReturnType<typeof createButton> | undefined;
function renderDialog() {
  if (!s.dialog) { modal.close(); return; }
  for (const control of dialogControls) control.destroy();
  dialogControls = [];
  const details = dialog(s);
  modal.setTitle(details.title);
  const body = modal.getContentElement()!;
  body.replaceChildren(paragraph(details.text));
  if (s.dialog === "add-network") {
    const fields = div("settings__fields");
    for (const [label, type, action] of [["Network name", "text", "name"], ["Password (optional)", "password", "password"]] as const) {
      const input = createTextField({ label, type });
      input.on("input", e => send({ type: action, value: e.value }));
      dialogControls.push(input);
      fields.append(input.element);
    }
    body.append(fields);
  }
  const actions = div("settings__actions");
  const cancel = createButton({ variant: "text", text: isNetwork(s) || s.dialog === "add-network" ? "Cancel" : "Done" });
  cancel.on("click", () => send({ type: "close" }));
  dialogControls.push(cancel);
  actions.append(cancel.element);
  if (isNetwork(s) || s.dialog === "add-network") {
    connect = createButton({ text: "Connect", disabled: s.dialog === "add-network" && !s.draftName.trim() });
    connect.on("click", () => send({ type: s.dialog === "add-network" ? "add" : "connect" }));
    dialogControls.push(connect);
    actions.append(connect.element);
  }
  modal.getFooterElement()!.replaceChildren(actions);
  modal.open();
}
function send(a: Action) {
  const before = s;
  s = reduce(s, a);
  if (a.type === "name" || a.type === "password") { if (connect) s.draftName.trim() ? connect.enable() : connect.disable(); return; }
  if (a.type === "query") { renderBody(); return; }
  if (before.screen !== s.screen) {
    bar.setTitle(s.screen === "wifi" ? "Wi-Fi" : "Settings");
    if (s.screen === "wifi") bar.addLeadingElement(back.element); else back.element.remove();
  }
  if (s.searching) { if (!searchBox.isConnected) content.prepend(searchBox); } else searchBox.remove();
  search.setValue(s.query);
  renderBody();
  if (before.dialog !== s.dialog) renderDialog();
  if (announces(a)) { snackbar.setDuration("short"); snackbar.setMessage(s.notice); snackbar.show(); }
}
renderBody();
mountRowControls();
