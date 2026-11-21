<!-- Svelte: material/svelte wraps the same elements; bind: keeps their live state. -->
<script lang="ts">
  import "material/elements/css/top-app-bar";
  import { defineTopAppBar } from "material/elements";
  import { BottomSheet, Button, ButtonGroup, ButtonGroupItem, Card, Chip, Chips, Dialog, Drawer, DrawerItem, ExtendedFab, IconButton, Menu, MenuItem, Search, Snackbar, TextField } from "material/svelte";
  import { DEFAULTS, LABELS, ADD_ICON, CLOSE_ICON, GRID_ICON, LIST_ICON, MENU_ICON, MORE_ICON, SEARCH_ICON,
    categoryItems, categoryLabels, editedLabel, emptyLabel, labelOf, nextEdit, noteGroups, noteTitle, observeCompact, status, visible,
    type Category, type LabelId, type Note, type State } from "./shared";

  defineTopAppBar();
  // Svelte drops a slot attribute on a child it does not treat as a custom-element slot,
  // so the tools never reach the bar. Assign the slot once the node is in the bar.
  const slotTrailing = (node: HTMLElement) => {
    node.slot = "trailing";
  };
  let menu = $state<{ element?: HTMLElement } | null>(null);
  $effect(() => {
    if (menu?.element) menu.element.slot = "leading";
  });

  let shell = $state<HTMLElement>();
  let compact = $state(false);
  let drawerOpen = $state(false);
  let searchOpen = $state(false);
  let resizing = false;
  $effect(() => {
    if (shell) return observeCompact(shell, narrow => {
      resizing = true;
      compact = narrow;
      drawerOpen = false;
      searchOpen = false;
      requestAnimationFrame(() => requestAnimationFrame(() => { resizing = false; }));
    });
  });
  let s = $state<State>({ ...DEFAULTS, notes: DEFAULTS.notes.map((n) => ({ ...n, labels: [...n.labels] })) });
  let draft = $state<{ note: Note | null; title: string; text: string; labels: LabelId[] } | null>(null);
  const dismissEditor = () => { if (!resizing) draft = null; };
  let snackbar = $state<{ element?: { show: () => void } } | null>(null);
  let deleted: { note: Note; at: number } | null = null;

  const open = (note: Note | null) =>
    (draft = note
      ? { note, title: note.title, text: note.text, labels: [...note.labels] }
      : { note: null, title: "", text: "", labels: categoryLabels(s.category) });
  const save = () => {
    const d = draft;
    if (!d) return;
    if (d.note) {
      d.note.title = noteTitle(d.title);
      d.note.text = d.text;
      d.note.labels = [...d.labels];
      d.note.editedAt = nextEdit(s.notes);
      s = { ...s };
    } else {
      s = { ...s, notes: [...s.notes, { id: crypto.randomUUID(), title: noteTitle(d.title), text: d.text, labels: [...d.labels], pinned: s.category === "pinned", editedAt: nextEdit(s.notes) }] };
    }
    draft = null;
  };
  const remove = (note: Note) => {
    deleted = { note, at: s.notes.indexOf(note) };
    s = { ...s, notes: s.notes.filter((n) => n !== note) };
    draft = null;
    snackbar?.element?.show();
  };
  const undo = () => {
    if (!deleted) return;
    const { note, at } = deleted;
    deleted = null;
    s = { ...s, notes: [...s.notes.slice(0, at), note, ...s.notes.slice(at)] };
  };
  const pin = (note: Note) => (s = { ...s, notes: s.notes.map((n) => (n === note ? { ...n, pinned: !n.pinned } : n)) });
  const groups = $derived(noteGroups(visible(s)));
  const items = $derived(categoryItems(s));
  const closeDrawer = () => {
    if (!compact) return;
    drawerOpen = false;
    queueMicrotask(() => shell?.querySelector<HTMLElement>(".notes__menu")?.focus());
  };
  const toggleSearch = () => {
    searchOpen = !searchOpen;
    if (!searchOpen) s = { ...s, query: "" };
    else requestAnimationFrame(() => shell?.querySelector<HTMLElement>(".notes__search")?.focus());
  };
</script>

