// Web components: the elements themselves, no framework. The stepper is
// material-addons' <m-stepper>: its headers replace the hand-built step header and
// its data-stepper-* actions replace the wiring between Back, Next and the panels.
import "material/elements/css";
import "material-addons/elements/css/stepper";
import { defineAll } from "material/elements";
import { defineStepper } from "material-addons/elements";
import { ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON, DEFAULTS, EXTRAS, ROOMS, eligibleRooms, normalizeTime, rangeText, reviewLines, roomOf, stepHeading, stepNumberOf, stepValue, summary, totalText, validateStep, withDates, withPrice, type Booking } from "./shared";

defineAll();
defineStepper();

let s: Booking = { ...DEFAULTS };
const app = document.getElementById("app")!;
// orientation "auto" turns vertical below 600px of container width: the booking column
// is at most 560px, so the headers stack and every label stays readable. focus-on-action
// is a factory option the element does not take; each panel's heading carries
// tabindex="-1", which the default panel focus reaches first — the same focus landing.
app.innerHTML = `
  <section class="booking">
    <m-dialog id="dialog" headline="Confirm booking">
      <p id="dialog-summary"></p>
      <m-button slot="actions" variant="text" id="cancel">Cancel</m-button>
      <m-button slot="actions" variant="text" id="confirm">Confirm booking</m-button>
    </m-dialog>
    <div class="booking__intro">
      <h1 class="booking__title mtrl-headline-small">Book a stay</h1>
      <p class="booking__lede mtrl-body-medium">Four steps: dates, guests and room, extras, then your details. The total updates as you go.</p>
    </div>
    <m-stepper id="stepper" orientation="auto" linear aria-label="Booking steps" value="dates">
      <m-step value="dates" label="Dates and arrival">
        <div class="booking__step">
          <h2 class="booking__step-title mtrl-title-large" tabindex="-1">${stepHeading(1)}</h2>
          <div class="booking__grid">
            <m-datepicker id="check-in" label="Check-in" variant="modal" close-on-select date-format="YYYY-MM-DD" value="${s.checkIn}"></m-datepicker>
            <m-datepicker id="check-out" label="Check-out" variant="modal" close-on-select date-format="YYYY-MM-DD" min="${s.checkIn}" value="${s.checkOut}"></m-datepicker>
            <m-text-field id="arrival" label="Arrival time" value="${s.arrivalTime}" supporting-text="24-hour time" trailing-icon-label="Choose time"></m-text-field>
          </div>
          <footer class="booking__actions"><div data-stepper-next><m-button id="next-1">Next</m-button></div></footer>
        </div>
      </m-step>
      <m-step value="guests" label="Guests and room">
        <div class="booking__step">
          <h2 class="booking__step-title mtrl-title-large" tabindex="-1">${stepHeading(2)}</h2>
          <div class="booking__grid">
            <m-select id="adults" label="Adults" value="${s.adults}">${ADULT_OPTIONS.map((n) => `<m-select-option value="${n}">${n}</m-select-option>`).join("")}</m-select>
            <m-select id="children" label="Children" value="${s.children}">${CHILD_OPTIONS.map((n) => `<m-select-option value="${n}">${n}</m-select-option>`).join("")}</m-select>
          </div>
          <div class="booking__group">
            <p class="booking__label mtrl-title-small">Room type</p>
            <m-radios id="room" aria-label="Room type" value="${s.room}">${ROOMS.map((room) => `<m-radio value="${room.value}">${room.label} — $${room.rate} a night</m-radio>`).join("")}</m-radios>
          </div>
          <div class="booking__group">
            <p class="booking__label mtrl-title-small">Price range</p>
            <m-slider id="price" range show-value min="50" max="300" step="10" value="${s.priceMin}" second-value="${s.priceMax}" aria-label="Price range"></m-slider>
            <p class="booking__range mtrl-body-medium" id="range"></p>
            <p class="booking__field-error mtrl-body-small" id="room-error" hidden></p>
          </div>
          <footer class="booking__actions"><div data-stepper-prev><m-button variant="outlined">Back</m-button></div><div data-stepper-next><m-button>Next</m-button></div></footer>
        </div>
      </m-step>
      <m-step value="extras" label="Extras">
        <div class="booking__step">
          <h2 class="booking__step-title mtrl-title-large" tabindex="-1">${stepHeading(3)}</h2>
          <div class="booking__group" role="group" aria-labelledby="extras-label">
            <p class="booking__label mtrl-title-small" id="extras-label">Extras</p>
            ${EXTRAS.map((extra) => `<m-checkbox id="${extra.key}">${extra.label} — $${extra.price} ${extra.unit}</m-checkbox>`).join("")}
          </div>
          <footer class="booking__actions"><div data-stepper-prev><m-button variant="outlined">Back</m-button></div><div data-stepper-next><m-button>Next</m-button></div></footer>
        </div>
      </m-step>
      <m-step value="details" label="Your details and review">
        <div class="booking__step">
          <h2 class="booking__step-title mtrl-title-large" tabindex="-1">${stepHeading(4)}</h2>
          <div class="booking__grid">
            <m-text-field id="name" label="Name" supporting-text="Required"></m-text-field>
            <m-text-field id="email" label="Email" type="email" supporting-text="Required"></m-text-field>
          </div>
          <div class="booking__group" id="review"></div>
          <footer class="booking__actions"><div data-stepper-prev><m-button variant="outlined">Back</m-button></div><div id="book"><m-button>Book</m-button></div></footer>
        </div>
      </m-step>
    </m-stepper>
    <output class="booking__total mtrl-body-medium" role="status"></output>
    <m-timepicker id="timepicker" label="Arrival time" value="${s.arrivalTime}" format="24h"></m-timepicker>
    <m-snackbar id="snackbar" message="Booking confirmed"></m-snackbar>
  </section>`;

