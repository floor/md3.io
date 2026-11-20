// Invented device data and the state transitions shared by all six implementations.
const icon = (path: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${path}"/></svg>`;
export const ICONS = {
  wifi: icon("M1 9l2 2a13 13 0 0 1 18 0l2-2A16 16 0 0 0 1 9zm4 4 2 2a7 7 0 0 1 10 0l2-2a10 10 0 0 0-14 0zm4 4 3 3 3-3a4 4 0 0 0-6 0z"),
  bluetooth: icon("M17.7 7.7 12 2v8.6L7.4 6 6 7.4l5 5-5 5L7.4 19l4.6-4.6V23l5.7-5.7-4.3-4.3 4.3-5.3zM14 6.8l1 1-1 1.4V6.8zm0 10 1 1-1 1v-2z"),
  airplane: icon("m21 16-8-5V5a1 1 0 0 0-2 0v6l-8 5v2l8-2.5V20l-2 1v1l3-1 3 1v-1l-2-1v-4.5l8 2.5z"),
  brightness: icon("M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 16V5a7 7 0 1 1 0 14z"),
  notifications: icon("M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6v-5c0-3-1.6-5-4-5.7V5a2 2 0 0 0-4 0v.3C7.6 6 6 8 6 11v5l-2 2v1h16v-1z"),
  sounds: icon("M3 9v6h4l5 5V4L7 9H3zm11-1v8a5 5 0 0 0 0-8zm0-5v2a7 7 0 0 1 0 14v2a9 9 0 0 0 0-18z"),
  location: icon("M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"),
  storage: icon("M3 3h18v5H3V3zm0 7h18v5H3v-5zm0 7h18v4H3v-4z"),
  battery: icon("M16 4h-2V2h-4v2H8a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1zM9 6h6v5H9V6z"),
  info: icon("M11 17h2v-6h-2v6zm0-8h2V7h-2v2zm1-7a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"),
  chevron: icon("m9 6-1.4 1.4 4.6 4.6-4.6 4.6L9 18l6-6z"),
  back: icon("m20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z"),
  search: icon("M9.5 3a6.5 6.5 0 1 0 4 11.6L20 21l1-1-6.4-6.5A6.5 6.5 0 0 0 9.5 3zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z"),
  more: icon("M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"),
  lock: icon("M17 8h-1V6a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v10h14V10a2 2 0 0 0-2-2zm-7-2a2 2 0 0 1 4 0v2h-4V6z"),
  check: icon("m9 16-5-5-1.4 1.4L9 19 21 7l-1.4-1.4z"),
  add: icon("M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"),
};
export type ToggleKey = "wifi" | "bluetooth" | "airplane" | "brightness" | "notifications" | "sounds" | "location";
export interface Network { name: string; secure: boolean; }
export interface State {
  wifi: boolean; bluetooth: boolean; airplane: boolean; brightness: boolean;
  notifications: boolean; sounds: boolean; location: boolean;
  screen: "home" | "wifi"; searching: boolean; query: string;
  connected: string; networks: Network[]; dialog: string; draftName: string; password: string; notice: string;
}
export const DEFAULTS: State = {
  wifi: true, bluetooth: false, airplane: false, brightness: true, notifications: true, sounds: true, location: false,
  screen: "home", searching: false, query: "", connected: "Willow Loft", dialog: "", draftName: "", password: "", notice: "",
  networks: [{ name: "Willow Loft", secure: true }, { name: "Willow Studio", secure: true }, { name: "Courtyard Guest", secure: false }, { name: "Fern House", secure: true }],
};
export interface Row { id: string; label: string; supporting: string; icon: string; toggle?: ToggleKey; disabled?: boolean; account?: boolean; storage?: boolean; }
export interface Group { title: string; rows: Row[]; }
export function groups(s: State): Group[] {
  const all: Group[] = [
    { title: "Account", rows: [{ id: "account", label: "Mira Vale", supporting: "mira.vale@example.com", icon: "", account: true }] },
    { title: "Network & internet", rows: [
      { id: "wifi", label: "Wi-Fi", supporting: s.airplane ? "Off in airplane mode" : s.wifi ? s.connected || "Not connected" : "Off", icon: ICONS.wifi },
      { id: "bluetooth", label: "Bluetooth", supporting: s.bluetooth ? "Visible to nearby devices" : "Not connected", icon: ICONS.bluetooth, toggle: "bluetooth", disabled: s.airplane },
      { id: "airplane", label: "Airplane mode", supporting: "Turn off wireless connections", icon: ICONS.airplane, toggle: "airplane" },
    ] },
    { title: "Display", rows: [{ id: "brightness", label: "Adaptive brightness", supporting: "Adjust to the light around you", icon: ICONS.brightness, toggle: "brightness" }] },
    { title: "Sounds & notifications", rows: [
      { id: "notifications", label: "Allow notifications", supporting: "Alerts, reminders and messages", icon: ICONS.notifications, toggle: "notifications" },
      { id: "sounds", label: "Notification sounds", supporting: s.notifications ? "Play a sound for new alerts" : "Turn on notifications to play sounds", icon: ICONS.sounds, toggle: "sounds", disabled: !s.notifications },
    ] },
    { title: "Privacy", rows: [{ id: "location", label: "Use location", supporting: "Let apps request your location", icon: ICONS.location, toggle: "location" }] },
    { title: "About this device", rows: [
      { id: "storage", label: "Storage", supporting: "38 GB of 128 GB · 90 GB available", icon: ICONS.storage, storage: true },
      { id: "battery", label: "Battery", supporting: "82% · About 1 day remaining", icon: ICONS.battery },
      { id: "version", label: "Version", supporting: "Willow OS 4.2 · Up to date", icon: ICONS.info },
    ] },
  ];
  const query = s.query.trim().toLowerCase();
  return all.map(g => ({ ...g, rows: g.rows.filter(r => `${g.title} ${r.label} ${r.supporting}`.toLowerCase().includes(query)) })).filter(g => g.rows.length);
}
export const wifiRow = (s: State): Row => ({ id: "wifi-toggle", label: "Use Wi-Fi", supporting: s.airplane ? "Off in airplane mode" : s.wifi ? "Find and connect to nearby networks" : "Wi-Fi is off", icon: ICONS.wifi, toggle: "wifi", disabled: s.airplane });
export type Action =
  | { type: "toggle"; key: ToggleKey; checked: boolean }
  | { type: "row"; id: string }
  | { type: "back" | "search" | "close" | "connect" | "add" }
  | { type: "query" | "name" | "password"; value: string };
export function reduce(s: State, a: Action): State {
  if (a.type === "toggle") {
    if ((a.key === "wifi" || a.key === "bluetooth") && s.airplane || a.key === "sounds" && !s.notifications) return s;
    return { ...s, [a.key]: a.checked, ...(a.key === "airplane" && a.checked ? { wifi: false, bluetooth: false, connected: "" } : {}), ...(a.key === "wifi" && !a.checked ? { connected: "" } : {}), ...(a.key === "airplane" ? { notice: `Airplane mode ${a.checked ? "on" : "off"}` } : {}) };
  }
  if (a.type === "back") return { ...s, screen: "home" };
  if (a.type === "search") return { ...s, screen: "home", searching: !s.searching, query: "" };
  if (a.type === "query") return { ...s, query: a.value };
  if (a.type === "name") return { ...s, draftName: a.value };
  if (a.type === "password") return { ...s, password: a.value };
  if (a.type === "close") return { ...s, dialog: "", draftName: "", password: "" };
  if (a.type === "row") {
    if (a.id === "wifi") return { ...s, screen: "wifi", query: "", searching: false };
    const row = groups({ ...s, query: "" }).flatMap(g => g.rows).find(r => r.id === a.id);
    if (row?.toggle) return reduce(s, { type: "toggle", key: row.toggle, checked: !s[row.toggle] });
    return { ...s, dialog: a.id };
  }
  if (a.type === "connect") {
    if (!s.wifi || s.airplane) return s;
    return { ...s, connected: s.dialog.slice(8), dialog: "", notice: `Connected to ${s.dialog.slice(8)}` };
  }
  if (a.type === "add") {
    const name = s.draftName.trim();
    if (!name || !s.wifi || s.airplane) return s;
    const networks = s.networks.some(n => n.name === name) ? s.networks : [...s.networks, { name, secure: !!s.password }];
    return { ...s, networks, connected: name, dialog: "", draftName: "", password: "", notice: `Connected to ${name}` };
  }
  return s;
}
export const announces = (a: Action): boolean => a.type === "connect" || a.type === "add" || a.type === "toggle" && a.key === "airplane" || a.type === "row" && a.id === "airplane";
const DETAILS: Record<string, { title: string; text: string }> = {
  account: { title: "Mira Vale", text: "mira.vale@example.com · Personal account. Your device preferences apply immediately." },
  storage: { title: "Storage", text: "38 GB of 128 GB used. Apps: 18 GB · Photos and videos: 12 GB · System: 8 GB. 90 GB available." },
  battery: { title: "Battery", text: "82% charged. About 1 day remaining based on recent use. Last charged today at 07:30." },
  version: { title: "About this device", text: "Willow OS 4.2 · Build 4.2.18. Security update: 1 November 2026. Your device is up to date." },
};
export const dialog = (s: State) => s.dialog === "add-network" ? { title: "Add network", text: "Enter a network name. Leave the password empty for an open network." } : DETAILS[s.dialog] ?? { title: s.dialog.slice(8), text: s.networks.find(n => n.name === s.dialog.slice(8))?.secure ? "Saved network · Secured. Connect using the saved credentials on this device." : "Open network · Other people may be able to see your activity." };
export const isNetwork = (s: State): boolean => s.dialog.startsWith("network:") && s.networks.some(n => n.name === s.dialog.slice(8));

// Lists expose activation through single-selection. Clear it before applying the
// action: settings rows navigate or toggle, rather than staying selected.
export function activate(event: CustomEvent<{ value: string }>, action: () => void): void {
  (event.currentTarget as HTMLElement & { value: string | null }).value = null;
  action();
}

/** Material 3.16's list declarations expose icon/text slots, but not control nodes.
 * Project the framework-owned switch from its declaration into the rendered row.
 * The switch is the row's sole keyboard action; pointer activation of its text
 * still uses the list's activate event. Reapply after the list refreshes its rows.
 */
export function mountRowControls(root = document.getElementById("app")!): () => void {
  const controls = new WeakMap<HTMLElement, HTMLElement>();
  const wired = new WeakSet<HTMLElement>();
  const stopClick = (event: Event) => event.stopPropagation();
  let active = true;
  let frame = 0;
  let focusedLabel = "";
  const focusIn = (event: FocusEvent) => {
    const input = event.composedPath().find(node => node instanceof HTMLElement && node.getAttribute("role") === "switch") as HTMLElement | undefined;
    focusedLabel = input?.getAttribute("aria-label") ?? "";
  };
  const focusOut = (event: FocusEvent) => { if (event.relatedTarget) focusedLabel = ""; };
  root.addEventListener("focusin", focusIn);
  root.addEventListener("focusout", focusOut);
  const observer = new MutationObserver(() => sync());
  const sync = () => {
    if (!active) return;
    observer.disconnect();
    let pending = false;
    const roots: ShadowRoot[] = [];
    const switches: HTMLElement[] = [];
    for (const wrapper of root.querySelectorAll<HTMLElement>(".settings__row--toggle")) {
      const list = wrapper.querySelector<HTMLElement>("m-list, [role='list']");
      const control = controls.get(wrapper) ?? wrapper.querySelector<HTMLElement>("m-switch, .mtrl-switch");
      if (!list || !control) continue;
      controls.set(wrapper, control);
      switches.push(control);
      const surface = list.shadowRoot ?? list;
      if (list.shadowRoot) roots.push(list.shadowRoot);
      const row = surface.querySelector<HTMLElement>('[role="listitem"]');
      if (!row) { pending = true; continue; }
      row.querySelector(".mtrl-list__action")?.remove();
      control.style.width = "52px";
      control.style.flex = "0 0 auto";
      if (!wired.has(control)) {
        control.addEventListener("click", stopClick);
        wired.add(control);
      }
      if (!row.contains(control)) {
        const host = control as HTMLElement & { checked?: boolean };
        const checked = host.checked;
        row.append(control);
        if (checked !== undefined) host.checked = checked;
      }
    }
    observer.observe(root, { childList: true, subtree: true });
    for (const surface of roots) observer.observe(surface, { childList: true, subtree: true });
    // Rebuilding a list must not discard keyboard focus on a live preference.
    if (focusedLabel && document.activeElement === document.body) {
      for (const control of switches) {
        const input = (control.shadowRoot ?? control).querySelector<HTMLInputElement>('[role="switch"]');
        if (input?.getAttribute("aria-label") === focusedLabel && !input.disabled) {
          input.focus({ preventScroll: true });
          break;
        }
      }
    }
    if (pending && !frame) frame = requestAnimationFrame(() => { frame = 0; sync(); });
  };
  sync();
  return () => {
    active = false;
    observer.disconnect();
    cancelAnimationFrame(frame);
    root.removeEventListener("focusin", focusIn);
    root.removeEventListener("focusout", focusOut);
    for (const control of root.querySelectorAll<HTMLElement>("m-switch, .mtrl-switch")) control.removeEventListener("click", stopClick);
  };
}
