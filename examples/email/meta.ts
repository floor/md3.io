import type { ExampleMeta } from "../types";

export default {
  slug: "email",
  title: "Email",
  description: "An inbox with a navigation rail, a searchable message list and a reading pane, the same app in every framework.",
  components: ["navigation-rail", "search", "chips", "checkbox", "icon-button", "button", "extended-fab", "text-field", "dialog", "snackbar"],
  about: [
    "A small email client: a navigation rail with Inbox, Starred, Sent and Drafts (with badges where they count), a message list with stars and checkboxes, and a reading pane with Reply, Archive and Delete. The search field filters by sender, subject and snippet, and the label chips narrow the list to Work, Personal or Travel.",
    "Compose opens a dialog whose Send adds the message to Sent and confirms with a snackbar; Reply pre-fills it. On a narrow frame the list and the message are one pane at a time with a back action; from a tablet up they sit side by side.",
  ],
  how: [
    "One shared module (<code>shared.ts</code>) holds the messages, the state and every transition — opening, starring, selecting, archiving, sending — so the six variants render and behave identically; <code>check.ts</code> proves it.",
    "The rail's badges, the list rows and the reading pane are re-rendered from the state on every change. The dialog and the snackbar live in the top layer; the layouts swap panes in CSS at 840px.",
  ],
} satisfies ExampleMeta;
