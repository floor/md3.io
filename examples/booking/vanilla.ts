// Vanilla: the create* factories the elements are built on. The stepper itself is
// material-addons': its headers replace the hand-built step header, its linear
// validation pipeline replaces the hand-written Next checks, and its data-stepper-*
// actions replace the wiring between Back, Next and the panels.
import createButton from "material/components/button";
import createCard from "material/components/card";
import createCheckbox from "material/components/checkbox";
import createDatePicker from "material/components/datepicker";
import createDialog from "material/components/dialog";
import createSelect from "material/components/select";
import createSnackbar from "material/components/snackbar";
import createTextField from "material/components/text-field";
import createTimePicker from "material/components/timepicker";
import { createStepper, type StepConfig } from "material-addons/components/stepper";
import { ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON, DEFAULTS, EXTRAS, HERO_IMAGE, PROPERTY, ROOMS, TODAY, normalizeTime, priceLines, reviewLines, roomAfter, roomOf, stayText, stepHeading, stepValue, summary, totalText, validateStep, withRange, type Booking } from "./shared";

let s: Booking = { ...DEFAULTS };
const app = document.getElementById("app")!;
const section = Object.assign(document.createElement("section"), { className: "booking" });
const div = (className: string): HTMLDivElement => Object.assign(document.createElement("div"), { className });
const text = (className: string, value: string, tag = "p"): HTMLElement => Object.assign(document.createElement(tag), { className, textContent: value });

const intro = div("booking__intro");
const hero = Object.assign(document.createElement("img"), { className: "booking__hero", src: HERO_IMAGE, alt: `The Dune House above the dunes in ${PROPERTY.town}`, loading: "lazy" as const });
intro.append(
  hero,
  text("booking__title mtrl-headline-small", PROPERTY.name, "h1"),
  text("booking__lede mtrl-body-medium", `${PROPERTY.town} · ${PROPERTY.rating}`),
  text("booking__lede mtrl-body-medium", PROPERTY.lede),
  text("booking__lede mtrl-body-medium", PROPERTY.facts),
);

// Each step's panel: a heading the stepper focuses after a move (tabindex -1), the
// fields, and the panel's own actions, which carry the stepper's data attributes.
const pane = (step: number): HTMLDivElement => {
  const pane = div("booking__step");
  pane.append(Object.assign(document.createElement("h2"), { className: "booking__step-title mtrl-title-large", tabIndex: -1, textContent: stepHeading(step) }));
  return pane;
};
const action = (kind: "prev" | "next", label: string): HTMLDivElement => {
  const wrap = div("booking__action");
  wrap.setAttribute(kind === "prev" ? "data-stepper-prev" : "data-stepper-next", "");
  wrap.append(createButton({ text: label, ...(kind === "prev" ? { variant: "outlined" as const } : {}) }).element);
  return wrap;
};
const wrap = (button: HTMLElement): HTMLDivElement => {
  const el = div("booking__action");
  el.append(button);
  return el;
};
const actions = (...buttons: HTMLDivElement[]): HTMLElement => {
  const footer = Object.assign(document.createElement("footer"), { className: "booking__actions" });
  footer.append(...buttons);
  return footer;
};
const fieldError = (): HTMLElement => {
  const el = text("booking__field-error mtrl-body-small", "");
  el.hidden = true;
  return el;
};

// The price summary: a material card beside the stepper on wide frames, a compact
// panel above it on mobile frames (styles.css orders it), live on every step.
const summaryLines = div("booking__summary-lines");
const summaryCard = createCard({ variant: "filled", header: { title: "Price summary" }, content: { children: [summaryLines] } });
summaryCard.element.classList.add("booking__summary");
const renderSummary = (): void => {
  summaryLines.replaceChildren(
    ...priceLines(s).map((line) => {
      const row = div("booking__price-line");
      row.append(text("booking__price-line mtrl-body-medium", line.label, "span"), text("booking__price-line mtrl-body-medium", line.amount, "span"));
      return row;
    }),
    (() => {
      const row = div("booking__price-total");
      row.append(text("booking__price-line mtrl-title-small", "Total", "span"), text("booking__price-line mtrl-title-small", totalText(s).replace("Estimated total ", ""), "span"));
      return row;
    })(),
    text("booking__lede mtrl-body-medium", totalText(s)),
    text("booking__lede mtrl-body-medium", PROPERTY.policy),
  );
};

