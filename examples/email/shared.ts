// The data, state and behaviour every variant of this example shares. Anything the
// interface says or decides comes from here, so the six frameworks stay identical.
import inboxIcon from "../../icons/inbox.svg" with { type: "text" };
import inboxFillIcon from "../../icons/inbox-fill.svg" with { type: "text" };
import starIcon from "../../icons/star.svg" with { type: "text" };
import starFillIcon from "../../icons/star-fill.svg" with { type: "text" };
import sendIcon from "../../icons/send.svg" with { type: "text" };
import sendFillIcon from "../../icons/send-fill.svg" with { type: "text" };
import draftsIcon from "../../icons/drafts.svg" with { type: "text" };
import draftsFillIcon from "../../icons/drafts-fill.svg" with { type: "text" };
import editIcon from "../../icons/edit.svg" with { type: "text" };
import replyIcon from "../../icons/reply.svg" with { type: "text" };
import archiveIcon from "../../icons/archive.svg" with { type: "text" };
import deleteIcon from "../../icons/delete.svg" with { type: "text" };
import backIcon from "../../icons/arrow_back.svg" with { type: "text" };
import closeIcon from "../../icons/close.svg" with { type: "text" };

export const icons = {
  inbox: inboxIcon, inboxFill: inboxFillIcon,
  star: starIcon, starFill: starFillIcon,
  send: sendIcon, sendFill: sendFillIcon,
  drafts: draftsIcon, draftsFill: draftsFillIcon,
  edit: editIcon, reply: replyIcon, archive: archiveIcon, delete: deleteIcon,
  back: backIcon, close: closeIcon,
};

export interface Message {
  id: string;
  folder: "inbox" | "sent" | "drafts";
  from: string;
  address: string;
  /** Who the message went to, kept so Sent can show it. */
  to?: string;
  subject: string;
  snippet: string;
  body: string[];
  time: string;
  date: string;
  starred: boolean;
  unread: boolean;
  /** Archived mail leaves the Inbox but stays in the mailbox (and in Starred). */
  archived?: boolean;
  labels: string[];
}

const message = (id: string, m: Omit<Message, "id">): Message => ({ id, ...m });

