// Vanilla: the create* factories the elements are built on.
import createButton from "material/components/button";
import createSwitch from "material/components/switch";
import createTabs from "material/components/tabs";
import { DEFAULTS, summary, type Settings } from "./shared";

const s: Settings = { ...DEFAULTS };
const app = document.getElementById("app")!;
const section = Object.assign(document.createElement("section"), { className: "settings" });
const panel = (): HTMLDivElement => Object.assign(document.createElement("div"), { className: "settings__panel" });
const status = Object.assign(document.createElement("output"), { className: "settings__status" });
status.setAttribute("role", "status");

const tabs = createTabs({
  tabs: [
    { text: "Connectivity", value: "connectivity", state: "active" },
    { text: "Notifications", value: "notifications" },
  ],
});
const connectivity = panel();
const notifications = panel();
notifications.hidden = true;
tabs.on("change", ({ value }: { value: string }) => {
  connectivity.hidden = value !== "connectivity";
  notifications.hidden = value !== "notifications";
});

const make = (key: keyof Settings, label: string, supportingText?: string) => {
  const control = createSwitch({ label, checked: Boolean(s[key]), supportingText });
  control.on("change", ({ checked }) => {
    (s as Record<string, unknown>)[key] = checked;
    if (key === "airplane") applyAirplane();
  });
  return control;
};
const wifi = make("wifi", "Wi-Fi");
const bluetooth = make("bluetooth", "Bluetooth");
const airplane = make("airplane", "Airplane mode", "Turns off Wi-Fi and Bluetooth");
const allow = make("notifications", "Allow notifications");
const sounds = make("sounds", "Sounds");
const applyAirplane = (): void => {
  for (const control of [wifi, bluetooth]) s.airplane ? control.disable() : control.enable();
};
connectivity.append(wifi.element, bluetooth.element, airplane.element);
notifications.append(allow.element, sounds.element);

const actions = Object.assign(document.createElement("footer"), { className: "settings__actions" });
const reset = createButton({ text: "Reset", variant: "outlined" });
const save = createButton({ text: "Save" });
reset.on("click", () => {
  Object.assign(s, { ...DEFAULTS, tab: s.tab });
  wifi.setValue(s.wifi); bluetooth.setValue(s.bluetooth); airplane.setValue(s.airplane);
  allow.setValue(s.notifications); sounds.setValue(s.sounds);
  applyAirplane();
  status.textContent = "Reset to the defaults.";
});
save.on("click", () => (status.textContent = summary(s)));
actions.append(reset.element, save.element);

section.append(tabs.element, connectivity, notifications, actions, status);
app.append(section);
