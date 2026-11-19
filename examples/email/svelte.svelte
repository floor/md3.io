<!-- Svelte: material/svelte wraps the same elements; $state mirrors the shared one. -->
<script lang="ts">
  import { tick as flush } from "svelte";
  import {
    Button, Checkbox, Chip, Chips, Dialog, ExtendedFab, IconButton,
    NavigationRail, NavigationRailItem, Search, Snackbar, TextField,
  } from "material/svelte";
  import {
    ARCHIVE_LABEL, BACK_LABEL, CHIPS_LABEL, CLEAR_LABEL, COMPOSE_HEADLINE, DELETE_LABEL, EMPTY_DETAIL,
    FOLDERS, LABELS, RAIL_LABEL, ROWS_LABEL, SEARCH_PLACEHOLDER, SENT_TEXT, STAR_LABEL,
    archiveChecked, archiveOpen, anyArchiveable, archiveable, badgeFor, canSend, clearChecked, closeCompose, deleteChecked, deleteOpen,
    emptyText, findMessage, captureFocus, focusHeading, focusList, focusRow, goBack, icons, initialState, mailbox,
    openCompose, openMessage, replyToOpen, selectLabel, selectionText, sendDraft, setFolder, setLabel,
    setQuery, toggleChecked, toggleStar, visibleMessages,
    type FolderId, type MailState, type Message,
  } from "./shared";

  const messages = mailbox();
  let s = $state<MailState>(initialState());
  let dialog: { element: HTMLElement & { show(): void; close(): void } } | undefined = $state();
  let snackbar: { element: HTMLElement & { show(): void } } | undefined = $state();

  // Mutations (star, archive, delete, send) change the mailbox; tick re-reads it.
  let tick = $state(0);
  const update = (fn: () => void) => {
    fn();
    tick++;
  };
  const badges = $derived.by(() => {
    void tick;
    return Object.fromEntries(FOLDERS.map((f) => [f.id, badgeFor(messages, f.id)]));
  });
  const visible = $derived.by(() => {
    void tick;
    return visibleMessages(messages, s);
  });
  const open = $derived.by(() => {
    void tick;
    return findMessage(messages, s.open);
  });

  const showDialog = (fn: () => void) => {
    fn();
    dialog?.element.show();
  };
  const send = () =>
    update(() => {
      sendDraft(s, messages);
      dialog?.element.close();
      snackbar?.element.show();
    });

  // Focus moves after the re-render: to the heading on open, back to the row on
  // Back, to the list when the open message leaves.
  const openRow = async (m: Message) => {
    update(() => openMessage(s, messages, m.id));
    await flush();
    focusHeading();
  };
  const back = async () => {
    const id = s.open;
    goBack(s);
    await flush();
    if (id) focusRow(id);
  };
  const closeOpenMessage = async (fn: (s: MailState, messages: Message[]) => void) => {
    update(() => fn(s, messages));
    await flush();
    focusList();
  };
  // When the focused control can leave the DOM (a row unstarred out of Starred, an
  // emptied selection bar), focus moves to its twin, its neighbour, or the list.
  const act = async (fn: () => void) => {
    const restore = captureFocus();
    fn();
    await flush();
    restore();
  };
</script>

