// The example's page: title, description, the components it uses, and the side
// panel's two lists. Copy this folder, then change the slug here to the new
// folder's name — lower case, hyphens only.
import type { ExampleMeta } from "../types";

export default {
  slug: "_template",
  title: "Notify",
  description: "A card, a switch and a button working together, the same screen in every framework.",
  components: ["card", "switch", "button"],
  tags: ["Apps"],
  about: [
    "One card with a switch and a Save button: the smallest shape an example takes. Save reads the state back in a status line.",
    "Every tab above runs the same components. The HTML tab uses the web components directly; React, Vue, Svelte and Solid use the generated adapters around them; Vanilla uses the factories the elements are built on.",
  ],
  how: [
    "Switch state is live: <code>checked</code> in React and Solid, <code>v-model</code> in Vue, <code>bind:checked</code> in Svelte, the <code>checked</code> property on the element.",
    "Save describes the state with <code>summary()</code> from <code>shared.ts</code>, so every framework says the same thing.",
  ],
} satisfies ExampleMeta;
