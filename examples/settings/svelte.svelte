<!-- Svelte: mtrl/svelte wraps the same elements; bind: keeps their live state. -->
<script lang="ts">
  import { Button, Switch, Tab, Tabs } from "mtrl/svelte";
  import { DEFAULTS, summary } from "./shared";

  let s = $state({ ...DEFAULTS });
  let status = $state("");

  const reset = () => {
    s = { ...DEFAULTS, tab: s.tab };
    status = "Reset to the defaults.";
  };
</script>

<section class="settings">
  <Tabs bind:value={s.tab}>
    <Tab value="connectivity">Connectivity</Tab>
    <Tab value="notifications">Notifications</Tab>
  </Tabs>
  <div class="settings__panel" hidden={s.tab !== "connectivity"}>
    <Switch bind:checked={s.wifi} disabled={s.airplane}>Wi-Fi</Switch>
    <Switch bind:checked={s.bluetooth} disabled={s.airplane}>Bluetooth</Switch>
    <Switch bind:checked={s.airplane} supportingText="Turns off Wi-Fi and Bluetooth">Airplane mode</Switch>
  </div>
  <div class="settings__panel" hidden={s.tab !== "notifications"}>
    <Switch bind:checked={s.notifications}>Allow notifications</Switch>
    <Switch bind:checked={s.sounds}>Sounds</Switch>
  </div>
  <footer class="settings__actions">
    <Button variant="outlined" onclick={reset}>Reset</Button>
    <Button onclick={() => (status = summary(s))}>Save</Button>
  </footer>
  <output class="settings__status" role="status">{status}</output>
</section>