// Invented people and companies, about a week of mail.
export const MESSAGES: Message[] = [
  message("m1", {
    folder: "inbox", from: "Lena Fischer", address: "lena@fernwick.example",
    subject: "Quarterly budget review", snippet: "The Q3 numbers are in — can you look them over before Thursday?",
    body: [
      "The Q3 numbers are in, and the hosting line is 12% over plan while print came in under. Could you look them over before Thursday's review?",
      "If the trend holds I will move the November offsite budget across to cover it. Let me know if you agree.",
    ],
    time: "9:41 AM", date: "Wednesday, November 18, 2026 at 9:41 AM",
    starred: false, unread: true, labels: ["work"],
  }),
  message("m2", {
    folder: "inbox", from: "Tomás Reyes", address: "tomas@papercrane.example",
    subject: "Flight itinerary to Lisbon", snippet: "Booked! Out on the 6:20 flight, back Sunday evening.",
    body: [
      "Booked! We leave on the 6:20 flight on Friday and come back Sunday evening. The confirmation code is LSB-4821.",
      "The apartment is ten minutes from the old town, so we can walk everywhere. I will send the check-in instructions closer to the date.",
    ],
    time: "8:15 AM", date: "Wednesday, November 18, 2026 at 8:15 AM",
    starred: true, unread: true, labels: ["travel"],
  }),
  message("m3", {
    folder: "inbox", from: "Priya Nair", address: "priya.nair@halcyon.example",
    subject: "Lunch on Friday?", snippet: "That new place on Cedar Street finally opened — want to try it?",
    body: [
      "That new place on Cedar Street finally opened and the menu looks great. Want to try it on Friday around noon?",
      "If Friday does not work, next Tuesday is good for me too.",
    ],
    time: "Yesterday", date: "Tuesday, November 17, 2026 at 6:02 PM",
    starred: false, unread: false, labels: ["personal"],
  }),
  message("m4", {
    folder: "inbox", from: "Asterfield Studio", address: "orders@asterfield.example",
    subject: "Your order has shipped", snippet: "Order ASF-20931 is on its way and should arrive Thursday.",
    body: [
      "Good news — order ASF-20931 is on its way. The courier expects to deliver on Thursday, November 19.",
      "You can follow the parcel with the tracking number in your account. No signature is needed.",
    ],
    time: "Yesterday", date: "Tuesday, November 17, 2026 at 2:47 PM",
    starred: false, unread: false, labels: ["personal"],
  }),
  message("m5", {
    folder: "inbox", from: "Jonas Lindqvist", address: "jonas@bramble.example",
    subject: "New mockups for the kiosk app", snippet: "Second round of screens is up, including the empty states you asked for.",
    body: [
      "The second round of screens is up in the shared folder, including the empty states you asked for and a first pass at the dark theme.",
      "Can you leave comments by Friday? I would like to lock the layout before the build starts.",
    ],
    time: "Yesterday", date: "Tuesday, November 17, 2026 at 11:20 AM",
    starred: false, unread: true, labels: ["work"],
  }),
  message("m6", {
    folder: "inbox", from: "Meadow & Pine", address: "hello@meadowpine.example",
    subject: "Weekend farmers market", snippet: "We are back at the harbour lot this Saturday, 8 to 1.",
    body: [
      "We are back at the harbour lot this Saturday from 8 to 1. The first winter squash is in, along with the last of the apples.",
      "As always, bring a bag and we will knock a little off the total.",
    ],
    time: "Monday", date: "Monday, November 16, 2026 at 9:00 AM",
    starred: false, unread: false, labels: ["personal"],
  }),
  message("m7", {
    folder: "inbox", from: "Aiko Tanabe", address: "aiko@kiteandfern.example",
    subject: "Conference talk slides", snippet: "Here is the deck from the Helsinki talk, plus the demo links.",
    body: [
      "Here is the deck from the Helsinki talk, plus the demo links I promised. The motion section starts at slide 40.",
      "Happy to do a shorter version for the team next month if there is interest.",
    ],
    time: "Nov 13", date: "Friday, November 13, 2026 at 4:35 PM",
    starred: true, unread: false, labels: ["work"],
  }),
  message("m8", {
    folder: "inbox", from: "Santiago Vidal", address: "santi@casaverde.example",
    subject: "Hostel booking confirmed", snippet: "Two beds in a six-bed dorm, December 3 to 7.",
    body: [
      "Confirmed: two beds in a six-bed dorm at Casa Verde, December 3 to 7. Check-in opens at 2 PM.",
      "They hold the beds until 8 PM, so the late bus is not a problem. Breakfast is included.",
    ],
    time: "Nov 12", date: "Thursday, November 12, 2026 at 7:58 PM",
    starred: false, unread: false, labels: ["travel"],
  }),
  message("m9", {
    folder: "inbox", from: "Nadia Sorokina", address: "nadia@letterpress.example",
    subject: "Book club: next pick", snippet: "Voting is open for December — three candidates this time.",
    body: [
      "Voting is open for the December pick. This time we have three candidates: a memoir, a slim novel and a essay collection.",
      "Cast your vote before Sunday so the order goes out in time.",
    ],
    time: "Nov 10", date: "Tuesday, November 10, 2026 at 8:12 PM",
    starred: false, unread: false, labels: ["personal"],
  }),
  message("m10", {
    folder: "drafts", from: "You", address: "you@mailbox.example",
    subject: "Ideas for the offsite", snippet: "Two days, one night — maybe the lake house again?",
    body: [
      "Two days, one night. Maybe the lake house again? Ask about the bigger room this time.",
    ],
    time: "Nov 15", date: "Sunday, November 15, 2026 at 10:30 AM",
    starred: false, unread: false, labels: ["work"],
  }),
  message("m11", {
    folder: "drafts", from: "You", address: "you@mailbox.example",
    subject: "Postcard from Porto", snippet: "Wish you were here — the tiles alone are worth the trip.",
    body: [
      "Wish you were here — the tiles alone are worth the trip. More when I am back.",
    ],
    time: "Nov 9", date: "Monday, November 9, 2026 at 5:44 PM",
    starred: false, unread: false, labels: ["travel"],
  }),
  message("m12", {
    folder: "sent", from: "You", address: "you@mailbox.example", to: "lena@fernwick.example",
    subject: "Re: Team offsite dates", snippet: "Either week works for me, with a slight preference for the 7th.",
    body: [
      "Either week works for me, with a slight preference for the week of the 7th. If we land on the 14th I will move my dentist appointment.",
    ],
    time: "Nov 11", date: "Wednesday, November 11, 2026 at 1:16 PM",
    starred: false, unread: false, labels: ["work"],
  }),
  message("m13", {
    folder: "sent", from: "You", address: "you@mailbox.example", to: "priya.nair@halcyon.example",
    subject: "Lease renewal documents", snippet: "Signed and attached — thanks for the quick turnaround.",
    body: [
      "Signed and attached. Thanks for the quick turnaround on the corrections.",
    ],
    time: "Nov 6", date: "Friday, November 6, 2026 at 3:29 PM",
    starred: true, unread: false, labels: ["personal"],
  }),
];