const step1 = pane(1);
const grid1 = div("booking__grid");
const stay = createDatePicker({ label: "Check-in → Check-out", variant: "modal", selectionMode: "range", dateFormat: "YYYY-MM-DD", value: [s.checkIn, s.checkOut], minDate: TODAY });
const arrival = createTextField({ label: "Arrival time", value: s.arrivalTime, supportingText: "24-hour time", trailingIcon: CLOCK_ICON, trailingIconLabel: "Choose time" });
grid1.append(stay.element, arrival.element);
const stayLine = text("booking__stay mtrl-body-medium", "");
const datesError = fieldError();
step1.append(grid1, stayLine, datesError, actions(action("next", "Next")));

const step2 = pane(2);
const grid2 = div("booking__grid");
const adults = createSelect({ label: "Adults", value: s.adults, options: ADULT_OPTIONS.map((n) => ({ id: n, text: n })) });
const children = createSelect({ label: "Children", value: s.children, options: CHILD_OPTIONS.map((n) => ({ id: n, text: n })) });
grid2.append(adults.element, children.element);
const roomGroup = div("booking__group");
const roomsEl = div("booking__rooms");
roomsEl.setAttribute("role", "radiogroup");
roomsEl.setAttribute("aria-label", "Room type");
const roomCards = new Map<string, HTMLElement>();
for (const room of ROOMS) {
  const option = div("booking__room");
  option.setAttribute("role", "radio");
  option.setAttribute("aria-label", `${room.label}, ${room.beds}, ${room.size}, $${room.rate} a night, ${room.features}`);
  option.dataset.room = room.value;
  const img = Object.assign(document.createElement("img"), { className: "booking__room-image", src: room.image, alt: "", loading: "lazy" as const });
  const body = div("booking__room-card");
  body.append(
    img,
    text("booking__room-name mtrl-title-medium", room.label),
    text("booking__room-facts mtrl-body-medium", `${room.beds} · ${room.size}`),
    text("booking__room-price mtrl-body-medium", `$${room.rate} a night`),
    text("booking__room-features mtrl-body-medium", room.features),
  );
  option.append(createCard({ variant: "outlined", content: { children: [body] } }).element);
  option.addEventListener("click", () => { s = { ...s, room: room.value }; render(); option.focus(); });
  roomCards.set(room.value, option);
  roomsEl.append(option);
}
roomsEl.addEventListener("keydown", (event) => {
  const option = (event.target as HTMLElement).closest<HTMLElement>("[data-room]");
  if (!option) return;
  const value = option.dataset.room!;
  const focusRoom = (next: string) => { s = { ...s, room: next }; render(); roomCards.get(next)?.focus(); };
  if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); focusRoom(roomAfter(value, 1)); }
  else if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); focusRoom(roomAfter(value, -1)); }
  else if (event.key === "Home") { event.preventDefault(); focusRoom(ROOMS[0]!.value); }
  else if (event.key === "End") { event.preventDefault(); focusRoom(ROOMS[ROOMS.length - 1]!.value); }
  else if (event.key === " " || event.key === "Enter") { event.preventDefault(); s = { ...s, room: value }; render(); roomCards.get(value)?.focus(); }
});
roomGroup.append(text("booking__label mtrl-title-small", "Room type"), roomsEl);
step2.append(grid2, roomGroup, actions(action("prev", "Back"), action("next", "Next")));

const step3 = pane(3);
const extrasGroup = div("booking__group");
extrasGroup.setAttribute("role", "group");
extrasGroup.setAttribute("aria-labelledby", "extras-label");
const extrasLabel = text("booking__label mtrl-title-small", "Extras");
extrasLabel.id = "extras-label";
extrasGroup.append(extrasLabel);
for (const extra of EXTRAS) {
  const control = createCheckbox({ label: `${extra.label} — $${extra.price} ${extra.unit}` });
  control.element.querySelector("svg")?.setAttribute("aria-hidden", "true");
  control.on("change", ({ checked }) => { s = { ...s, [extra.key]: checked }; render(); });
  extrasGroup.append(control.element);
}
step3.append(extrasGroup, actions(action("prev", "Back"), action("next", "Next")));

const step4 = pane(4);
const grid4 = div("booking__grid");
const nameField = createTextField({ label: "Name", supportingText: "Required" });
const emailField = createTextField({ label: "Email", type: "email", supportingText: "Required" });
grid4.append(nameField.element, emailField.element);
const review = div("booking__group");
step4.append(grid4, review);

const timePicker = createTimePicker({ value: s.arrivalTime, format: "24h", title: "Arrival time" });
const snackbar = createSnackbar({ message: "Booking confirmed" });
const summaryEl = document.createElement("p");
const dialog = createDialog({
  title: "Confirm booking",
  container: section,
  content: "",
  buttons: [
    { text: "Cancel", variant: "text" },
    { text: "Confirm booking", variant: "text", onClick: () => { section.append(snackbar.element); snackbar.show(); } },
  ],
});
const contentEl = dialog.getContentElement();
if (contentEl) {
  contentEl.id = "booking-summary";
  contentEl.append(summaryEl);
  dialog.element.setAttribute("aria-describedby", "booking-summary");
}

