// React: material/react wraps the same elements.
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  Button, Checkbox, Chips, Chip, Dialog, ExtendedFab, IconButton,
  NavigationRail, NavigationRailItem, Search, Snackbar, TextField,
} from "material/react";
import {
  ARCHIVE_LABEL, BACK_LABEL, CHIPS_LABEL, CLEAR_LABEL, COMPOSE_HEADLINE, DELETE_LABEL, EMPTY_DETAIL,
  FOLDERS, LABELS, RAIL_LABEL, ROWS_LABEL, SEARCH_PLACEHOLDER, SENT_TEXT, STAR_LABEL,
  archiveChecked, archiveOpen, badgeFor, canSend, clearChecked, closeCompose, deleteChecked, deleteOpen,
  emptyText, findMessage, focusHeading, focusList, focusRow, goBack, icons, initialState, mailbox,
  openCompose, openMessage, replyToOpen, selectLabel, selectionText, sendDraft, setFolder, setLabel,
  setQuery, toggleChecked, toggleStar, visibleMessages,
  type FolderId, type MailState, type Message,
} from "./shared";

const messages = mailbox();

export default function Email() {
  const [s, setS] = useState<MailState>(initialState);
  const [, bump] = useState(0);
  const dialog = useRef<(HTMLElement & { show(): void; close(): void }) | null>(null);
  const snackbar = useRef<(HTMLElement & { show(): void }) | null>(null);
  // Mutations (star, archive, delete, send) change the mailbox, not the state object.
  const update = (fn?: () => void) => {
    fn?.();
    bump((n) => n + 1);
  };
  const set = (fn: (draft: MailState) => void) => setS((prev) => {
    const next = { ...prev, checked: [...prev.checked], draft: { ...prev.draft } };
    fn(next);
    return next;
  });

  const open = findMessage(messages, s.open);
  const visible = visibleMessages(messages, s);
  // The dialog is always mounted; opening it is imperative, as in the other variants.
  // flushSync first, so the fields carry the new draft (the reply's prefill) when it opens.
  const showDialog = (fn: (draft: MailState) => void) => {
    flushSync(() => set(fn));
    dialog.current?.show();
  };
  // Focus moves after the re-render: to the heading on open, back to the row on Back,
  // to the list when the open message leaves.
  const openRow = (id: string) => {
    flushSync(() => update(() => openMessage(s, messages, id)));
    focusHeading();
  };
  const back = () => {
    const id = s.open;
    flushSync(() => set((d) => { goBack(d); }));
    if (id) focusRow(id);
  };
  const closeOpenMessage = (fn: (s: MailState, messages: Message[]) => void) => {
    flushSync(() => update(() => fn(s, messages)));
    focusList();
  };

  return (
    <section className="mail" data-reading={String(s.reading)}>
      <NavigationRail ariaLabel={RAIL_LABEL} value={s.folder}
        onChange={(e) => set((d) => { setFolder(d, e.detail.value as FolderId); })}>
        {FOLDERS.map((f) => {
          const badge = badgeFor(messages, f.id);
          return (
            <NavigationRailItem key={f.id} value={f.id} label={f.label} icon={f.icon} selectedIcon={f.activeIcon}
              badge={badge?.badge} badgeLabel={badge?.label} />
          );
        })}
      </NavigationRail>
      <div className="mail__main">
        <div className="mail__list-pane">
          <header className="mail__top">
            <Search placeholder={SEARCH_PLACEHOLDER} noExpandOnFocus fullWidth
              onInput={(e) => set((d) => { setQuery(d, messages, e.detail.value); })} />
            <Chips ariaLabel={CHIPS_LABEL} selection="single"
              onChange={(e) => set((d) => { setLabel(d, messages, e.detail.value ?? null); })}>
              {LABELS.map((l) => <Chip key={l.id} value={l.id} label={l.label} />)}
            </Chips>
          </header>
          <div className="mail__selection">
            {s.checked.length > 0 && (
              <>
                <IconButton icon={icons.close} ariaLabel={CLEAR_LABEL} onClick={() => set((d) => { clearChecked(d); })} />
                <span className="mail__selection-count">{selectionText(s.checked.length)}</span>
                <IconButton icon={icons.archive} ariaLabel={ARCHIVE_LABEL} onClick={() => update(() => archiveChecked(s, messages))} />
                <IconButton icon={icons.delete} ariaLabel={DELETE_LABEL} onClick={() => update(() => deleteChecked(s, messages))} />
              </>
            )}
          </div>
          <ul className="mail__rows" aria-label={ROWS_LABEL} tabIndex={-1}>
            {visible.length === 0 && <li className="mail__empty">{emptyText(s)}</li>}
            {visible.map((m: Message) => (
              <li key={m.id} className="mail-row" data-id={m.id} data-unread={m.unread || undefined} data-open={s.open === m.id || undefined}>
                <Checkbox className="mail-row__check" ariaLabel={selectLabel(m)} checked={s.checked.includes(m.id)}
                  onChange={() => set((d) => { toggleChecked(d, m.id); })} />
                <button type="button" className="mail-row__open" aria-pressed={s.open === m.id}
                  onClick={() => openRow(m.id)}>
                  <span className="mail-row__sender">{m.from}</span>
                  <span className="mail-row__subject">{m.subject}</span>
                  <span className="mail-row__snippet">{m.snippet}</span>
                  <span className="mail-row__time">{m.time}</span>
                </button>
                <IconButton className="mail-row__star" toggle icon={icons.star} selectedIcon={icons.starFill}
                  selected={m.starred} ariaLabel={STAR_LABEL}
                  onChange={() => update(() => toggleStar(s, messages, m.id))} />
              </li>
            ))}
          </ul>
        </div>
        <div className="mail__detail-pane">
          {!open && <div className="mail__placeholder">{EMPTY_DETAIL}</div>}
          {open && (
            <article className="mail-message">
              <header className="mail-message__head">
                <IconButton className="mail-message__back" icon={icons.back} ariaLabel={BACK_LABEL} onClick={back} />
                <h2 className="mail-message__subject" tabIndex={-1}>{open.subject}</h2>
              </header>
              <p className="mail-message__meta">{open.from} · {open.address}</p>
              {open.to && <p className="mail-message__to">To {open.to}</p>}
              <p className="mail-message__date">{open.date}</p>
              <div className="mail-message__body">{open.body.map((p, i) => <p key={i}>{p}</p>)}</div>
              <footer className="mail-message__actions">
                <Button variant="outlined" icon={icons.reply} onClick={() => showDialog((d) => { replyToOpen(d, messages); })}>Reply</Button>
                <Button variant="outlined" icon={icons.archive} onClick={() => closeOpenMessage(archiveOpen)}>{ARCHIVE_LABEL}</Button>
                <Button variant="outlined" icon={icons.delete} onClick={() => closeOpenMessage(deleteOpen)}>{DELETE_LABEL}</Button>
              </footer>
            </article>
          )}
        </div>
      </div>
      <ExtendedFab className="mail__compose" icon={icons.edit} onClick={() => showDialog((d) => { openCompose(d); })}>Compose</ExtendedFab>
      <Dialog ref={dialog} className="mail-compose" headline={COMPOSE_HEADLINE} onClose={() => set((d) => { closeCompose(d); })}>
        <div className="mail-compose__fields">
          <TextField label="To" variant="outlined" value={s.draft.to}
            onInput={(e) => set((d) => { d.draft.to = e.detail.value; })} />
          <TextField label="Subject" variant="outlined" value={s.draft.subject}
            onInput={(e) => set((d) => { d.draft.subject = e.detail.value; })} />
          <TextField label="Message" variant="outlined" type="multiline" value={s.draft.message}
            onInput={(e) => set((d) => { d.draft.message = e.detail.value; })} />
        </div>
        <Button slot="actions" variant="text" onClick={() => { set((d) => { closeCompose(d); }); dialog.current?.close(); }}>Cancel</Button>
        <Button slot="actions" disabled={!canSend(s.draft)}
          onClick={() => update(() => { sendDraft(s, messages); dialog.current?.close(); snackbar.current?.show(); })}>Send</Button>
      </Dialog>
      <Snackbar ref={snackbar} message={SENT_TEXT} />
    </section>
  );
}
