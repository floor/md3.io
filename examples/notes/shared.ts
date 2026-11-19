// The state every variant of this example shares, the notes it starts from, and
// how the state is described. check.ts drives it, and check-examples compares
// what each framework shows.
export type LabelId = "ideas" | "shopping" | "work" | "travel";

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
}

export const SEED_NOTES: Note[] = [
  { id: "sauce", title: "Pasta sauce", text: "Fry garlic in olive oil, add torn tomatoes, simmer twenty minutes. Basil at the end.", labels: ["ideas"], pinned: false },
  { id: "groceries", title: "Weekend groceries", text: "Bread, oat milk, lemons, coffee, the good chocolate.", labels: ["shopping"], pinned: false },
  { id: "meeting", title: "Meeting points", text: "Roadmap, hiring plan, support queue. Write down every decision.", labels: ["work"], pinned: true },
  { id: "packing", title: "Packing list", text: "Two shirts, one warm layer, charger, toothbrush, passport.", labels: ["travel", "shopping"], pinned: true },
  { id: "gifts", title: "Gift ideas", text: "A plant for the balcony, a cookbook for the baker, ink for the letter writer.", labels: ["ideas"], pinned: false },
  { id: "walk", title: "City walk route", text: "Bridge, old square, river bank, market on the way back.", labels: ["travel"], pinned: false },
  { id: "priorities", title: "Week priorities", text: "Ship the release notes, review the open pulls, plan Friday morning.", labels: ["work"], pinned: false },
  { id: "prompts", title: "Story prompts", text: "A lighthouse that answers letters. A market that only opens at dusk.", labels: ["ideas"], pinned: false },
  { id: "borrow", title: "Books to borrow", text: "The gardening one, the poetry anthology, the train atlas.", labels: ["shopping"], pinned: false },
  { id: "repairs", title: "Flat repairs", text: "Fix the kitchen drawer, replace the hall bulb, defrost the freezer.", labels: ["work"], pinned: false },
  { id: "sourdough", title: "Sourdough steps", text: "Feed the starter tonight, shape in the morning, bake with steam.", labels: ["ideas"], pinned: false },
];

export interface State {
  notes: Note[];
  filter: LabelId[];
  query: string;
  view: "grid" | "list";
}

export const DEFAULTS: State = {
  notes: SEED_NOTES.map((note) => ({ ...note, labels: [...note.labels] })),
  filter: [],
  query: "",
  view: "grid",
};

export const labelOf = (id: LabelId): string => LABELS.find((l) => l.value === id)!.text;

/** The notes the grid shows: the filter's labels, then the search's words. */
export const visible = (s: State): Note[] =>
  s.notes.filter(
    (n) =>
      (s.filter.length === 0 || n.labels.some((l) => s.filter.includes(l))) &&
      (s.query === "" || `${n.title} ${n.text}`.toLowerCase().includes(s.query.toLowerCase())),
  );

export const status = (s: State): string => `Showing ${visible(s).length} of ${s.notes.length} notes.`;

// The icons the interface uses, as the components take them: Material Symbols
// (Apache 2.0, fonts.google.com/icons), the same files scripts/icons.ts fetches.
export const ADD_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true"><path d="M440-440H240q-17 0-28.5-11.5T200-480q0-17 11.5-28.5T240-520h200v-200q0-17 11.5-28.5T480-760q17 0 28.5 11.5T520-720v200h200q17 0 28.5 11.5T760-480q0 17-11.5 28.5T720-440H520v200q0 17-11.5 28.5T480-200q-17 0-28.5-11.5T440-240v-200Z"/></svg>';
export const PIN_ICON = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor" aria-hidden="true"><path d="m640-480 80 80v80H520v240l-40 40-40-40v-240H240v-80l80-80v-280h-40v-80h400v80h-40v280Zm-286 80h252l-46-46v-314H400v314l-46 46Zm126 0Z"/></svg>';
export const DELETE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true"><path d="M280-120q-33 0-56.5-23.5T200-200v-520q-17 0-28.5-11.5T160-760q0-17 11.5-28.5T200-800h160q0-17 11.5-28.5T400-840h160q17 0 28.5 11.5T600-800h160q17 0 28.5 11.5T800-760q0 17-11.5 28.5T760-720v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM428.5-291.5Q440-303 440-320v-280q0-17-11.5-28.5T400-640q-17 0-28.5 11.5T360-600v280q0 17 11.5 28.5T400-280q17 0 28.5-11.5Zm160 0Q600-303 600-320v-280q0-17-11.5-28.5T560-640q-17 0-28.5 11.5T520-600v280q0 17 11.5 28.5T560-280q17 0 28.5-11.5ZM280-720v520-520Z"/></svg>';
export const GRID_ICON = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor" aria-hidden="true"><path d="M120-520v-320h320v320H120Zm0 400v-320h320v320H120Zm400-400v-320h320v320H520Zm0 400v-320h320v320H520Z"/></svg>';
export const LIST_ICON = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor" aria-hidden="true"><path d="M360-680v-80h480v80H360Zm0 240v-80h480v80H360Zm0 240v-80h480v80H360ZM200-680q-17 0-28.5-11.5T160-720q0-17 11.5-28.5T200-760q17 0 28.5 11.5T240-720q0 17-11.5 28.5T200-680Zm0 240q-17 0-28.5-11.5T160-480q0-17 11.5-28.5T200-520q17 0 28.5 11.5T240-480q0 17-11.5 28.5T200-440Zm0 240q-17 0-28.5-11.5T160-240q0-17 11.5-28.5T200-280q17 0 28.5 11.5T240-240q0 17-11.5 28.5T200-200Z"/></svg>';
