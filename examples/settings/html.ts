// Web components: the elements themselves, no framework.
import "mtrl/elements/css";
import { defineAll } from "mtrl/elements";
import { DEFAULTS, summary } from "./shared";

defineAll();

const app = document.getElementById("app")!;
app.innerHTML = `
  <section class="settings">
    <m-tabs id="tabs" value="connectivity">
      <m-tab value="connectivity">Connectivity</m-tab>
      <m-tab value="notifications">Notifications</m-tab>
    </m-tabs>
    <div class="settings__panel" id="connectivity">
      <m-switch id="wifi" checked>Wi-Fi</m-switch>
      <m-switch id="bluetooth">Bluetooth</m-switch>
      <m-switch id="airplane" supporting-text="Turns off Wi-Fi and Bluetooth">Airplane mode</m-switch>
    </div>
    <div class="settings__panel" id="notifications" hidden>
      <m-switch id="notifications-switch" checked>Allow notifications</m-switch>
      <m-switch id="sounds">Sounds</m-switch>
    </div>
    <footer class="settings__actions">
      <m-button id="reset" variant="outlined">Reset</m-button>
      <m-button id="save">Save</m-button>
    </footer>
    <output class="settings__status" role="status"></output>
  </section>`;

type SwitchElement = HTMLElement & { checked: boolean; disabled: boolean };
const $ = <T extends HTMLElement = SwitchElement>(id: string) => document.getElementById(id) as T;
const tabs = $<HTMLElement & { value: string }>("tabs");
const status = app.querySelector("output")!;
const switches = {
  wifi: $("wifi"), bluetooth: $("bluetooth"), airplane: $("airplane"),
  notifications: $("notifications-switch"), sounds: $("sounds"),
};

const showTab = (tab: string): void => {
  $("connectivity").hidden = tab !== "connectivity";
  $("notifications").hidden = tab !== "notifications";
};
const applyAirplane = (): void => {
  switches.wifi.disabled = switches.bluetooth.disabled = switches.airplane.checked;
};

tabs.addEventListener("change", (e) => showTab((e as CustomEvent<{ value: string }>).detail.value));
switches.airplane.addEventListener("change", applyAirplane);

$("save").addEventListener("click", () => {
  status.textContent = summary({
    tab: tabs.value,
    wifi: switches.wifi.checked, bluetooth: switches.bluetooth.checked, airplane: switches.airplane.checked,
    notifications: switches.notifications.checked, sounds: switches.sounds.checked,
  });
});
$("reset").addEventListener("click", () => {
  switches.wifi.checked = DEFAULTS.wifi;
  switches.bluetooth.checked = DEFAULTS.bluetooth;
  switches.airplane.checked = DEFAULTS.airplane;
  switches.notifications.checked = DEFAULTS.notifications;
  switches.sounds.checked = DEFAULTS.sounds;
  applyAirplane();
  status.textContent = "Reset to the defaults.";
});
