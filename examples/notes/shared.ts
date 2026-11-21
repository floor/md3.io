// The state every variant of this example shares, the notes it starts from, and
// how the state is described. check.ts drives it, and check-examples compares
// what each framework shows.
export type LabelId = "ideas" | "shopping" | "work" | "travel";
export type Category = "all" | "pinned" | LabelId;

const HOUR = 60 * 60 * 1000;
const DEMO_NOW = Date.UTC(2026, 10, 20, 12);
const TODAY = Date.UTC(2026, 10, 20);
const YESTERDAY = Date.UTC(2026, 10, 19);
const THIS_WEEK = Date.UTC(2026, 10, 16);
const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export const LABELS: { value: LabelId; text: string }[] = [
  { value: "ideas", text: "Ideas" },
  { value: "shopping", text: "Shopping" },
  { value: "work", text: "Work" },
  { value: "travel", text: "Travel" },
];

export interface Note {
  id: string;
  title: string;
  text: string;
  labels: LabelId[];
  pinned: boolean;
  editedAt: number;
}

export const SEED_NOTES: Note[] = [
  { id: "sauce", title: "Pasta sauce", text: "Fry garlic in olive oil, add torn tomatoes, simmer twenty minutes. Basil at the end.", labels: ["ideas"], pinned: false, editedAt: DEMO_NOW - 2 * HOUR },
  { id: "groceries", title: "Weekend groceries", text: "Bread, oat milk, lemons, coffee, the good chocolate.", labels: ["shopping"], pinned: false, editedAt: DEMO_NOW - 26 * HOUR },
  { id: "meeting", title: "Meeting points", text: "Roadmap, hiring plan, support queue. Write down every decision.", labels: ["work"], pinned: true, editedAt: DEMO_NOW - 4 * HOUR },
  { id: "packing", title: "Packing list", text: "Two shirts, one warm layer, charger, toothbrush, passport.", labels: ["travel", "shopping"], pinned: true, editedAt: DEMO_NOW - 28 * HOUR },
  { id: "gifts", title: "Gift ideas", text: "A plant for the balcony, a cookbook for the baker, ink for the letter writer.", labels: ["ideas"], pinned: false, editedAt: DEMO_NOW - 30 * HOUR },
  { id: "walk", title: "City walk route", text: "Bridge, old square, river bank, market on the way back.", labels: ["travel"], pinned: false, editedAt: DEMO_NOW - 56 * HOUR },
  { id: "priorities", title: "Week priorities", text: "Ship the release notes, review the open pulls, plan Friday morning.", labels: ["work"], pinned: false, editedAt: DEMO_NOW - 8 * HOUR },
  { id: "prompts", title: "Story prompts", text: "A lighthouse that answers letters. A market that only opens at dusk.", labels: ["ideas"], pinned: false, editedAt: DEMO_NOW - 121 * HOUR },
  { id: "borrow", title: "Books to borrow", text: "The gardening one, the poetry anthology, the train atlas.", labels: ["shopping"], pinned: false, editedAt: DEMO_NOW - 192 * HOUR },
  { id: "repairs", title: "Flat repairs", text: "Fix the kitchen drawer, replace the hall bulb, defrost the freezer.", labels: ["work"], pinned: false, editedAt: DEMO_NOW - 75 * HOUR },
  { id: "sourdough", title: "Sourdough steps", text: "Feed the starter tonight, shape in the morning, bake with steam.", labels: ["ideas"], pinned: false, editedAt: DEMO_NOW - 3 * HOUR },
];

export interface State {
  notes: Note[];
  category: Category;
  query: string;
  view: "grid" | "list";
}

export const DEFAULTS: State = {
  notes: SEED_NOTES.map((note) => ({ ...note, labels: [...note.labels] })),
  category: "all",
  query: "",
  view: "grid",
};

export const categoryLabels = (category: Category): LabelId[] =>
  category === "all" || category === "pinned" ? [] : [category];

export const labelOf = (id: LabelId): string => LABELS.find((l) => l.value === id)!.text;

const inCategory = (note: Note, category: Category): boolean => {
  if (category === "all") return true;
  if (category === "pinned") return note.pinned;
  return note.labels.includes(category);
};

export const categoryItems = (s: State) => [
  { id: "all", label: "All notes" },
  { id: "pinned", label: "Pinned" },
  ...LABELS.map(({ value, text }) => ({ id: value, label: text })),
].map(({ id, label }) => ({
  id: id as Category,
  label,
  badge: String(s.notes.filter(note => inCategory(note, id as Category)).length),
}));

export const visible = (s: State): Note[] => {
  const query = s.query.trim().toLowerCase();
  return s.notes.filter(note => inCategory(note, s.category) &&
    `${note.title} ${note.text}`.toLowerCase().includes(query))
    .sort((left, right) => right.editedAt - left.editedAt);
};

