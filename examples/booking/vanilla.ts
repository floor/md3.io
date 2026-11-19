// Vanilla: the create* factories the elements are built on.
import createButton from "material/components/button";
import createCheckbox from "material/components/checkbox";
import createDatePicker from "material/components/datepicker";
import createDialog from "material/components/dialog";
import createProgress from "material/components/progress";
import createRadios from "material/components/radios";
import createSelect from "material/components/select";
import createSlider from "material/components/slider";
import createSnackbar from "material/components/snackbar";
import createTextField from "material/components/text-field";
import createTimePicker from "material/components/timepicker";
import { ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON, DEFAULTS, EXTRAS, ROOMS, eligibleRooms, normalizeTime, rangeText, reviewLines, roomOf, stepHeading, stepLabel, stepProgress, summary, totalText, validateStep, withDates, withPrice, type Booking } from "./shared";

let s: Booking = { ...DEFAULTS };
let step = 1;
const app = document.getElementById("app")!;
const section = Object.assign(document.createElement("section"), { className: "booking" });
const div = (className: string): HTMLDivElement => Object.assign(document.createElement("div"), { className });
const text = (className: string, value: string, tag = "p"): HTMLElement => Object.assign(document.createElement(tag), { className, textContent: value });

const intro = div("booking__intro");
intro.append(text("booking__title mtrl-headline-small", "Book a stay", "h1"), text("booking__lede mtrl-body-medium", "Four steps: dates, guests and room, extras, then your details. The total updates as you go."));

// The step header — one piece, so material's stepper can replace it whole when
// it lands. The heading carries the step, the progress shows n of 4.
const stepHeader = div("booking__step-header");
const stepTitle = Object.assign(document.createElement("h2"), { className: "booking__step-title mtrl-title-large", tabIndex: -1 });
const progress = createProgress({ max: 4 });
stepHeader.append(stepTitle, progress.element);

const stepPane = (n: number): HTMLDivElement => {
  const pane = div("booking__step");
  pane.id = `step-${n}`;
  pane.hidden = n !== step;
  return pane;
};

const step1 = stepPane(1);
const grid1 = div("booking__grid");
const status = Object.assign(document.createElement("output"), { className: "booking__total mtrl-body-medium" });
status.setAttribute("role", "status");
const range = text("booking__range mtrl-body-medium", "");

const checkIn = createDatePicker({ label: "Check-in", variant: "modal", closeOnSelect: true, dateFormat: "YYYY-MM-DD", value: s.checkIn });
const checkOut = createDatePicker({ label: "Check-out", variant: "modal", closeOnSelect: true, dateFormat: "YYYY-MM-DD", value: s.checkOut, minDate: s.checkIn });
const arrival = createTextField({ label: "Arrival time", value: s.arrivalTime, supportingText: "24-hour time", trailingIcon: CLOCK_ICON, trailingIconLabel: "Choose time" });
grid1.append(checkIn.element, checkOut.element, arrival.element);
step1.append(grid1);

const step2 = stepPane(2);
const grid2 = div("booking__grid");
const adults = createSelect({ label: "Adults", value: s.adults, options: ADULT_OPTIONS.map((n) => ({ id: n, text: n })) });
const children = createSelect({ label: "Children", value: s.children, options: CHILD_OPTIONS.map((n) => ({ id: n, text: n })) });
grid2.append(adults.element, children.element);
const roomGroup = div("booking__group");
const radios = createRadios({ name: "room", value: s.room, options: ROOMS.map((room) => ({ value: room.value, label: `${room.label} — $${room.rate} a night` })) });
radios.element.setAttribute("aria-label", "Room type");
roomGroup.append(text("booking__label mtrl-title-small", "Room type"), radios.element);
const priceGroup = div("booking__group");
const slider = createSlider({ range: true, showValue: true, min: 50, max: 300, step: 10, value: s.priceMin, secondValue: s.priceMax });
slider.element.setAttribute("aria-label", "Price range");
slider.element.querySelectorAll('[role="slider"]').forEach((handle, index) => handle.setAttribute("aria-label", index === 0 ? "Price range minimum" : "Price range maximum"));
const roomError = text("booking__field-error mtrl-body-small", "");
roomError.hidden = true;
priceGroup.append(text("booking__label mtrl-title-small", "Price range"), slider.element, range, roomError);
step2.append(grid2, roomGroup, priceGroup);

const step3 = stepPane(3);
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
step3.append(extrasGroup);