type Host = HTMLElement & { value: string; checked: boolean; show(): void; close(): void; setError(target: number | string, error: boolean): void };
const $ = <T extends HTMLElement = Host>(id: string) => document.getElementById(id) as T;
const total = app.querySelector("output")!;
const arrival = $<HTMLElement & { value: string }>("arrival");
arrival.setAttribute("trailing-icon", CLOCK_ICON);
const detail = <T,>(event: Event): T => (event as CustomEvent<T>).detail;
const focusFirstInvalid = (n: number): void => {
  if (n === 1) { arrival.focus(); return; }
  if (n === 2) {
    const slider = $("price");
    const handle = (slider.shadowRoot ?? slider).querySelector<HTMLElement>('[role="slider"]');
    (handle ?? slider).focus();
  }
};
const setError = (id: string, message: string | undefined, fallback: string): void => {
  const field = $(id);
  if (message) { field.setAttribute("error", ""); field.setAttribute("supporting-text", message); }
  else { field.removeAttribute("error"); field.setAttribute("supporting-text", fallback); }
};
const roomErrorShow = (message: string | undefined): void => {
  const roomError = $("room-error");
  if (message) { roomError.textContent = message; roomError.hidden = false; }
  else roomError.hidden = true;
};

// The element takes no validator functions, so a forward move is checked in its
// cancellable beforechange: an invalid step vetoes the move, the stepper's own error
// state is set to mirror what the factory's pipeline would do, and the message shows
// at the field with focus on it. A passing move clears the error and completes the step.
const stepper = $("stepper");
stepper.addEventListener("beforechange", (event) => {
  const payload = detail<{ previousValue: string; direction: string; preventDefault: () => void }>(event);
  if (payload.direction !== "forward") return;
  const { previousValue } = payload;
  const n = stepNumberOf(previousValue);
  const errors = validateStep(s, n);
  const failed = errors.arrivalTime ?? errors.room;
  if (failed) {
    // The payload's own preventDefault is what the stepper checks.
    payload.preventDefault();
    stepper.setError(previousValue, true);
  } else stepper.setError(previousValue, false);
  setError("arrival", errors.arrivalTime, "24-hour time");
  roomErrorShow(errors.room);
  if (failed) focusFirstInvalid(n);
});