const recency = (note: Note): string => {
  if (note.pinned) return "Pinned";
  if (note.editedAt >= TODAY) return "Today";
  if (note.editedAt >= YESTERDAY) return "Yesterday";
  if (note.editedAt >= THIS_WEEK) return "Earlier this week";
  return "Older";
};

export const noteGroups = (notes: Note[]) => ["Pinned", "Today", "Yesterday", "Earlier this week", "Older"]
  .map(title => ({ title, notes: notes.filter(note => recency(note) === title) }))
  .filter(group => group.notes.length > 0);

export const nextEdit = (notes: Note[]): number =>
  notes.reduce((latest, note) => Math.max(latest, note.editedAt + 1), DEMO_NOW);

export function editedLabel(editedAt: number): string {
  if (editedAt < TODAY) return date.format(editedAt);
  const hours = Math.floor(Math.max(0, DEMO_NOW - editedAt) / HOUR);
  if (hours === 0) return "Edited just now";
  return `Edited ${hours} ${hours === 1 ? "hour" : "hours"} ago`;
}

/** A saved note with no title still has a name, so the card stays a control. */
export function noteTitle(value: string): string {
  const title = value.trim();
  return title.length > 0 ? title : "Untitled note";
}

export function emptyLabel(s: State): string {
  if (s.query.trim()) return "No notes match your search.";
  if (s.category === "all") return "No notes yet.";
  if (s.category === "pinned") return "No pinned notes yet.";
  return `No notes in ${labelOf(s.category)} yet`;
}

export const status = (s: State): string => `Showing ${visible(s).length} of ${s.notes.length} notes.`;

export const isCompact = (container: HTMLElement): boolean => container.getBoundingClientRect().width < 600;

export function observeCompact(container: HTMLElement, update: (compact: boolean) => void): () => void {
  let compact = isCompact(container);
  update(compact);
  const observer = new ResizeObserver(() => {
    const next = isCompact(container);
    if (next === compact) return;
    compact = next;
    update(next);
  });
  observer.observe(container);
  return () => observer.disconnect();
}

// The icons the interface uses, as the components take them: Material Symbols
// (Apache 2.0, fonts.google.com/icons), the same files scripts/icons.ts fetches.
export const ADD_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true"><path d="M440-440H240q-17 0-28.5-11.5T200-480q0-17 11.5-28.5T240-520h200v-200q0-17 11.5-28.5T480-760q17 0 28.5 11.5T520-720v200h200q17 0 28.5 11.5T760-480q0 17-11.5 28.5T720-440H520v200q0 17-11.5 28.5T480-200q-17 0-28.5-11.5T440-240v-200Z"/></svg>';
export const GRID_ICON = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor" aria-hidden="true"><path d="M120-520v-320h320v320H120Zm0 400v-320h320v320H120Zm400-400v-320h320v320H520Zm0 400v-320h320v320H520Z"/></svg>';
export const LIST_ICON = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor" aria-hidden="true"><path d="M360-680v-80h480v80H360Zm0 240v-80h480v80H360Zm0 240v-80h480v80H360ZM200-680q-17 0-28.5-11.5T160-720q0-17 11.5-28.5T200-760q17 0 28.5 11.5T240-720q0 17-11.5 28.5T200-680Zm0 240q-17 0-28.5-11.5T160-480q0-17 11.5-28.5T200-520q17 0 28.5 11.5T240-480q0 17-11.5 28.5T200-440Zm0 240q-17 0-28.5-11.5T160-240q0-17 11.5-28.5T200-280q17 0 28.5 11.5T240-240q0 17-11.5 28.5T200-200Z"/></svg>';
export const MENU_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true"><path d="M160-240q-17 0-28.5-11.5T120-280q0-17 11.5-28.5T160-320h640q17 0 28.5 11.5T840-280q0 17-11.5 28.5T800-240H160Zm0-200q-17 0-28.5-11.5T120-480q0-17 11.5-28.5T160-520h640q17 0 28.5 11.5T840-480q0 17-11.5 28.5T800-440H160Zm0-200q-17 0-28.5-11.5T120-680q0-17 11.5-28.5T160-720h640q17 0 28.5 11.5T840-680q0 17-11.5 28.5T800-640H160Z"/></svg>';
export const SEARCH_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true"><path d="M380-320q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l224 224q11 11 11 28t-11 28q-11 11-28 11t-28-11L532-372q-30 24-69 38t-83 14Zm0-80q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg>';
export const CLOSE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true"><path d="M480-424 284-228q-11 11-28 11t-28-11q-11-11-11-28t11-28l196-196-196-196q-11-11-11-28t11-28q11-11 28-11t28 11l196 196 196-196q11-11 28-11t28 11q11 11 11 28t-11 28L536-480l196 196q11 11 11 28t-11 28q-11 11-28 11t-28-11L480-424Z"/></svg>';
export const MORE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>';
