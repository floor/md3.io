// Web components: the elements themselves, no framework.
import "material/elements/css";
import { defineAll } from "material/elements";
import { ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON, DEFAULTS, EXTRAS, ROOMS, eligibleRooms, normalizeTime, rangeText, reviewLines, roomOf, stepHeading, stepLabel, stepProgress, summary, totalText, validateStep, withDates, withPrice, type Booking } from "./shared";

defineAll();

let s: Booking = { ...DEFAULTS };
let step = 1;
const app = document.getElementById("app")!;
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
    <header class="booking__step-header" id="step-header">
      <h2 class="booking__step-title mtrl-title-large" id="step-title" tabindex="-1"></h2>
      <m-progress id="step-progress" max="4"></m-progress>
    </header>
    <div class="booking__step" id="step-1">
      <div class="booking__grid">
        <m-datepicker id="check-in" label="Check-in" variant="modal" close-on-select date-format="YYYY-MM-DD" value="${s.checkIn}"></m-datepicker>
        <m-datepicker id="check-out" label="Check-out" variant="modal" close-on-select date-format="YYYY-MM-DD" min="${s.checkIn}" value="${s.checkOut}"></m-datepicker>
        <m-text-field id="arrival" label="Arrival time" value="${s.arrivalTime}" supporting-text="24-hour time" trailing-icon-label="Choose time"></m-text-field>
      </div>
    </div>
    <div class="booking__step" id="step-2" hidden>
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
      </div>
    </div>
    <div class="booking__step" id="step-3" hidden>
      <div class="booking__group" role="group" aria-labelledby="extras-label">
        <p class="booking__label mtrl-title-small" id="extras-label">Extras</p>
        ${EXTRAS.map((extra) => `<m-checkbox id="${extra.key}">${extra.label} — $${extra.price} ${extra.unit}</m-checkbox>`).join("")}
      </div>
    </div>
    <div class="booking__step" id="step-4" hidden>
      <div class="booking__grid">
        <m-text-field id="name" label="Name" supporting-text="Required"></m-text-field>
        <m-text-field id="email" label="Email" type="email" supporting-text="Required"></m-text-field>
      </div>
      <div class="booking__group" id="review"></div>
    </div>
    <output class="booking__total mtrl-body-medium" role="status"></output>
    <footer class="booking__actions">
      <m-button id="back" variant="outlined" hidden>Back</m-button>
      <m-button id="next">Next</m-button>
      <m-button id="book" hidden>Book</m-button>
    </footer>
    <m-timepicker id="timepicker" label="Arrival time" value="${s.arrivalTime}" format="24h"></m-timepicker>
    <m-snackbar id="snackbar" message="Booking confirmed"></m-snackbar>
  </section>`;

type Host = HTMLElement & { value: string; checked: boolean; show(): void; close(): void };
const $ = <T extends HTMLElement = Host>(id: string) => document.getElementById(id) as T;
const total = app.querySelector("output")!;
const arrival = $<HTMLElement & { value: string }>("arrival");
arrival.setAttribute("trailing-icon", CLOCK_ICON);
const detail = <T,>(event: Event): T => (event as CustomEvent<T>).detail;

// The step header — one piece, so material's stepper can replace it whole when
// it lands. The heading carries the step, the progress shows n of 4.
const renderStepHeader = (): void => {
  $("step-title").textContent = stepHeading(step);
  const progress = $<Host & { value: string }>("step-progress");
  progress.value = String(stepProgress(step));
  progress.setAttribute("aria-label", stepLabel(step));
};
const focusHeading = (): void => $("step-title").focus();
const gotoStep = (next: number): void => {
  step = next;
  for (const n of [1, 2, 3, 4]) $(`step-${n}`).hidden = n !== step;
  $("back").hidden = step === 1;
  $("next").hidden = step === 4;
  $("book").hidden = step !== 4;
  renderStepHeader();
  render();
  focusHeading();
};
const focusFirstInvalid = (): void => {
  if (step === 1) { arrival.focus(); return; }
  if (step === 2) {
    const slider = $("price");
    const handle = (slider.shadowRoot ?? slider).querySelector<HTMLElement>('[role="slider"]');
    (handle ?? slider).focus();
  }
};

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
  // The fourth step reviews the first three, each line with its Edit.
  $("review").replaceChildren(
    ...reviewLines(s).map((line) => {
      const row = document.createElement("div");
      row.className = "booking__review-row";
      const text = Object.assign(document.createElement("p"), { className: "booking__review-line mtrl-body-medium", textContent: line.text });
      const edit = document.createElement("m-button");
      edit.setAttribute("variant", "text");
      edit.setAttribute("aria-label", `Edit ${line.title}`);
      edit.textContent = "Edit";
      edit.addEventListener("click", () => gotoStep(line.step));
      row.append(text, edit);
      return row;
    }),
  );
};
const setError = (id: string, message: string | undefined, fallback: string): void => {
  const field = $(id);
  if (message) { field.setAttribute("error", ""); field.setAttribute("supporting-text", message); }
  else { field.removeAttribute("error"); field.setAttribute("supporting-text", fallback); }
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
  render();
});
$("name").addEventListener("input", (event) => { s = { ...s, name: detail<{ value: string }>(event).value }; setError("name", undefined, "Required"); });
$("email").addEventListener("input", (event) => { s = { ...s, email: detail<{ value: string }>(event).value }; setError("email", undefined, "Required"); });

// Next validates the step it leaves; Back never does and never loses data.
$("next").addEventListener("click", () => {
  const errors = validateStep(s, step);
  if (errors.arrivalTime) { setError("arrival", errors.arrivalTime, "24-hour time"); focusFirstInvalid(); return; }
  if (errors.room) { focusFirstInvalid(); return; }
  if (step < 4) gotoStep(step + 1);
});
$("back").addEventListener("click", () => gotoStep(step - 1));
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
renderStepHeader();
render();
