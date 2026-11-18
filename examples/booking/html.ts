// Web components: the elements themselves, no framework.
import "material/elements/css";
import { defineAll } from "material/elements";
import { ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON, DEFAULTS, EXTRAS, ROOMS, summary, totalText, validate, withDates, type Booking } from "./shared";

defineAll();

let s: Booking = { ...DEFAULTS };
const app = document.getElementById("app")!;
app.innerHTML = `
  <section class="booking">
    <m-dialog id="dialog" headline="Confirm booking">
      <p id="dialog-summary"></p>
      <m-button slot="actions" variant="text" id="cancel">Cancel</m-button>
      <m-button slot="actions" variant="text" id="confirm">Confirm booking</m-button>
    </m-dialog>
    <div class="booking__intro">
      <p class="booking__title">Book a stay</p>
      <p class="booking__lede">Choose dates, guests and a room. The total updates as you go.</p>
    </div>
    <div class="booking__grid">
      <m-datepicker id="check-in" label="Check-in" variant="modal" close-on-select date-format="YYYY-MM-DD" value="${s.checkIn}"></m-datepicker>
      <m-datepicker id="check-out" label="Check-out" variant="modal" close-on-select date-format="YYYY-MM-DD" min="${s.checkIn}" value="${s.checkOut}"></m-datepicker>
      <m-text-field id="arrival" label="Arrival time" value="${s.arrivalTime}" trailing-icon-label="Choose time"></m-text-field>
      <m-text-field id="name" label="Name" supporting-text="Required"></m-text-field>
      <m-select id="adults" label="Adults" value="${s.adults}">${ADULT_OPTIONS.map((n) => `<m-select-option value="${n}">${n}</m-select-option>`).join("")}</m-select>
      <m-select id="children" label="Children" value="${s.children}">${CHILD_OPTIONS.map((n) => `<m-select-option value="${n}">${n}</m-select-option>`).join("")}</m-select>
      <m-text-field id="email" label="Email" type="email" supporting-text="Required"></m-text-field>
    </div>
    <div class="booking__group">
      <p class="booking__label">Room type</p>
      <m-radios id="room" aria-label="Room type" value="${s.room}">${ROOMS.map((room) => `<m-radio value="${room.value}">${room.label} — $${room.rate} a night</m-radio>`).join("")}</m-radios>
    </div>
    <div class="booking__group">
      <p class="booking__label">Extras</p>
      ${EXTRAS.map((extra) => `<m-checkbox id="${extra.key}">${extra.label} — $${extra.price} ${extra.unit}</m-checkbox>`).join("")}
    </div>
    <div class="booking__group">
      <p class="booking__label">Price range</p>
      <m-slider id="price" range min="50" max="300" step="10" value="${s.priceMin}" second-value="${s.priceMax}" aria-label="Price range"></m-slider>
    </div>
    <footer class="booking__actions"><m-button id="book">Book</m-button></footer>
    <output class="booking__total" role="status"></output>
    <m-timepicker id="timepicker" value="${s.arrivalTime}" format="24h"></m-timepicker>
    <m-snackbar id="snackbar" message="Booking confirmed"></m-snackbar>
  </section>`;

type Host = HTMLElement & { value: string; checked: boolean; show(): void; close(): void };
const $ = <T extends HTMLElement = Host>(id: string) => document.getElementById(id) as T;
const total = app.querySelector("output")!;
const arrival = $<HTMLElement & { value: string }>("arrival");
arrival.setAttribute("trailing-icon", CLOCK_ICON);
const render = (): void => {
  total.textContent = totalText(s);
  $("dialog-summary").textContent = summary(s);
};
const detail = <T,>(event: Event): T => (event as CustomEvent<T>).detail;

$("check-in").addEventListener("change", (event) => {
  s = withDates(s, detail<{ value: string }>(event).value, s.checkOut);
  const out = $("check-out");
  out.value = s.checkOut;
  out.setAttribute("min", s.checkIn);
  render();
});
$("check-out").addEventListener("change", (event) => { s = withDates(s, s.checkIn, detail<{ value: string }>(event).value); render(); });
arrival.addEventListener("input", (event) => { s = { ...s, arrivalTime: detail<{ value: string }>(event).value }; });
arrival.addEventListener("trailing", () => $("timepicker").show());
$("timepicker").addEventListener("change", (event) => {
  s = { ...s, arrivalTime: detail<{ value: string }>(event).value };
  arrival.value = s.arrivalTime;
});
$("adults").addEventListener("change", (event) => { s = { ...s, adults: detail<{ value: string }>(event).value }; render(); });
$("children").addEventListener("change", (event) => { s = { ...s, children: detail<{ value: string }>(event).value }; render(); });
$("room").addEventListener("change", (event) => { s = { ...s, room: detail<{ value: string }>(event).value }; render(); });
for (const extra of EXTRAS) {
  $(extra.key).addEventListener("change", (event) => { s = { ...s, [extra.key]: detail<{ checked: boolean }>(event).checked }; render(); });
}
$("price").addEventListener("input", (event) => {
  const value = detail<{ value: number; secondValue?: number }>(event);
  s = { ...s, priceMin: value.value, priceMax: value.secondValue ?? s.priceMax };
  render();
});
const setError = (id: string, message?: string): void => {
  const field = $(id);
  if (message) { field.setAttribute("error", ""); field.setAttribute("supporting-text", message); }
  else { field.removeAttribute("error"); field.setAttribute("supporting-text", "Required"); }
};
$("name").addEventListener("input", (event) => { s = { ...s, name: detail<{ value: string }>(event).value }; setError("name"); });
$("email").addEventListener("input", (event) => { s = { ...s, email: detail<{ value: string }>(event).value }; setError("email"); });
$("book").addEventListener("click", () => {
  const errors = validate(s);
  setError("name", errors.name);
  setError("email", errors.email);
  if (!errors.name && !errors.email) { render(); $("dialog").show(); }
});
$("cancel").addEventListener("click", () => $("dialog").close());
$("confirm").addEventListener("click", () => { $("dialog").close(); $("snackbar").show(); });
render();
