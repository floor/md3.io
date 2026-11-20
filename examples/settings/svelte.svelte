<!-- Svelte: reactive state and the generated Material adapters. -->
<script lang="ts">
  import type { SnackbarElement } from "material/elements";
  import { Button, Dialog, IconButton, List, ListItem, Progress, Snackbar, Switch, TextField, TopAppBar } from "material/svelte";
  import { Avatar } from "material-addons/svelte";
  import { DEFAULTS, ICONS, activate, announces, dialog, groups, isNetwork, reduce, wifiRow, type Action, type Row } from "./shared";
  let s = $state({ ...DEFAULTS });
  let snackbar: { element?: SnackbarElement } | undefined = $state();
  const send = (a: Action) => {
    s = reduce(s, a);
    if (announces(a)) requestAnimationFrame(() => snackbar?.element?.show());
  };
  const details = $derived(dialog(s));
</script>

{#snippet row(r: Row)}
  <div>
    <div class={`settings__row${r.toggle ? " settings__row--toggle" : r.account ? " settings__row--account" : ""}`}>
      {#if r.account}<Avatar variant="text" size="medium" text="MV" decorative />{/if}
      <List selection="single" onactivate={e => activate(e, () => send(r.toggle ? { type: "toggle", key: r.toggle, checked: !s[r.toggle] } : { type: "row", id: r.id }))}>
        <ListItem value={r.id} headline={r.label} supportingText={r.supporting} leadingIcon={r.icon || undefined} trailingIcon={r.toggle ? undefined : ICONS.chevron} disabled={r.disabled} />
      </List>
      {#if r.toggle}<Switch ariaLabel={r.label} checked={s[r.toggle]} disabled={r.disabled} onchange={e => send({ type: "toggle", key: r.toggle!, checked: e.detail.checked })} />{/if}
    </div>
    {#if r.storage}<div class="settings__storage"><Progress variant="linear" value={38} max={128} ariaLabel="Storage used" /></div>{/if}
  </div>
{/snippet}

<section class="settings">
  <TopAppBar headline={s.screen === "wifi" ? "Wi-Fi" : "Settings"} type="small" noScroll>
    {#snippet leading()}
    {#if s.screen === "wifi"}<IconButton icon={ICONS.back} ariaLabel="Back" onclick={() => send({ type: "back" })} />{/if}
    {/snippet}
    {#snippet trailing()}
    <div class="settings__actions">
    <IconButton icon={ICONS.search} ariaLabel="Search settings" onclick={() => send({ type: "search" })} />
    <IconButton class="settings__mobile" icon={ICONS.more} ariaLabel="Device information" onclick={() => send({ type: "row", id: "version" })} />
    </div>
    {/snippet}
  </TopAppBar>
  <div class="settings__content">
    {#if s.searching}<div class="settings__search"><TextField label="Search settings" type="search" value={s.query} oninput={e => send({ type: "query", value: e.detail.value })} /></div>{/if}
    {#if s.screen === "home"}
      <div class="settings__grid">
        {#each groups(s) as g (g.title)}
          <section class="settings__group" aria-label={g.title}>
            <List selection="none"><ListItem kind="subheader" headline={g.title} /></List>
            {#each g.rows as r (r.id)}{@render row(r)}{/each}
          </section>
        {/each}
        {#if groups(s).length === 0}<p>No settings found.</p>{/if}
      </div>
    {:else}
      <div class="settings__wifi">
        {@render row(wifiRow(s))}
        {#if s.wifi && !s.airplane}
          <List selection="single" ariaLabel="Nearby networks" onactivate={e => activate(e, () => send({ type: "row", id: e.detail.value }))}>
            <ListItem kind="subheader" headline="Nearby networks" />
            {#each s.networks as n (n.name)}
              <ListItem value={`network:${n.name}`} headline={n.name} supportingText={s.connected === n.name ? "Connected" : n.secure ? "Saved · Secured" : "Open network"} leadingIcon={ICONS.wifi} trailingIcon={s.connected === n.name ? ICONS.check : n.secure ? ICONS.lock : ICONS.chevron} />
            {/each}
            <ListItem value="add-network" headline="Add network" supportingText="Connect to a hidden or new network" leadingIcon={ICONS.add} trailingIcon={ICONS.chevron} />
          </List>
        {:else}<p>Turn on Wi-Fi to see nearby networks.</p>{/if}
      </div>
    {/if}
  </div>
  <Dialog open={!!s.dialog} headline={details.title} onclose={() => send({ type: "close" })}>
    <p>{details.text}</p>
    {#if s.dialog === "add-network"}
      <div class="settings__fields">
        <TextField label="Network name" value={s.draftName} oninput={e => send({ type: "name", value: e.detail.value })} />
        <TextField label="Password (optional)" type="password" value={s.password} oninput={e => send({ type: "password", value: e.detail.value })} />
      </div>
    {/if}
    {#snippet actions()}
    <div class="settings__actions">
      <Button variant="text" onclick={() => send({ type: "close" })}>{isNetwork(s) || s.dialog === "add-network" ? "Cancel" : "Done"}</Button>
      {#if isNetwork(s) || s.dialog === "add-network"}<Button disabled={s.dialog === "add-network" && !s.draftName.trim()} onclick={() => send({ type: s.dialog === "add-network" ? "add" : "connect" })}>Connect</Button>{/if}
    </div>
    {/snippet}
  </Dialog>
  <Snackbar message={s.notice} duration="short" dismissible bind:this={snackbar} />
</section>
