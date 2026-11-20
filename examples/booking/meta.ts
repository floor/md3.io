import type { ExampleMeta } from "../types";

export default {
  slug: "booking",
  title: "Booking",
  description: "Booking a stay at a fictional house, in four steps, with a live price summary on every step, the same in every framework.",
  components: ["datepicker", "timepicker", "text-field", "select", "card", "checkbox", "button", "dialog", "snackbar", "stepper"],
  about: [
    "Book a stay at The Dune House, a fictional house in Alder Cove, in four steps: dates and arrival, guests and room, extras, then your details with a review of the first three. The price summary stays beside the stepper on wide frames and above it on mobile, and material-addons' stepper shows the way through. The hero and room pictures are generated SVG illustrations made for this example, so no photograph licence is needed.",
    "Every tab above runs the same components. The HTML tab uses the web components directly; React, Vue, Svelte and Solid use the generated adapters around them; Vanilla uses the factories the elements are built on. The stepper is material-addons' in every variant.",
  ],
  how: [
    "The stepper runs the four steps in linear mode: its headers show each step and the completed ones behind it, each step's heading says \"Step n of 4\", and moving between steps puts focus on that heading. Next validates the step it leaves — through the stepper's validation pipeline — and focuses the first field that needs fixing; Back never validates and never loses data. From the review, each Edit jumps back to its step.",
    "One date picker in range mode takes the stay: the first day is check-in, the second check-out, past dates cannot be chosen, and a range under one night blocks Next at the field. The arrival field's clock icon opens material's time picker: a typed time is checked and normalized, the picker reopens at it, and a confirmed time writes back to the field.",
    "The rooms are selectable material cards in a radio group: a click or Enter and Space chooses one, the arrow keys move the choice, and Home and End jump to the ends. There is no price slider — each card shows its own rate, and the summary panel adds rate × nights, extras, taxes and the cleaning fee into the total, live on every step. Book validates the name and email and shows the message under the field that needs fixing.",
  ],
} satisfies ExampleMeta;
