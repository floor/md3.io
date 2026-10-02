// React: material/react wraps the same elements.
import { useState } from "react";
import { Button, Switch, Tab, Tabs } from "material/react";
import { DEFAULTS, summary, type Settings as State } from "./shared";

export default function Settings() {
  const [s, setS] = useState<State>(DEFAULTS);
  const [status, setStatus] = useState("");
  const toggle = (key: keyof State) => (e: CustomEvent<{ checked: boolean }>) =>
    setS((prev) => ({ ...prev, [key]: e.detail.checked }));

  return (
    <section className="settings">
      <Tabs value={s.tab} onChange={(e) => setS((prev) => ({ ...prev, tab: e.detail.value ?? prev.tab }))}>
        <Tab value="connectivity">Connectivity</Tab>
        <Tab value="notifications">Notifications</Tab>
      </Tabs>
      <div className="settings__panel" hidden={s.tab !== "connectivity"}>
        <Switch checked={s.wifi} disabled={s.airplane} onChange={toggle("wifi")}>Wi-Fi</Switch>
        <Switch checked={s.bluetooth} disabled={s.airplane} onChange={toggle("bluetooth")}>Bluetooth</Switch>
        <Switch checked={s.airplane} supportingText="Turns off Wi-Fi and Bluetooth" onChange={toggle("airplane")}>
          Airplane mode
        </Switch>
      </div>
      <div className="settings__panel" hidden={s.tab !== "notifications"}>
        <Switch checked={s.notifications} onChange={toggle("notifications")}>Allow notifications</Switch>
        <Switch checked={s.sounds} onChange={toggle("sounds")}>Sounds</Switch>
      </div>
      <footer className="settings__actions">
        <Button variant="outlined" onClick={() => { setS((prev) => ({ ...DEFAULTS, tab: prev.tab })); setStatus("Reset to the defaults."); }}>
          Reset
        </Button>
        <Button onClick={() => setStatus(summary(s))}>Save</Button>
      </footer>
      <output className="settings__status" role="status">{status}</output>
    </section>
  );
}