/** A fresh, mutable copy of the messages, so a reload restores them. */
export const mailbox = (): Message[] => MESSAGES.map((m) => ({ ...m, body: [...m.body], labels: [...m.labels] }));

export const FOLDERS = [
  { id: "inbox", label: "Inbox", icon: icons.inbox, activeIcon: icons.inboxFill },
  { id: "starred", label: "Starred", icon: icons.star, activeIcon: icons.starFill },
  { id: "sent", label: "Sent", icon: icons.send, activeIcon: icons.sendFill },
  { id: "drafts", label: "Drafts", icon: icons.drafts, activeIcon: icons.draftsFill },
] as const;
export type FolderId = (typeof FOLDERS)[number]["id"];

export const LABELS = [
  { id: "work", label: "Work" },
  { id: "personal", label: "Personal" },
  { id: "travel", label: "Travel" },
] as const;

export interface Draft {
  to: string;
  subject: string;
  message: string;
}

export interface MailState {
  folder: FolderId;
  label: string | null;
  query: string;
  open: string | null;
  checked: string[];
  reading: boolean;
  compose: boolean;
  draft: Draft;
}

export const initialState = (): MailState => ({
  folder: "inbox", label: null, query: "", open: null, checked: [], reading: false,
  compose: false, draft: { to: "", subject: "", message: "" },
});

// ---- Reading the state ----

export const findMessage = (messages: Message[], id: string | null): Message | undefined =>
  messages.find((m) => m.id === id);

const matches = (m: Message, query: string): boolean => {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [m.from, m.subject, m.snippet].some((text) => text.toLowerCase().includes(needle));
};

/** The rows the list shows: the folder (Starred gathers stars from everywhere, archived or not), then the label chip, then the search. */
export const visibleMessages = (messages: Message[], s: MailState): Message[] =>
  messages
    .filter((m) => {
      if (s.folder === "starred") return m.starred;
      if (s.folder === "inbox") return m.folder === "inbox" && !m.archived;
      return m.folder === s.folder;
    })
    .filter((m) => !s.label || m.labels.includes(s.label))
    .filter((m) => matches(m, s.query));

export const unreadCount = (messages: Message[]): number =>
  messages.filter((m) => m.folder === "inbox" && !m.archived && m.unread).length;

export const folderCount = (messages: Message[], folder: FolderId): number =>
  folder === "starred"
    ? messages.filter((m) => m.starred).length
    : messages.filter((m) => m.folder === folder && (folder !== "inbox" || !m.archived)).length;

/** A destination's badge, or null for none: unread in the Inbox, totals for Starred and Drafts. */
export const badgeFor = (messages: Message[], folder: FolderId): { badge: string; label: string } | null => {
  if (folder === "inbox") {
    const n = unreadCount(messages);
    return n ? { badge: String(n), label: `${n} unread` } : null;
  }
  if (folder === "starred" || folder === "drafts") {
    const n = folderCount(messages, folder);
    return n ? { badge: String(n), label: folder === "starred" ? `${n} starred` : `${n} drafts` } : null;
  }
  return null;
};

const folderName = (folder: FolderId): string => FOLDERS.find((f) => f.id === folder)!.label;
const labelName = (id: string): string => LABELS.find((l) => l.id === id)?.label ?? id;

/** What the list says when there is nothing to show. */
export const emptyText = (s: MailState): string => {
  const query = s.query.trim();
  if (query) return `No results for “${query}”.`;
  if (s.label) return `No ${labelName(s.label).toLowerCase()} messages in ${folderName(s.folder)}.`;
  return s.folder === "starred" ? "No starred messages." : `No messages in ${folderName(s.folder)}.`;
};