const step4 = stepPane(4);
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

const render = (): void => {
  status.textContent = totalText(s);
  range.textContent = rangeText(s);
  summaryEl.textContent = summary(s);
  const eligible = new Set(eligibleRooms(s).map((room) => room.value));
  for (const room of ROOMS) eligible.has(room.value) ? radios.enableOption(room.value) : radios.disableOption(room.value);
  if (radios.getValue() !== (s.room || null)) radios.setValue(s.room || null);
  // The fourth step reviews the first three: a labelled line each, with its Edit.
  review.replaceChildren(
    ...reviewLines(s).map((line) => {
      const row = div("booking__review-row");
      const copy = div("booking__review-copy");
      copy.append(text("booking__review-label mtrl-title-small", line.label), text("booking__review-line mtrl-body-medium", line.text));
      const edit = createButton({ text: "Edit", variant: "text", ariaLabel: `Edit ${line.label}` });
      edit.on("click", () => gotoStep(line.step));
      row.append(copy, edit.element);
      return row;
    }),
  );
};
const renderStepHeader = (): void => {
  stepTitle.textContent = stepHeading(step);
  progress.setValue(stepProgress(step));
  progress.element.setAttribute("aria-label", stepLabel(step));
};
/** A factory field's root does not take focus itself; its input does. */
const focusField = (field: HTMLElement): void => {
  (field.querySelector<HTMLElement>("input, textarea") ?? field).focus();
};
const focusFirstInvalid = (): void => {
  if (step === 1) { focusField(arrival.element); return; }
  if (step === 2) {
    const handle = slider.element.querySelector<HTMLElement>('[role="slider"]');
    (handle ?? slider.element).focus();
  }
};
const show = (element: HTMLElement, shown: boolean): void => {
  // The factory button's own display rule beats the hidden attribute; set display.
  element.style.display = shown ? "" : "none";
};
const gotoStep = (next: number): void => {
  step = next;
  step1.hidden = step !== 1;
  step2.hidden = step !== 2;
  step3.hidden = step !== 3;
  step4.hidden = step !== 4;
  show(backButton.element, step !== 1);
  show(nextButton.element, step !== 4);
  show(bookButton.element, step === 4);
  renderStepHeader();
  render();
  stepTitle.focus();
};

checkIn.on("change", ({ iso }) => {
  s = withDates(s, iso, s.checkOut);
  checkOut.setValue(s.checkOut);
  checkOut.setMinDate(s.checkIn);
  render();
});
checkOut.on("change", ({ iso }) => { s = withDates(s, s.checkIn, iso); render(); });
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
radios.on("change", ({ value }) => { s = { ...s, room: value ?? "" }; render(); });
slider.on("input", ({ value, secondValue }) => {
  s = withPrice(s, value, secondValue ?? s.priceMax);
  roomError.hidden = true;
  roomError.textContent = "";
  render();
});
nameField.on("input", ({ value }) => { s = { ...s, name: value }; nameField.setError(false); });
emailField.on("input", ({ value }) => { s = { ...s, email: value }; emailField.setError(false); });

// Next validates the step it leaves; Back never does and never loses data.
const actions = Object.assign(document.createElement("footer"), { className: "booking__actions" });
const backButton = createButton({ text: "Back", variant: "outlined" });
backButton.element.style.display = "none";
backButton.on("click", () => gotoStep(step - 1));
const nextButton = createButton({ text: "Next" });
nextButton.on("click", () => {
  const errors = validateStep(s, step);
  if (errors.arrivalTime) { arrival.setError(true, errors.arrivalTime); focusFirstInvalid(); return; }
  if (errors.room) { roomError.textContent = errors.room; roomError.hidden = false; focusFirstInvalid(); return; }
  if (step < 4) gotoStep(step + 1);
});
const bookButton = createButton({ text: "Book" });
bookButton.element.style.display = "none";
bookButton.on("click", () => {
  const errors = validateStep(s, 4);
  nameField.setError(Boolean(errors.name), errors.name);
  emailField.setError(Boolean(errors.email), errors.email);
  if (!errors.name && !errors.email && roomOf(s)) { render(); dialog.open(); }
  else if (errors.name) focusField(nameField.element);
  else if (errors.email) focusField(emailField.element);
});
actions.append(backButton.element, nextButton.element, bookButton.element);

section.append(intro, stepHeader, step1, step2, step3, step4, status, actions, timePicker.element);
app.append(section);
renderStepHeader();
render();
