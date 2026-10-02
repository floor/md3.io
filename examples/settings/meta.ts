import type { ExampleMeta } from "../types";

export default {
  slug: "settings",
  title: "Settings",
  description: "A settings app: categories, detail screens of switches and sliders, reset with undo.",
  variants: ["vanilla"],
  components: ["top-app-bar", "icon-button", "list", "switch", "slider", "button", "dialog", "snackbar"],
  about: [
    "A settings app: five categories as a list, one detail screen per category whose rows carry a switch or a slider, a reset that asks first, and a snackbar that can undo it. On a phone the detail replaces the list under a small top app bar with Back; from a 648 px window the two panes sit side by side.",
    "Two single-choice screens — Network &amp; internet's network type and Display's text size — are not built yet: the list cannot yet hold one radio per row with the row selecting it (FLO-581).",
    "The Vanilla tab is the reference, being written as the first case study. The five other variant files still hold the previous small screen (two tabs, five switches, two buttons); with variants declared they are no longer built or shown, and what happens to them is one of the owner's open questions.",
  ],
  how: [
    "Every setting is one row of the fixture in <code>data.ts</code>; its control is built from it and sits in the row's trailing slot, and the whole state is applied back to every control after each change.",
    "Airplane mode turns Wi-Fi and Bluetooth off and disables them while it is on — the one setting that reaches into others.",
    "Dark theme acts: on, the app carries the dark roles for its own subtree while the page around it stays as it is; off, the app follows the page's appearance.",
    "Reset takes a snapshot before resetting, so the snackbar's Undo can restore it. The snackbar has an action, so it stays until Undo or its close button.",
  ],
} satisfies ExampleMeta;