export const selectionText = (n: number): string => `${n} selected`;
export const selectLabel = (m: Message): string => `Select ${m.subject}`;
export const STAR_LABEL = "Star";
export const BACK_LABEL = "Back to list";
export const CLEAR_LABEL = "Clear selection";
export const ARCHIVE_LABEL = "Archive";
export const DELETE_LABEL = "Delete";
export const COMPOSE_HEADLINE = "New message";
export const EMPTY_DETAIL = "Select a message to read.";
export const SENT_TEXT = "Message sent";
export const RAIL_LABEL = "Mail";
export const SEARCH_PLACEHOLDER = "Search mail";
export const CHIPS_LABEL = "Labels";
export const ROWS_LABEL = "Messages";

// ---- Changing the state (every variant runs the same transitions) ----

export const openMessage = (s: MailState, messages: Message[], id: string): void => {
  s.open = id;
  s.reading = true;
  const m = findMessage(messages, id);
  if (m) m.unread = false;
};

export const goBack = (s: MailState): void => {
  s.reading = false;
};

export const setFolder = (s: MailState, folder: FolderId): void => {
  s.folder = folder;
  s.open = null;
  s.reading = false;
  s.checked = [];
};

export const setLabel = (s: MailState, messages: Message[], label: string | null): void => {
  s.label = label;
  pruneChecked(s, messages);
};

export const setQuery = (s: MailState, messages: Message[], query: string): void => {
  s.query = query;
  pruneChecked(s, messages);
};

export const toggleStar = (s: MailState, messages: Message[], id: string): void => {
  const m = findMessage(messages, id);
  if (m) m.starred = !m.starred;
  // Unstarring in Starred makes the row leave the view; the selection goes with it.
  pruneChecked(s, messages);
};

/** The selection only ever holds rows the list shows. */
export const pruneChecked = (s: MailState, messages: Message[]): void => {
  if (!s.checked.length) return;
  const visible = new Set(visibleMessages(messages, s).map((m) => m.id));
  s.checked = s.checked.filter((id) => visible.has(id));
};

export const toggleChecked = (s: MailState, id: string): void => {
  s.checked = s.checked.includes(id) ? s.checked.filter((c) => c !== id) : [...s.checked, id];
};

export const clearChecked = (s: MailState): void => {
  s.checked = [];
};

/** Closes the reading pane when the open message is no longer in the list. */
const closeIfHidden = (s: MailState, messages: Message[]): void => {
  if (s.open && !visibleMessages(messages, s).some((m) => m.id === s.open)) {
    s.open = null;
    s.reading = false;
  }
};

/** Delete is permanent: the messages leave the mailbox and any state pointing at them. */
const remove = (s: MailState, messages: Message[], ids: string[]): void => {
  for (let i = messages.length - 1; i >= 0; i--) if (ids.includes(messages[i]!.id)) messages.splice(i, 1);
  s.checked = s.checked.filter((id) => !ids.includes(id));
  closeIfHidden(s, messages);
};

/** Archive is an Inbox action: a message can leave the Inbox only if it is in it. */
export const archiveable = (m: Message): boolean => m.folder === "inbox" && !m.archived;

/** Whether anything in the selection would move — otherwise the bar hides Archive. */
export const anyArchiveable = (messages: Message[], ids: string[]): boolean =>
  ids.some((id) => {
    const m = findMessage(messages, id);
    return !!m && archiveable(m);
  });

/** Archive keeps the message: it leaves the Inbox, but Starred still gathers it. */
const archive = (s: MailState, messages: Message[], ids: string[]): void => {
  const eligible = ids.filter((id) => {
    const m = findMessage(messages, id);
    return !!m && archiveable(m);
  });
  if (!eligible.length) return;
  for (const m of messages) if (eligible.includes(m.id)) m.archived = true;
  s.checked = s.checked.filter((id) => !eligible.includes(id));
  pruneChecked(s, messages);
  closeIfHidden(s, messages);
};

export const archiveChecked = (s: MailState, messages: Message[]): void => archive(s, messages, [...s.checked]);
export const deleteChecked = (s: MailState, messages: Message[]): void => remove(s, messages, [...s.checked]);
export const archiveOpen = (s: MailState, messages: Message[]): void => { if (s.open) archive(s, messages, [s.open]); };
export const deleteOpen = (s: MailState, messages: Message[]): void => { if (s.open) remove(s, messages, [s.open]); };

