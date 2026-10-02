import type { ExampleMeta } from "../types";

export default {
  slug: "settings",
  title: "Settings",
  description: "A settings app: categories, detail screens of switches, radios and sliders, reset with undo.",
  components: ["tabs", "switch", "button", "list", "radios", "slider", "dialog", "snackbar"],
  about: [
    "A settings app: five categories as a list, one detail screen per category with switches, radio groups and sliders, a reset that asks first, and a snackbar that can undo it. On a phone the detail replaces the list and Back returns to it; from 720 px the two sit side by side.",
    "The Vanilla tab is the reference, being written as the first case study. The other five tabs still run the previous small screen (two tabs, five switches, two buttons) until their ports are written; how a partly-ported example declares its variants is an open question with the owner.",
  ],
  how: [
    "Every setting is one row of the fixture in <code>data.ts</code>; its control is built from it, and the whole state is applied back to every control after each change.",
    "Airplane mode turns Wi-Fi and Bluetooth off and disables them while it is on — the one setting that reaches into others.",
    "Reset takes a snapshot before resetting, so the snackbar's Undo can restore it; the snackbar closes itself after 10 s.",
  ],
} satisfies ExampleMeta;
