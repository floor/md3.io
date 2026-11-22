import type { ExampleMeta } from "../types";

export default {
  slug: "notes",
  title: "Notes",
  description: "Browse notes by category, search them, and edit or pin them from the same app in every framework.",
  components: ["drawer", "app-bar", "menu", "card", "chips", "icon-button", "button-group", "extended-fab", "dialog", "bottom-sheet", "text-field", "snackbar", "search", "button"],
  tags: ["Apps", "Productivity"],
  about: [
    "Browse pinned notes and labels in the category drawer. Cards show when they were last edited, and the New note FAB stays available while you browse.",
    "Every tab runs the same components. HTML uses the web components directly. React, Vue, Svelte and Solid use generated adapters, and Vanilla uses the component factories.",
  ],
  how: [
    "The editor uses the same fields in a dialog on wide frames and a bottom sheet on narrow frames.",
    "The category drawer stays visible on wide frames and opens from the app bar on narrow frames. Search works within the selected category, and the most recently edited notes appear first in each section.",
    "Undo restores the deleted note. Pinning moves a note to the Pinned section.",
  ],
} satisfies ExampleMeta;
