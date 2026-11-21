import type { ExampleMeta } from "../types";

export default {
  slug: "notes",
  title: "Notes",
  description: "A notes app with filters, search, an editor and undo, the same screen in every framework.",
  components: ["card", "chips", "icon-button", "button-group", "extended-fab", "dialog", "bottom-sheet", "text-field", "snackbar", "search", "button"],
  tags: ["Apps", "Productivity"],
  about: [
    "A notes app: a grid of note cards with labels and pins, a label filter, a search field, and an editor that opens from a card or from the New note button. Deleting shows a snackbar with Undo.",
    "Every tab above runs the same components. The HTML tab uses the web components directly; React, Vue, Svelte and Solid use the generated adapters around them; Vanilla uses the factories the elements are built on.",
  ],
  how: [
    "The editor is a dialog on a wide frame and a bottom sheet on a narrow one; the same fields go in either.",
    "The filter, the search and the view toggle narrow the grid; <code>shared.ts</code> decides what shows, so every framework shows the same notes.",
    "Delete keeps the note and where it was; Undo puts it back. Pinning moves a note to the Pinned section.",
  ],
} satisfies ExampleMeta;
