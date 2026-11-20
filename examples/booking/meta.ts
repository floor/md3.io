import type { ExampleMeta } from "../types";

export default {
  slug: "booking",
  title: "Booking",
  description: "A trip booking form in four steps, with a live total on every step, the same in every framework.",
  components: ["datepicker", "timepicker", "text-field", "select", "radios", "checkbox", "slider", "button", "dialog", "snackbar", "stepper"],
  tags: ["Apps", "Forms", "Travel"],
  about: [
    "Book a stay in four steps: dates and arrival, guests and room, extras, then your details with a review of the first three. The estimated total stays visible on every step, and material-addons' stepper shows the way through.",
    "Every tab above runs the same components. The HTML tab uses the web components directly; React, Vue, Svelte and Solid use the generated adapters around them; Vanilla uses the factories the elements are built on. The stepper is material-addons' in every variant.",
  ],
  how: [
    "The stepper runs the four steps in linear mode: its headers show each step and the completed ones behind it, each step's heading says \"Step n of 4\", and moving between steps puts focus on that heading. Next validates the step it leaves — through the stepper's validation pipeline — and focuses the first field that needs fixing; Back never validates and never loses data. From the review, each Edit jumps back to its step.",
    "The date fields are material's date picker in its modal form, so the calendar icon opens the calendar; check-out's calendar starts at check-in, and an earlier check-out date moves back to check-in. The arrival field's clock icon opens material's time picker: a typed time is checked and normalized, the picker reopens at it, and a confirmed time writes back to the field.",
    "State is live in every variant: the total, the dialog summary and the price range all read the same shared state. The price range decides which rooms can be chosen — a room outside it gives way to the first room inside it, and when no rate fits, the range says so at its field and there is nothing to book. Book validates the name and email and shows the message under the field that needs fixing.",
  ],
} satisfies ExampleMeta;
