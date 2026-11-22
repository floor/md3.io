import type { ExampleMeta } from "../types";

export default {
  slug: "email",
  title: "Email",
  description: "An inbox with a navigation rail, a mobile folder drawer, day-grouped messages with avatars and attachments, and a reading pane, the same app in every framework.",
  components: ["navigation-rail", "app-bar", "drawer", "search", "chips", "checkbox", "avatar", "icon-button", "button", "extended-fab", "text-field", "dialog", "snackbar"],
  tags: ["Apps", "Productivity"],
  about: [
    "A mail client: a navigation rail on wide frames and a app bar with a modal folder drawer on phones, a day-grouped message list (Today, Yesterday, Earlier) with sender avatars, attachment counts, stars and checkboxes, and a reading pane with Reply, Reply all, Archive and Delete.",
    "On wide frames the first unread message opens in the reading pane on load. Compose opens a dialog whose Send adds the message to Sent and confirms with a snackbar; Reply and Reply all pre-fill the recipients and subject.",
  ],
  how: [
    "One shared module (<code>shared.ts</code>) holds the messages, the state and every transition — opening, starring, selecting, archiving, replying to all, sending — so the six variants render and behave identically; <code>check.ts</code> proves it, asserting every step's outcome.",
    "Archive keeps a message (it leaves the Inbox but stays in Starred); Delete removes it for good. The selection only holds visible rows, and focus follows the pane that is shown. A container query on the example's own width swaps the mobile app bar and single-pane view for the navigation rail and side-by-side panes from the Tablet preset up.",
  ],
} satisfies ExampleMeta;
