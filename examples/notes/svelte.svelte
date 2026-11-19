<!-- Svelte: material/svelte wraps the same elements; bind: keeps their live state. -->
<script lang="ts">
  import { BottomSheet, Button, ButtonGroup, ButtonGroupItem, Card, Chip, Chips, Dialog, ExtendedFab, IconButton, Search, Snackbar, TextField } from "material/svelte";
  import { DEFAULTS, LABELS, ADD_ICON, DELETE_ICON, GRID_ICON, LIST_ICON, PIN_ICON, labelOf, status, visible, type LabelId, type Note, type State } from "./shared";

  const narrow = matchMedia("(max-width: 600px)").matches;
  let s = $state<State>({ ...DEFAULTS, notes: DEFAULTS.notes.map((n) => ({ ...n, labels: [...n.labels] })) });
  let draft = $state<{ note: Note | null; title: string; text: string; labels: LabelId[] } | null>(null);
  let snackbar = $state<{ element?: { show: () => void } } | null>(null);
  let deleted: { note: Note; at: number } | null = null;

  const open = (note: Note | null) =>
    (draft = note
      ? { note, title: note.title, text: note.text, labels: [...note.labels] }
      : { note: null, title: "", text: "", labels: [] });
  const save = () => {
    const d = draft;
    if (!d) return;
    if (d.note) {
      d.note.title = d.title;
      d.note.text = d.text;
      d.note.labels = [...d.labels];
      s = { ...s };
    } else {
      s = { ...s, notes: [...s.notes, { id: crypto.randomUUID(), title: d.title, text: d.text, labels: [...d.labels], pinned: false }] };
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
  const setFilter = (value: string[]) => (s = { ...s, filter: value as LabelId[] });
  const pin = (note: Note) => (s = { ...s, notes: s.notes.map((n) => (n === note ? { ...n, pinned: !n.pinned } : n)) });

  const shownCount = $derived(visible(s).length);
  const pinnedNotes = $derived(visible(s).filter((n) => n.pinned));
  const otherNotes = $derived(visible(s).filter((n) => !n.pinned));
</script>

<section class="notes">
  <div class="notes__bar">
    <Search placeholder="Search notes" oninput={(e) => (s = { ...s, query: e.detail.value })} />
    <ButtonGroup kind="connected" selection="single" required value={s.view} onchange={(e) => (s = { ...s, view: e.detail.value === "list" ? "list" : "grid" })}>
      <ButtonGroupItem icon={GRID_ICON} value="grid" ariaLabel="Grid view" />
      <ButtonGroupItem icon={LIST_ICON} value="list" ariaLabel="List view" />
    </ButtonGroup>
  </div>
  <Chips value={s.filter.join(",")} onchange={(e) => setFilter(e.detail.value)}>
    {#each LABELS as l (l.value)}
      <Chip label={l.text} value={l.value} />
    {/each}
  </Chips>
  <output class="notes__status" role="status">{status(s)}</output>
  {#if shownCount === 0}
    <p class="notes__empty">No notes match.</p>
  {:else}
  {#if pinnedNotes.length > 0}
    <section class="notes__section">
      <h2>Pinned</h2>
      <div class="notes__grid {s.view}">
        {#each pinnedNotes as note (note.id)}
          <Card headline={note.title}>
            {#snippet headerAction()}
              <IconButton toggle selected={note.pinned} icon={PIN_ICON} ariaLabel={`Pin ${note.title}`} onchange={() => pin(note)} />
            {/snippet}
            <p>{note.text}</p>
            {#if note.labels.length > 0}
              <Chips value={s.filter.join(",")} onchange={(e) => setFilter(e.detail.value)}>
                {#each note.labels as id (id)}
                  <Chip label={labelOf(id)} value={id} />
                {/each}
              </Chips>
            {/if}
            {#snippet actions()}
              <div class="notes__card-actions">
                <Button variant="text" ariaLabel={`Open ${note.title}`} onclick={() => open(note)}>Open</Button>
                <IconButton icon={DELETE_ICON} ariaLabel={`Delete ${note.title}`} onclick={() => remove(note)} />
              </div>
            {/snippet}
          </Card>
        {/each}
      </div>
    </section>
  {/if}
  {#if otherNotes.length > 0}
  <section class="notes__section">
    <h2>Notes</h2>
      <div class="notes__grid {s.view}">
        {#each otherNotes as note (note.id)}
          <Card headline={note.title}>
            {#snippet headerAction()}
              <IconButton toggle selected={note.pinned} icon={PIN_ICON} ariaLabel={`Pin ${note.title}`} onchange={() => pin(note)} />
            {/snippet}
            <p>{note.text}</p>
            {#if note.labels.length > 0}
              <Chips value={s.filter.join(",")} onchange={(e) => setFilter(e.detail.value)}>
                {#each note.labels as id (id)}
                  <Chip label={labelOf(id)} value={id} />
                {/each}
              </Chips>
            {/if}
            {#snippet actions()}
              <div class="notes__card-actions">
                <Button variant="text" ariaLabel={`Open ${note.title}`} onclick={() => open(note)}>Open</Button>
                <IconButton icon={DELETE_ICON} ariaLabel={`Delete ${note.title}`} onclick={() => remove(note)} />
              </div>
            {/snippet}
          </Card>
        {/each}
      </div>
  </section>
  {/if}
  {/if}
  <ExtendedFab icon={ADD_ICON} ariaLabel="New note" onclick={() => open(null)}>New note</ExtendedFab>
  {#if narrow}
    <BottomSheet open={draft !== null} title={draft?.note ? "Edit note" : "New note"} onclose={() => (draft = null)}>
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
    <Dialog open={draft !== null} headline={draft?.note ? "Edit note" : "New note"} onclose={() => (draft = null)}>
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
