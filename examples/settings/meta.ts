import type { ExampleMeta } from "../types";

export default {
  slug: "settings",
  title: "Settings",
  description: "Tabs, switches and buttons working together, the same screen in every framework.",
  components: ["tabs", "switch", "button"],
  about: [
    "A settings screen: two tabs, five switches and two buttons. Airplane mode disables Wi-Fi and Bluetooth; Save reads the state back, Reset restores the defaults.",
    "Every tab above runs the same components. The HTML tab uses the web components directly; React, Vue, Svelte and Solid use the generated adapters around them; Vanilla uses the factories the elements are built on.",
  ],
  how: [
    "Switch state is live: <code>checked</code> in React and Solid, <code>v-model</code> in Vue, <code>bind:checked</code> in Svelte, the <code>checked</code> property on the element.",
    "The tabs report the selected value in their <code>change</code> event; the page shows the matching panel.",
  ],
} satisfies ExampleMeta;