<section class="mail" data-reading={String(s.reading)}>
  <NavigationRail ariaLabel={RAIL_LABEL} value={s.folder} onchange={(e: CustomEvent<{ value: string }>) => setFolder(s, e.detail.value as FolderId)}>
    {#each FOLDERS as f (f.id)}
      <NavigationRailItem value={f.id} label={f.label} icon={f.icon} selectedIcon={f.activeIcon}
        badge={badges[f.id]?.badge} badgeLabel={badges[f.id]?.label} />
    {/each}
  </NavigationRail>
  <div class="mail__main">
    <div class="mail__list-pane">
      <header class="mail__top">
        <Search placeholder={SEARCH_PLACEHOLDER} noExpandOnFocus fullWidth oninput={(e: CustomEvent<{ value: string }>) => setQuery(s, messages, e.detail.value)} />
        <Chips ariaLabel={CHIPS_LABEL} selection="single" onchange={(e: CustomEvent<{ value: string | null }>) => setLabel(s, messages, e.detail.value ?? null)}>
          {#each LABELS as l (l.id)}
            <Chip value={l.id} label={l.label} />
          {/each}
        </Chips>
      </header>
      <div class="mail__selection">
        {#if s.checked.length}
          <IconButton icon={icons.close} ariaLabel={CLEAR_LABEL} onclick={() => act(() => clearChecked(s))} />
          <span class="mail__selection-count mtrl-label-large">{selectionText(s.checked.length)}</span>
          <!-- Archive only where it can act: the selection holds an unarchived inbox message. -->
          {#if anyArchiveable(messages, s.checked)}
            <IconButton icon={icons.archive} ariaLabel={ARCHIVE_LABEL} onclick={() => act(() => update(() => archiveChecked(s, messages)))} />
          {/if}
          <IconButton icon={icons.delete} ariaLabel={DELETE_LABEL} onclick={() => act(() => update(() => deleteChecked(s, messages)))} />
        {/if}
      </div>
      <ul class="mail__rows" aria-label={ROWS_LABEL} tabindex="-1">
        {#if !visible.length}
          <li class="mail__empty mtrl-body-medium">{emptyText(s)}</li>
        {/if}
        {#each visible as m (m.id)}
          <li class="mail-row" data-id={m.id} data-unread={m.unread || undefined} data-open={s.open === m.id || undefined}>
            <Checkbox class="mail-row__check" ariaLabel={selectLabel(m)} checked={s.checked.includes(m.id)} onchange={() => toggleChecked(s, m.id)} />
            <button type="button" class="mail-row__open" aria-pressed={s.open === m.id} onclick={() => openRow(m)}>
              <span class="mail-row__sender mtrl-label-large">{m.from}</span>
              <span class="mail-row__subject mtrl-body-medium">{m.subject}</span>
              <span class="mail-row__snippet mtrl-body-small">{m.snippet}</span>
              <span class="mail-row__time mtrl-body-small">{m.time}</span>
            </button>
            <IconButton class="mail-row__star" toggle icon={icons.star} selectedIcon={icons.starFill}
              selected={m.starred} ariaLabel={STAR_LABEL} onchange={() => act(() => update(() => toggleStar(s, messages, m.id)))} />
          </li>
        {/each}
      </ul>
    </div>
    <div class="mail__detail-pane">
      {#if !open}
        <div class="mail__placeholder mtrl-body-medium">{EMPTY_DETAIL}</div>
      {:else}
        <article class="mail-message">
          <header class="mail-message__head">
            <IconButton class="mail-message__back" icon={icons.back} ariaLabel={BACK_LABEL} onclick={back} />
            <h2 class="mail-message__subject mtrl-title-large" tabindex="-1">{open.subject}</h2>
          </header>
          <p class="mail-message__meta mtrl-title-small">{open.from} · {open.address}</p>
          {#if open.to}
            <p class="mail-message__to mtrl-body-small">To {open.to}</p>
          {/if}
          <p class="mail-message__date mtrl-body-small">{open.date}</p>
          <div class="mail-message__body mtrl-body-medium">
            {#each open.body as p, i (i)}
              <p>{p}</p>
            {/each}
          </div>
          <footer class="mail-message__actions">
            <Button variant="outlined" icon={icons.reply} onclick={() => showDialog(() => replyToOpen(s, messages))}>Reply</Button>
            {#if archiveable(open)}
              <Button variant="outlined" icon={icons.archive} onclick={() => closeOpenMessage(archiveOpen)}>{ARCHIVE_LABEL}</Button>
            {/if}
            <Button variant="outlined" icon={icons.delete} onclick={() => closeOpenMessage(deleteOpen)}>{DELETE_LABEL}</Button>
          </footer>
        </article>
      {/if}
    </div>
  </div>
  <ExtendedFab class="mail__compose" icon={icons.edit} onclick={() => showDialog(() => openCompose(s))}>Compose</ExtendedFab>
  <Dialog bind:this={dialog} class="mail-compose" headline={COMPOSE_HEADLINE} onclose={() => closeCompose(s)}>
    <div class="mail-compose__fields">
      <TextField bind:value={s.draft.to} label="To" variant="outlined" />
      <TextField bind:value={s.draft.subject} label="Subject" variant="outlined" />
      <TextField bind:value={s.draft.message} label="Message" variant="outlined" type="multiline" />
    </div>
    {#snippet actions()}
      <Button variant="text" onclick={() => { closeCompose(s); dialog?.element.close(); }}>Cancel</Button>
      <Button disabled={!canSend(s.draft)} onclick={send}>Send</Button>
    {/snippet}
  </Dialog>
  <Snackbar bind:this={snackbar} message={SENT_TEXT} />
</section>
