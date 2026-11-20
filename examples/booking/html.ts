// Web components: the elements themselves, no framework. The stepper is
// material-addons' <m-stepper>: its headers replace the hand-built step header and
// its data-stepper-* actions replace the wiring between Back, Next and the panels.
import "material/elements/css";
import "material-addons/elements/css/stepper";
import { defineAll } from "material/elements";
import { defineStepper } from "material-addons/elements";
import { ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON, DEFAULTS, EXTRAS, HERO_IMAGE, PROPERTY, ROOMS, TODAY, normalizeTime, priceLines, rangeParts, reviewLines, roomAfter, roomOf, stayText, stepHeading, stepNumberOf, stepValue, summary, totalText, validateStep, withRange, type Booking } from "./shared";

defineAll();
defineStepper();

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
      <img class="booking__hero" src="${HERO_IMAGE}" alt="The Dune House above the dunes in ${PROPERTY.town}" loading="lazy">
      <h1 class="booking__title mtrl-headline-small">${PROPERTY.name}</h1>
      <p class="booking__lede mtrl-body-medium">${PROPERTY.town} · ${PROPERTY.rating}</p>
      <p class="booking__lede mtrl-body-medium">${PROPERTY.lede}</p>
      <p class="booking__lede mtrl-body-medium">${PROPERTY.facts}</p>
    </div>
    <div class="booking__layout">
    <m-stepper id="stepper" orientation="auto" label-placement="bottom" linear aria-label="Booking steps" value="dates">
      <m-step value="dates" label="Dates and arrival">
        <div class="booking__step">
          <h2 class="booking__step-title mtrl-title-large" tabindex="-1">${stepHeading(1)}</h2>
          <div class="booking__grid">
            <m-datepicker id="stay" label="Check-in → Check-out" variant="modal" selection-mode="range" date-format="YYYY-MM-DD" min="${TODAY}" value="${s.checkIn}/${s.checkOut}"></m-datepicker>
            <m-text-field id="arrival" label="Arrival time" value="${s.arrivalTime}" supporting-text="24-hour time" trailing-icon-label="Choose time"></m-text-field>
          </div>
          <p class="booking__stay mtrl-body-medium" id="stay-line"></p>
          <p class="booking__field-error mtrl-body-small" id="dates-error" hidden></p>
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
            <div class="booking__rooms" id="rooms" role="radiogroup" aria-label="Room type">
              ${ROOMS.map((room) => `
              <div class="booking__room" role="radio" aria-label="${room.label}, ${room.beds}, ${room.size}, $${room.rate} a night, ${room.features}" data-room="${room.value}" aria-checked="${String(s.room === room.value)}" tabindex="${s.room === room.value ? "0" : "-1"}">
                <m-card variant="outlined"><div class="booking__room-card">
                  <img class="booking__room-image" src="${room.image}" alt="" loading="lazy">
                  <p class="booking__room-name mtrl-title-medium">${room.label}</p>
                  <p class="booking__room-facts mtrl-body-medium">${room.beds} · ${room.size}</p>
                  <p class="booking__room-price mtrl-body-medium">$${room.rate} a night</p>
                  <p class="booking__room-features mtrl-body-medium">${room.features}</p>
                </div></m-card>
              </div>`).join("")}
            </div>
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
    <m-card class="booking__summary" variant="filled" headline="Price summary">
      <div class="booking__summary-lines" id="summary-lines"></div>
    </m-card>
    </div>
    <m-timepicker id="timepicker" label="Arrival time" value="${s.arrivalTime}" format="24h"></m-timepicker>
    <m-snackbar id="snackbar" message="Booking confirmed"></m-snackbar>
  </section>`;

type Host = HTMLElement & { value: string; checked: boolean; show(): void; close(): void; setError(target: number | string, error: boolean): void };
const $ = <T extends HTMLElement = Host>(id: string) => document.getElementById(id) as T;
const arrival = $<HTMLElement & { value: string }>("arrival");
arrival.setAttribute("trailing-icon", CLOCK_ICON);
const detail = <T,>(event: Event): T => (event as CustomEvent<T>).detail;
const focusFirstInvalid = (n: number): void => {
  if (n === 1) {
    const stay = $("stay");
    const input = (stay.shadowRoot ?? stay).querySelector<HTMLElement>("input") ?? stay;
    // Focus the stay field when a dates error blocks; otherwise the arrival field.
    if (!$("dates-error").hidden) input.focus(); else arrival.focus();
  }
};
const setError = (id: string, message: string | undefined, fallback: string): void => {
  const field = $(id);
  if (message) { field.setAttribute("error", ""); field.setAttribute("supporting-text", message); }
  else { field.removeAttribute("error"); field.setAttribute("supporting-text", fallback); }
};
const showError = (id: string, message: string | undefined): void => {
  const el = $(id);
  if (message) { el.textContent = message; el.hidden = false; }
  else el.hidden = true;
};

const stepper = $("stepper");
stepper.addEventListener("beforechange", (event) => {
  const payload = detail<{ previousValue: string; direction: string; preventDefault: () => void }>(event);
  if (payload.direction !== "forward") return;
  const { previousValue } = payload;
  const n = stepNumberOf(previousValue);
  const errors = validateStep(s, n);
  const failed = errors.dates ?? errors.arrivalTime;
  if (failed) {
    payload.preventDefault();
    stepper.setError(previousValue, true);
  } else stepper.setError(previousValue, false);
  showError("dates-error", errors.dates);
  setError("arrival", errors.arrivalTime, "24-hour time");
  if (failed) focusFirstInvalid(n);
});

const render = (): void => {
  $("stay-line").textContent = stayText(s);
  $("dialog-summary").textContent = summary(s);
  $("summary-lines").replaceChildren(
    ...priceLines(s).map((line) => {
      const row = document.createElement("div");
      row.className = "booking__price-line";
      for (const part of [line.label, line.amount]) {
        const span = Object.assign(document.createElement("span"), { className: "booking__price-line mtrl-body-medium", textContent: part });
        row.append(span);
      }
      return row;
    }),
    (() => {
      const row = document.createElement("div");
      row.className = "booking__price-total";
      for (const part of ["Total", totalText(s).replace("Estimated total ", "")]) {
        const span = Object.assign(document.createElement("span"), { className: "booking__price-line mtrl-title-small", textContent: part });
        row.append(span);
      }
      return row;
    })(),
    Object.assign(document.createElement("p"), { className: "booking__lede mtrl-body-medium", textContent: totalText(s) }),
    Object.assign(document.createElement("p"), { className: "booking__lede mtrl-body-medium", textContent: PROPERTY.policy }),
  );
  for (const option of app.querySelectorAll<HTMLElement>("[data-room]")) {
    const selected = option.dataset.room === s.room;
    option.setAttribute("aria-checked", String(selected));
    option.tabIndex = selected ? 0 : -1;
  }
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

$("stay").addEventListener("change", (event) => {
  const parts = rangeParts(detail<{ value: string }>(event).value);
  if (parts) { s = withRange(s, parts[0], parts[1]); showError("dates-error", undefined); render(); }
});
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
const roomsEl = $("rooms");
const selectRoom = (value: string, focus = false): void => {
  s = { ...s, room: value };
  render();
  if (focus) app.querySelector<HTMLElement>(`[data-room="${value}"]`)?.focus();
};
roomsEl.addEventListener("click", (event) => {
  const option = (event.target as HTMLElement).closest<HTMLElement>("[data-room]");
  if (option) selectRoom(option.dataset.room!, true);
});
roomsEl.addEventListener("keydown", (event) => {
  const option = (event.target as HTMLElement).closest<HTMLElement>("[data-room]");
  if (!option) return;
  const value = option.dataset.room!;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); selectRoom(roomAfter(value, 1), true); }
  else if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); selectRoom(roomAfter(value, -1), true); }
  else if (event.key === "Home") { event.preventDefault(); selectRoom(ROOMS[0]!.value, true); }
  else if (event.key === "End") { event.preventDefault(); selectRoom(ROOMS[ROOMS.length - 1]!.value, true); }
  else if (event.key === " " || event.key === "Enter") { event.preventDefault(); selectRoom(value, true); }
});
for (const extra of EXTRAS) {
  $(extra.key).addEventListener("change", (event) => { s = { ...s, [extra.key]: detail<{ checked: boolean }>(event).checked }; render(); });
}
$("name").addEventListener("input", (event) => { s = { ...s, name: detail<{ value: string }>(event).value }; setError("name", undefined, "Required"); });
$("email").addEventListener("input", (event) => { s = { ...s, email: detail<{ value: string }>(event).value }; setError("email", undefined, "Required"); });

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
