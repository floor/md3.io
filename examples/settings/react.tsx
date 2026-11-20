// React: the generated adapters render the same Material elements.
import { useRef, useState } from "react";
import type { SnackbarElement } from "material/elements";
import { Button, Dialog, IconButton, List, ListItem, Progress, Snackbar, Switch, TextField, TopAppBar } from "material/react";
import { Avatar } from "material-addons/react";
import { DEFAULTS, ICONS, activate, announces, dialog, groups, isNetwork, reduce, wifiRow, type Action, type Row } from "./shared";

export default function Settings() {
  const [s, setS] = useState(DEFAULTS);
  const snackbar = useRef<SnackbarElement | null>(null);
  const send = (a: Action) => {
    setS(previous => reduce(previous, a));
    if (announces(a)) requestAnimationFrame(() => snackbar.current?.show());
  };
  const row = (r: Row) => <div key={r.id}>
    <div className={`settings__row${r.toggle ? " settings__row--toggle" : r.account ? " settings__row--account" : ""}`}>
      {r.account && <Avatar variant="text" size="medium" text="MV" decorative />}
      <List selection="single" onActivate={e => activate(e, () => send(r.toggle ? { type: "toggle", key: r.toggle, checked: !s[r.toggle] } : { type: "row", id: r.id }))}>
        <ListItem value={r.id} headline={r.label} supportingText={r.supporting} leadingIcon={r.icon || undefined} trailingIcon={r.toggle ? undefined : ICONS.chevron} disabled={r.disabled} />
      </List>
      {r.toggle && <Switch ariaLabel={r.label} checked={s[r.toggle]} disabled={r.disabled} onChange={e => send({ type: "toggle", key: r.toggle!, checked: e.detail.checked })} />}
    </div>
    {r.storage && <div className="settings__storage"><Progress variant="linear" value={38} max={128} ariaLabel="Storage used" /></div>}
  </div>;
  const details = dialog(s);
  return <section className="settings">
    <TopAppBar headline={s.screen === "wifi" ? "Wi-Fi" : "Settings"} type="small" noScroll>
      {s.screen === "wifi" && <IconButton slot="leading" icon={ICONS.back} ariaLabel="Back" onClick={() => send({ type: "back" })} />}
      <IconButton slot="trailing" icon={ICONS.search} ariaLabel="Search settings" onClick={() => send({ type: "search" })} />
      <IconButton className="settings__mobile" slot="trailing" icon={ICONS.more} ariaLabel="Device information" onClick={() => send({ type: "row", id: "version" })} />
    </TopAppBar>
    <div className="settings__content">
      {s.searching && <div className="settings__search"><TextField label="Search settings" type="search" value={s.query} onInput={e => send({ type: "query", value: e.detail.value })} /></div>}
      {s.screen === "home" ? <div className="settings__grid">
        {groups(s).map(g => <section className="settings__group" key={g.title} aria-label={g.title}>
          <List selection="none"><ListItem kind="subheader" headline={g.title} /></List>
          {g.rows.map(row)}
        </section>)}
        {groups(s).length === 0 && <p>No settings found.</p>}
      </div> : <div className="settings__wifi">
        {row(wifiRow(s))}
        {s.wifi && !s.airplane ? <>
          <List selection="single" ariaLabel="Nearby networks" onActivate={e => activate(e, () => send({ type: "row", id: e.detail.value }))}>
            <ListItem kind="subheader" headline="Nearby networks" />
            {s.networks.map(n => <ListItem key={n.name} value={`network:${n.name}`} headline={n.name} supportingText={s.connected === n.name ? "Connected" : n.secure ? "Saved · Secured" : "Open network"} leadingIcon={ICONS.wifi} trailingIcon={s.connected === n.name ? ICONS.check : n.secure ? ICONS.lock : ICONS.chevron} />)}
            <ListItem value="add-network" headline="Add network" supportingText="Connect to a hidden or new network" leadingIcon={ICONS.add} trailingIcon={ICONS.chevron} />
          </List>
        </> : <p>Turn on Wi-Fi to see nearby networks.</p>}
      </div>}
    </div>
    <Dialog open={!!s.dialog} headline={details.title} onClose={() => send({ type: "close" })}>
      <p>{details.text}</p>
      {s.dialog === "add-network" && <div className="settings__fields">
        <TextField label="Network name" value={s.draftName} onInput={e => send({ type: "name", value: e.detail.value })} />
        <TextField label="Password (optional)" type="password" value={s.password} onInput={e => send({ type: "password", value: e.detail.value })} />
      </div>}
      <div slot="actions" className="settings__actions">
        <Button variant="text" onClick={() => send({ type: "close" })}>{isNetwork(s) || s.dialog === "add-network" ? "Cancel" : "Done"}</Button>
        {(isNetwork(s) || s.dialog === "add-network") && <Button disabled={s.dialog === "add-network" && !s.draftName.trim()} onClick={() => send({ type: s.dialog === "add-network" ? "add" : "connect" })}>Connect</Button>}
      </div>
    </Dialog>
    <Snackbar message={s.notice} duration="short" dismissible ref={snackbar} />
  </section>;
}
