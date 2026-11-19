/** @jsxImportSource solid-js — this file's JSX is Solid's, not React's; tsc reads it. */
// Solid: material/solid wraps the same elements. The store changes through
// setS(produce(...)); the mailbox is a plain array, re-read when tick bumps.
import { createMemo, createSignal, For, Show } from "solid-js";
import { createStore, produce } from "solid-js/store";
import {
  Button, Checkbox, Chip, Chips, Dialog, ExtendedFab, IconButton,
  NavigationRail, NavigationRailItem, Search, Snackbar, TextField,
} from "material/solid";
import type { DialogElement, SnackbarElement } from "material/elements";
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

export default function Email() {
  const [s, setS] = createStore<MailState>(initialState());
  let dialog: DialogElement | undefined;
  let snackbar: SnackbarElement | undefined;

  const [tick, setTick] = createSignal(0);
  const update = (fn: (draft: MailState) => void) => {
    setS(produce(fn));
    setTick((n) => n + 1);
  };
  const badges = createMemo(() => {
    tick();
    return Object.fromEntries(FOLDERS.map((f) => [f.id, badgeFor(messages, f.id)]));
  });
  const visible = createMemo(() => {
    tick();
    return visibleMessages(messages, s);
  });
  const open = createMemo(() => {
    tick();
    return findMessage(messages, s.open);
  });
  // The dialog is always mounted; opening it is imperative, as in the other variants.
  const showDialog = (fn: (draft: MailState) => void) => {
    update(fn);
    dialog?.show();
  };
  // Focus moves after the state settles (Solid applies it synchronously): to the
  // heading on open, back to the row on Back, to the list when the open message leaves.
  const openRow = (id: string) => {
    update((d) => { openMessage(d, messages, id); });
    focusHeading();
  };
  const back = () => {
    const id = s.open;
    update((d) => { goBack(d); });
    if (id) focusRow(id);
  };
  const closeOpenMessage = (fn: (s: MailState, messages: Message[]) => void) => {
    update((d) => { fn(d, messages); });
    focusList();
  };
  // When the focused control can leave the DOM (a row unstarred out of Starred, an
  // emptied selection bar), focus moves to its twin, its neighbour, or the list.
  const act = (fn: () => void) => {
    const restore = captureFocus();
    fn();
    restore();
  };

  return (
    <section class="mail" data-reading={String(s.reading)}>
      <NavigationRail ariaLabel={RAIL_LABEL} value={s.folder}
        onChange={(e: CustomEvent<{ value: string }>) => update((d) => { setFolder(d, e.detail.value as FolderId); })}>
        <For each={FOLDERS}>
          {(f) => (
            <NavigationRailItem value={f.id} label={f.label} icon={f.icon} selectedIcon={f.activeIcon}
              badge={badges()[f.id]?.badge} badgeLabel={badges()[f.id]?.label} />
          )}
        </For>
      </NavigationRail>
      <div class="mail__main">
        <div class="mail__list-pane">
          <header class="mail__top">
            <Search placeholder={SEARCH_PLACEHOLDER} noExpandOnFocus fullWidth
              onInput={(e: CustomEvent<{ value: string }>) => update((d) => { setQuery(d, messages, e.detail.value); })} />
            <Chips ariaLabel={CHIPS_LABEL} selection="single"
              onChange={(e: CustomEvent<{ value: string | string[] | null }>) => update((d) => {
                const v = e.detail.value;
                setLabel(d, messages, Array.isArray(v) ? (v[0] ?? null) : v);
              })}>
              <For each={LABELS}>{(l) => <Chip value={l.id} label={l.label} />}</For>
            </Chips>
          </header>
          <div class="mail__selection">
            <Show when={s.checked.length > 0}>
              <IconButton icon={icons.close} ariaLabel={CLEAR_LABEL} onClick={() => act(() => update((d) => { clearChecked(d); }))} />
              <span class="mail__selection-count mtrl-label-large">{selectionText(s.checked.length)}</span>
              {/* Archive only where it can act: the selection holds an unarchived inbox message. */}
              <Show when={anyArchiveable(messages, s.checked)}>
                <IconButton icon={icons.archive} ariaLabel={ARCHIVE_LABEL} onClick={() => act(() => update((d) => { archiveChecked(d, messages); }))} />
              </Show>
              <IconButton icon={icons.delete} ariaLabel={DELETE_LABEL} onClick={() => act(() => update((d) => { deleteChecked(d, messages); }))} />
            </Show>
          </div>
          <ul class="mail__rows" aria-label={ROWS_LABEL} tabindex="-1">
            <Show when={visible().length === 0}>
              <li class="mail__empty mtrl-body-medium">{emptyText(s)}</li>
            </Show>
            <For each={visible()}>
              {(m: Message) => (
                <li class="mail-row" data-id={m.id} data-unread={m.unread || undefined} data-open={s.open === m.id || undefined}>
                  <Checkbox class="mail-row__check" ariaLabel={selectLabel(m)} checked={s.checked.includes(m.id)}
                    onChange={() => update((d) => { toggleChecked(d, m.id); })} />
                  <button type="button" class="mail-row__open" aria-pressed={s.open === m.id}
                    onClick={() => openRow(m.id)}>
                    <span class="mail-row__sender mtrl-label-large">{m.from}</span>
                    <span class="mail-row__subject mtrl-body-medium">{m.subject}</span>
                    <span class="mail-row__snippet mtrl-body-small">{m.snippet}</span>
                    <span class="mail-row__time mtrl-body-small">{m.time}</span>
                  </button>
                  <IconButton class="mail-row__star" toggle icon={icons.star} selectedIcon={icons.starFill}
                    selected={m.starred} ariaLabel={STAR_LABEL}
                    onChange={() => act(() => update((d) => { toggleStar(d, messages, m.id); }))} />
                </li>
              )}
            </For>
          </ul>
        </div>
        <div class="mail__detail-pane">
          <Show when={open()} fallback={<div class="mail__placeholder mtrl-body-medium">{EMPTY_DETAIL}</div>}>
            {(m) => (
              <article class="mail-message">
                <header class="mail-message__head">
                  <IconButton class="mail-message__back" icon={icons.back} ariaLabel={BACK_LABEL} onClick={back} />
                  <h2 class="mail-message__subject mtrl-title-large" tabindex="-1">{m().subject}</h2>
                </header>
                <p class="mail-message__meta mtrl-title-small">{m().from} · {m().address}</p>
                <Show when={m().to}>
                  <p class="mail-message__to mtrl-body-small">To {m().to}</p>
                </Show>
                <p class="mail-message__date mtrl-body-small">{m().date}</p>
                <div class="mail-message__body mtrl-body-medium">
                  <For each={m().body}>{(p) => <p>{p}</p>}</For>
                </div>
                <footer class="mail-message__actions">
                  <Button variant="outlined" icon={icons.reply} onClick={() => showDialog((d) => { replyToOpen(d, messages); })}>Reply</Button>
                  <Show when={archiveable(m())}>
                    <Button variant="outlined" icon={icons.archive} onClick={() => closeOpenMessage(archiveOpen)}>{ARCHIVE_LABEL}</Button>
                  </Show>
                  <Button variant="outlined" icon={icons.delete} onClick={() => closeOpenMessage(deleteOpen)}>{DELETE_LABEL}</Button>
                </footer>
              </article>
            )}
          </Show>
        </div>
      </div>
      <ExtendedFab class="mail__compose" icon={icons.edit} onClick={() => showDialog((d) => { openCompose(d); })}>Compose</ExtendedFab>
      <Dialog ref={dialog} class="mail-compose" headline={COMPOSE_HEADLINE} onClose={() => update((d) => { closeCompose(d); })}>
        <div class="mail-compose__fields">
          <TextField label="To" variant="outlined" value={s.draft.to}
            onInput={(e: CustomEvent<{ value: string }>) => setS("draft", "to", e.detail.value)} />
          <TextField label="Subject" variant="outlined" value={s.draft.subject}
            onInput={(e: CustomEvent<{ value: string }>) => setS("draft", "subject", e.detail.value)} />
          <TextField label="Message" variant="outlined" type="multiline" value={s.draft.message}
            onInput={(e: CustomEvent<{ value: string }>) => setS("draft", "message", e.detail.value)} />
        </div>
        <Button slot="actions" variant="text" onClick={() => { update((d) => { closeCompose(d); }); dialog?.close(); }}>Cancel</Button>
        <Button slot="actions" disabled={!canSend(s.draft)}
          onClick={() => { update((d) => { sendDraft(d, messages); }); dialog?.close(); snackbar?.show(); }}>Send</Button>
      </Dialog>
      <Snackbar ref={snackbar} message={SENT_TEXT} />
    </section>
  );
}