const focusField = (field: HTMLElement): void => {
  (field.querySelector<HTMLElement>("input, textarea") ?? field).focus();
};
const focusFirstInvalid = (step: number): void => {
  if (step === 1) focusField(arrival.element);
};
// Next validates the step it leaves through the stepper's pipeline.
const hook = (step: number): Exclude<StepConfig["validate"], undefined> => () => {
  const errors = validateStep(s, step);
  if (errors.dates) { datesError.textContent = errors.dates; datesError.hidden = false; focusField(stay.element); return false; }
  datesError.hidden = true;
  if (errors.arrivalTime) { arrival.setError(true, errors.arrivalTime); focusFirstInvalid(step); return false; }
  return true;
};

const stepper = createStepper({
  linear: true,
  orientation: "auto",
  labelPlacement: "bottom",
  focusOnAction: "heading",
  ariaLabel: "Booking steps",
  steps: [
    { value: stepValue(1), label: "Dates and arrival", validate: hook(1), content: step1 },
    { value: stepValue(2), label: "Guests and room", content: step2 },
    { value: stepValue(3), label: "Extras", content: step3 },
    { value: stepValue(4), label: "Your details and review", content: step4 },
  ],
});

const book = createButton({ text: "Book" });
book.on("click", () => {
  const errors = validateStep(s, 4);
  nameField.setError(Boolean(errors.name), errors.name);
  emailField.setError(Boolean(errors.email), errors.email);
  if (!errors.name && !errors.email) { render(); dialog.open(); }
  else if (errors.name) focusField(nameField.element);
  else if (errors.email) focusField(emailField.element);
});
step4.append(actions(action("prev", "Back"), wrap(book.element)));

const render = (): void => {
  stayLine.textContent = stayText(s);
  summaryEl.textContent = summary(s);
  renderSummary();
  for (const room of ROOMS) {
    const option = roomCards.get(room.value)!;
    option.setAttribute("aria-checked", String(s.room === room.value));
    option.tabIndex = s.room === room.value ? 0 : -1;
  }
  review.replaceChildren(
    ...reviewLines(s).map((line) => {
      const row = div("booking__review-row");
      const copy = div("booking__review-copy");
      copy.append(text("booking__review-label mtrl-title-small", line.label), text("booking__review-line mtrl-body-medium", line.text));
      const edit = div("booking__action");
      edit.setAttribute("data-stepper-goto", stepValue(line.step));
      edit.append(createButton({ text: "Edit", variant: "text", ariaLabel: `Edit ${line.label}` }).element);
      row.append(copy, edit);
      return row;
    }),
  );
};

stay.on("change", (detail) => {
  const d = detail as unknown as { value?: unknown; rangeEndDate?: unknown; iso?: string };
  const toIso = (v: unknown): string | null => v instanceof Date ? `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}` : typeof v === "string" ? v.split("/")[0]! : null;
  const start = Array.isArray(d.value) ? toIso(d.value[0]) : toIso(d.value);
  const end = toIso(d.rangeEndDate) ?? (typeof d.iso === "string" ? d.iso.split("/")[1] ?? null : null) ?? (Array.isArray(d.value) ? toIso(d.value[1]) : null);
  if (start && end) { s = withRange(s, start, end); datesError.hidden = true; render(); }
});
arrival.on("input", ({ value }) => { s = { ...s, arrivalTime: value }; arrival.setError(false); });
arrival.on("change", ({ value }) => {
  const time = normalizeTime(value);
  if (time) { s = { ...s, arrivalTime: time }; arrival.setValue(time); arrival.setError(false); }
  else arrival.setError(true, "Enter a valid time");
});
arrival.on("trailing", () => {
  const time = normalizeTime(s.arrivalTime);
  timePicker.setValue(time ?? "15:00");
  timePicker.open();
});
timePicker.on("change", ({ value }) => { s = { ...s, arrivalTime: value }; arrival.setValue(value); arrival.setError(false); });
adults.on("change", ({ value }) => { s = { ...s, adults: value ?? s.adults }; render(); });
children.on("change", ({ value }) => { s = { ...s, children: value ?? s.children }; render(); });
nameField.on("input", ({ value }) => { s = { ...s, name: value }; nameField.setError(false); });
emailField.on("input", ({ value }) => { s = { ...s, email: value }; emailField.setError(false); });

const layout = div("booking__layout");
layout.append(stepper.element, summaryCard.element);
section.append(intro, layout, timePicker.element);
app.append(section);
render();