const render = (): void => {
  total.textContent = totalText(s);
  $("range").textContent = rangeText(s);
  $("dialog-summary").textContent = summary(s);
  const eligible = new Set<string>(eligibleRooms(s).map((room) => room.value));
  for (const radio of app.querySelectorAll("m-radio")) {
    if (eligible.has(radio.getAttribute("value") ?? "")) radio.removeAttribute("disabled");
    else radio.setAttribute("disabled", "");
  }
  const radios = $("room");
  if (radios.value !== s.room) radios.value = s.room;
  // The fourth step reviews the first three: a labelled line each, with its Edit.
  $("review").replaceChildren(
    ...reviewLines(s).map((line) => {
      const row = document.createElement("div");
      row.className = "booking__review-row";
      const copy = document.createElement("div");
      copy.className = "booking__review-copy";
      const label = Object.assign(document.createElement("p"), { className: "booking__review-label mtrl-title-small", textContent: line.label });
      const text = Object.assign(document.createElement("p"), { className: "booking__review-line mtrl-body-medium", textContent: line.text });
      const edit = document.createElement("div");
      edit.setAttribute("data-stepper-goto", stepValue(line.step));
      const button = document.createElement("m-button");
      button.setAttribute("variant", "text");
      button.setAttribute("aria-label", `Edit ${line.label}`);
      button.textContent = "Edit";
      edit.append(button);
      copy.append(label, text);
      row.append(copy, edit);
      return row;
    }),
  );
};

$("check-in").addEventListener("change", (event) => {
  s = withDates(s, detail<{ value: string }>(event).value, s.checkOut);
  const out = $("check-out");
  out.value = s.checkOut;
  out.setAttribute("min", s.checkIn);
  render();
});
$("check-out").addEventListener("change", (event) => { s = withDates(s, s.checkIn, detail<{ value: string }>(event).value); render(); });
arrival.addEventListener("input", (event) => { s = { ...s, arrivalTime: detail<{ value: string }>(event).value }; setError("arrival", undefined, "24-hour time"); });
arrival.addEventListener("change", (event) => {
  const time = normalizeTime(detail<{ value: string }>(event).value);
  if (time) { s = { ...s, arrivalTime: time }; arrival.value = time; setError("arrival", undefined, "24-hour time"); }
  else setError("arrival", "Enter a valid time", "24-hour time");
});
arrival.addEventListener("trailing", () => {
  const picker = $("timepicker");
  picker.value = normalizeTime(s.arrivalTime) ?? "15:00";
  picker.show();
});
$("timepicker").addEventListener("change", (event) => {
  s = { ...s, arrivalTime: detail<{ value: string }>(event).value };
  arrival.value = s.arrivalTime;
  setError("arrival", undefined, "24-hour time");
});
$("adults").addEventListener("change", (event) => { s = { ...s, adults: detail<{ value: string }>(event).value }; render(); });
$("children").addEventListener("change", (event) => { s = { ...s, children: detail<{ value: string }>(event).value }; render(); });
$("room").addEventListener("change", (event) => { s = { ...s, room: detail<{ value: string }>(event).value }; render(); });
for (const extra of EXTRAS) {
  $(extra.key).addEventListener("change", (event) => { s = { ...s, [extra.key]: detail<{ checked: boolean }>(event).checked }; render(); });
}
$("price").addEventListener("input", (event) => {
  const value = detail<{ value: number; secondValue?: number }>(event);
  s = withPrice(s, value.value, value.secondValue ?? s.priceMax);
  roomErrorShow(undefined);
  render();
});
$("name").addEventListener("input", (event) => { s = { ...s, name: detail<{ value: string }>(event).value }; setError("name", undefined, "Required"); });
$("email").addEventListener("input", (event) => { s = { ...s, email: detail<{ value: string }>(event).value }; setError("email", undefined, "Required"); });

// Book validates the details itself: it is not a move, so the stepper has no say in it.
$("book").addEventListener("click", () => {
  const errors = validateStep(s, 4);
  setError("name", errors.name, "Required");
  setError("email", errors.email, "Required");
  if (!errors.name && !errors.email && roomOf(s)) { render(); $("dialog").show(); }
  else if (errors.name) $("name").focus();
  else if (errors.email) $("email").focus();
});
$("cancel").addEventListener("click", () => $("dialog").close());
$("confirm").addEventListener("click", () => { $("dialog").close(); $("snackbar").show(); });
render();