export const openCompose = (s: MailState, draft?: Partial<Draft>): void => {
  s.compose = true;
  s.draft = { to: draft?.to ?? "", subject: draft?.subject ?? "", message: draft?.message ?? "" };
};

export const replyToOpen = (s: MailState, messages: Message[]): void => {
  const m = findMessage(messages, s.open);
  openCompose(s, m ? { to: m.from, subject: `Re: ${m.subject.replace(/^Re: /, "")}` } : {});
};

export const closeCompose = (s: MailState): void => {
  s.compose = false;
};

/** Whether the compose dialog's Send button is enabled. */
export const canSend = (draft: Draft): boolean => Boolean(draft.to.trim() && draft.message.trim());

/** Adds the draft to Sent and resets the composer. Returns the new message. */
export const sendDraft = (s: MailState, messages: Message[]): Message => {
  const next = Math.max(0, ...messages.map((m) => Number(m.id.slice(1)) || 0)) + 1;
  const body = s.draft.message.trim().split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const sent: Message = {
    id: `m${next}`,
    folder: "sent",
    from: "You",
    address: "you@mailbox.example",
    to: s.draft.to.trim(),
    subject: s.draft.subject.trim() || "(no subject)",
    snippet: snippetOf(body.join(" ")),
    body,
    time: "Just now",
    date: "Wednesday, November 18, 2026 at 9:58 PM",
    starred: false,
    unread: false,
    labels: [],
  };
  messages.push(sent);
  s.draft = { to: "", subject: "", message: "" };
  s.compose = false;
  return sent;
};

export const snippetOf = (text: string): string => (text.length > 80 ? `${text.slice(0, 77)}…` : text);

// ---- Focus (every variant moves focus the same way) ----

const focus = (selector: string): void => {
  document.querySelector<HTMLElement>(selector)?.focus();
};

/** Opening a message moves focus to its heading in the reading pane. */
export const focusHeading = (): void => focus(".mail-message__subject");
/** Back returns focus to the row the message was opened from. */
export const focusRow = (id: string): void => focus(`.mail-row[data-id="${id}"] .mail-row__open`);
/** When the open message leaves, focus lands on the list it came from. */
export const focusList = (): void => focus(".mail__rows");

const focusInto = (el: Element | null | undefined): boolean => {
  if (!el) return false;
  // The elements take focus on their host; the factories render a focusable control inside.
  ((el.querySelector("input, button") ?? el) as HTMLElement).focus();
  return true;
};

/**
 * Captures the focused control before an action and returns a restore for after the
 * DOM settles. If focus survived (the frameworks keep their keyed nodes), nothing
 * happens. If the control was rebuilt, its twin is focused. If the row left the
 * view, focus moves to the row that took its place; if the control's region is gone
 * (an emptied selection bar, a vanished list), focus lands on the list itself.
 */
export const captureFocus = (): (() => void) => {
  const active = document.activeElement as HTMLElement | null;
  if (!active || active === document.body || active === document.documentElement) return () => {};
  const part = ["mail-row__check", "mail-row__star", "mail-row__open"].find((c) => active.closest(`.${c}`));
  const row = active.closest<HTMLElement>(".mail-row");
  const id = row?.dataset.id;
  const index = row?.parentElement ? Array.prototype.indexOf.call(row.parentElement.children, row) : -1;
  return () => {
    const now = document.activeElement as HTMLElement | null;
    if (now && now !== document.body && now !== document.documentElement) return;
    if (part && id && focusInto(document.querySelector(`.mail-row[data-id="${id}"] .${part}`))) return;
    const rows = document.querySelector(".mail__rows");
    const next = index >= 0 && rows ? rows.children[Math.min(index, Math.max(0, rows.children.length - 1))] : undefined;
    if (next && focusInto(next.querySelector(".mail-row__open"))) return;
    (rows as HTMLElement | null)?.focus();
  };
};

/**
 * The vanilla and Web Components variants rebuild their rows on every change, which
 * replaces a focused row control and drops focus to the body. This refocuses the
 * rebuilt twin — or, when the action removed the row, its neighbour or the list.
 */
export const keepRowFocus = (fn: () => void): void => {
  const restore = captureFocus();
  fn();
  restore();
};
