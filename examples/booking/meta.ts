import type { ExampleMeta } from "../types";

export default {
  slug: "booking",
  title: "Booking",
  description: "A trip booking form with dates, guests, room options and a live total, the same in every framework.",
  components: ["datepicker", "timepicker", "text-field", "select", "radios", "checkbox", "slider", "button", "dialog", "snackbar"],
  about: [
    "Book a stay: check-in and check-out dates, an arrival time, guest counts, a room type and extras, with a price range and a live estimated total. Booking opens a confirmation dialog with the summary, and confirming shows a snackbar.",
    "Every tab above runs the same components. The HTML tab uses the web components directly; React, Vue, Svelte and Solid use the generated adapters around them; Vanilla uses the factories the elements are built on.",
  ],
  how: [
    "The date fields are material's date picker in its modal form, so the calendar icon opens the calendar; check-out's calendar starts at check-in, and an earlier check-out date moves back to check-in. The arrival field's clock icon opens material's time picker, and a confirmed time writes back to the field.",
    "State is live in every variant: the total, the dialog summary and the price range all read the same shared state, so changing a room, an extra, the dates or the slider updates them at once. Book validates the name and email first and shows the message under the field that needs fixing.",
  ],
} satisfies ExampleMeta;
