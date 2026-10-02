// Solid: material/solid wraps the same elements.
import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { Button, Switch, Tab, Tabs } from "material/solid";
import { DEFAULTS, summary, type Settings as State } from "./shared";

export default function Settings() {
  const [s, setS] = createStore<State>({ ...DEFAULTS });
  const [status, setStatus] = createSignal("");
  const toggle = (key: keyof State) => (e: CustomEvent<{ checked: boolean }>) => setS(key, e.detail.checked);

  return (
    <section class="settings">
      <Tabs value={s.tab} onChange={(e) => setS("tab", e.detail.value ?? s.tab)}>
        <Tab value="connectivity">Connectivity</Tab>
        <Tab value="notifications">Notifications</Tab>
      </Tabs>
      <div class="settings__panel" hidden={s.tab !== "connectivity"}>
        <Switch checked={s.wifi} disabled={s.airplane} onChange={toggle("wifi")}>Wi-Fi</Switch>
        <Switch checked={s.bluetooth} disabled={s.airplane} onChange={toggle("bluetooth")}>Bluetooth</Switch>
        <Switch checked={s.airplane} supportingText="Turns off Wi-Fi and Bluetooth" onChange={toggle("airplane")}>
          Airplane mode
        </Switch>
      </div>
      <div class="settings__panel" hidden={s.tab !== "notifications"}>
        <Switch checked={s.notifications} onChange={toggle("notifications")}>Allow notifications</Switch>
        <Switch checked={s.sounds} onChange={toggle("sounds")}>Sounds</Switch>
      </div>
      <footer class="settings__actions">
        <Button variant="outlined" onClick={() => { setS({ ...DEFAULTS, tab: s.tab }); setStatus("Reset to the defaults."); }}>
          Reset
        </Button>
        <Button onClick={() => setStatus(summary(s))}>Save</Button>
      </footer>
      <output class="settings__status" role="status">{status()}</output>
    </section>
  );
}