{#snippet search()}
  <Search class="notes__search" placeholder="Search notes" value={s.query}
    oninput={(e) => (s = { ...s, query: e.detail.value })} />
{/snippet}

<section class="notes" bind:this={shell} data-compact={compact}>
  <!-- The bar is the element. A slot attribute on these children is discarded by the
       Svelte compiler, so the slot is assigned once the node is in the bar. -->
  <m-top-app-bar headline="Notes" no-scroll>
    {#if compact}
      <IconButton bind:this={menu} class="notes__menu" icon={MENU_ICON} ariaLabel="Open categories"
        onclick={() => (drawerOpen = true)} />
    {/if}
    <div class="notes__tools" use:slotTrailing>
      {#if compact}
        <IconButton icon={searchOpen ? CLOSE_ICON : SEARCH_ICON}
          ariaLabel={searchOpen ? "Close search" : "Search notes"} onclick={toggleSearch} />
      {:else}
        {@render search()}
        <ButtonGroup kind="connected" selection="single" required value={s.view}
          onchange={(e) => (s = { ...s, view: e.detail.value === "list" ? "list" : "grid" })}>
          <ButtonGroupItem icon={GRID_ICON} value="grid" ariaLabel="Grid view" />
          <ButtonGroupItem icon={LIST_ICON} value="list" ariaLabel="List view" />
        </ButtonGroup>
      {/if}
    </div>
  </m-top-app-bar>
  {#if compact}
    <div class="notes__mobile-search" hidden={!searchOpen}>{@render search()}</div>
  {/if}
  <div class="notes__workspace">
    {#key compact}
      <Drawer class="notes__drawer" modal={compact} open={!compact || drawerOpen} width="216"
        value={s.category} ariaLabel="Categories" onclose={closeDrawer}
        onchange={(e) => {
          s = { ...s, category: e.detail.value as Category };
          if (compact) drawerOpen = false;
        }}>
        {#each items.slice(0, 2) as item (item.id)}
          <DrawerItem value={item.id} badge={item.badge}>{item.label}</DrawerItem>
        {/each}
        <DrawerItem type="section">Labels</DrawerItem>
        {#each items.slice(2) as item (item.id)}
          <DrawerItem value={item.id} badge={item.badge}>{item.label}</DrawerItem>
        {/each}
      </Drawer>
    {/key}
    <div class="notes__content">
      <output class="notes__status" role="status">{status(s)}</output>
      {#if groups.length === 0}
        <div class="notes__empty">
          <p>{emptyLabel(s)}</p>
          {#if !s.query}<Button variant="text" onclick={() => open(null)}>Create note</Button>{/if}
        </div>
      {:else}
        {#each groups as group (group.title)}
          <section class="notes__section">
            <h2>{group.title}</h2>
            <div class="notes__grid {s.view}">
              {#each group.notes as note (note.id)}
                <article class="notes__card" aria-label={note.title}>
                  <Card>
                    <div class="notes__card-heading">
                      <button type="button" class="notes__open" onclick={() => open(note)}>{note.title}</button>
                      <IconButton id={`notes-more-${note.id}`} class="notes__more"
                        icon={MORE_ICON} ariaLabel={`More actions for ${note.title}`} />
                    </div>
                    <p>{note.text}</p>
                    {#if note.labels.length > 0}<p class="notes__labels">{note.labels.map(labelOf).join(" · ")}</p>{/if}
                    <time datetime={new Date(note.editedAt).toISOString()}>{editedLabel(note.editedAt)}</time>
                  </Card>
                  <Menu anchor={`notes-more-${note.id}`} position="bottom-end" onselect={(e) => {
                    if (e.detail.value === "pin") pin(note);
                    else if (e.detail.value === "labels") open(note);
                    else if (e.detail.value === "delete") remove(note);
                  }}>
                    <MenuItem value="pin">{note.pinned ? "Unpin" : "Pin"}</MenuItem>
                    <MenuItem value="labels">Labels</MenuItem>
                    <MenuItem value="delete">Delete</MenuItem>
                  </Menu>
                </article>
              {/each}
            </div>
          </section>
        {/each}
      {/if}
    </div>
  </div>
  <ExtendedFab icon={ADD_ICON} ariaLabel="New note" onclick={() => open(null)}>New note</ExtendedFab>
  {#if compact}
    <BottomSheet open={draft !== null} title={draft?.note ? "Edit note" : "New note"} modal onclose={dismissEditor}>
      <div class="notes__fields">
        <TextField label="Title" value={draft?.title ?? ""} oninput={(e) => draft && (draft = { ...draft, title: e.detail.value })} />
        <TextField label="Note" type="multiline" value={draft?.text ?? ""} oninput={(e) => draft && (draft = { ...draft, text: e.detail.value })} />
        <Chips value={draft?.labels.join(",") ?? ""} onchange={(e) => draft && (draft = { ...draft, labels: e.detail.value as LabelId[] })}>
          {#each LABELS as l (l.value)}
            <Chip label={l.text} value={l.value} />
          {/each}
        </Chips>
      </div>
      <div class="notes__editor-actions">
        <Button variant="outlined" onclick={() => (draft?.note ? remove(draft.note) : (draft = null))}>Delete</Button>
        <Button variant="text" onclick={() => (draft = null)}>Cancel</Button>
        <Button onclick={save}>Save</Button>
      </div>
    </BottomSheet>
  {:else}
    <Dialog open={draft !== null} headline={draft?.note ? "Edit note" : "New note"} onclose={dismissEditor}>
      <div class="notes__fields">
        <TextField label="Title" value={draft?.title ?? ""} oninput={(e) => draft && (draft = { ...draft, title: e.detail.value })} />
        <TextField label="Note" type="multiline" value={draft?.text ?? ""} oninput={(e) => draft && (draft = { ...draft, text: e.detail.value })} />
        <Chips value={draft?.labels.join(",") ?? ""} onchange={(e) => draft && (draft = { ...draft, labels: e.detail.value as LabelId[] })}>
          {#each LABELS as l (l.value)}
            <Chip label={l.text} value={l.value} />
          {/each}
        </Chips>
      </div>
      {#snippet actions()}
        <div class="notes__editor-actions">
          <Button variant="outlined" onclick={() => (draft?.note ? remove(draft.note) : (draft = null))}>Delete</Button>
          <Button variant="text" onclick={() => (draft = null)}>Cancel</Button>
          <Button onclick={save}>Save</Button>
        </div>
      {/snippet}
    </Dialog>
  {/if}
  <Snackbar bind:this={snackbar} message="Note deleted" action="Undo" duration="4000" dismissible onaction={undo} />
</section>
