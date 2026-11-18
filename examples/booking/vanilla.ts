// Vanilla: the create* factories the elements are built on.
import createButton from "material/components/button";
import createCheckbox from "material/components/checkbox";
import createDatePicker from "material/components/datepicker";
import createDialog from "material/components/dialog";
import createRadios from "material/components/radios";
import createSelect from "material/components/select";
import createSlider from "material/components/slider";
import createSnackbar from "material/components/snackbar";
import createTextField from "material/components/text-field";
import createTimePicker from "material/components/timepicker";
import { ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON, DEFAULTS, EXTRAS, ROOMS, eligibleRooms, normalizeTime, rangeText, roomOf, summary, totalText, validate, withDates, withPrice, type Booking } from "./shared";

let s: Booking = { ...DEFAULTS };
const app = document.getElementById("app")!;
const section = Object.assign(document.createElement("section"), { className: "booking" });
const div = (className: string): HTMLDivElement => Object.assign(document.createElement("div"), { className });
const text = (className: string, value: string, tag = "p"): HTMLElement => Object.assign(document.createElement(tag), { className, textContent: value });

const intro = div("booking__intro");
intro.append(text("booking__title mtrl-headline-small", "Book a stay", "h1"), text("booking__lede mtrl-body-medium", "Choose dates, guests and a room. The total updates as you go."));
const grid = div("booking__grid");
const status = Object.assign(document.createElement("output"), { className: "booking__total mtrl-body-medium" });
status.setAttribute("role", "status");
const range = text("booking__range mtrl-body-medium", "");

const checkIn = createDatePicker({ label: "Check-in", variant: "modal", closeOnSelect: true, dateFormat: "YYYY-MM-DD", value: s.checkIn });
const checkOut = createDatePicker({ label: "Check-out", variant: "modal", closeOnSelect: true, dateFormat: "YYYY-MM-DD", value: s.checkOut, minDate: s.checkIn });
const arrival = createTextField({ label: "Arrival time", value: s.arrivalTime, supportingText: "24-hour time", trailingIcon: CLOCK_ICON, trailingIconLabel: "Choose time" });
const nameField = createTextField({ label: "Name", supportingText: "Required" });
const adults = createSelect({ label: "Adults", value: s.adults, options: ADULT_OPTIONS.map((n) => ({ id: n, text: n })) });
const children = createSelect({ label: "Children", value: s.children, options: CHILD_OPTIONS.map((n) => ({ id: n, text: n })) });
const emailField = createTextField({ label: "Email", type: "email", supportingText: "Required" });
grid.append(checkIn.element, checkOut.element, arrival.element, nameField.element, adults.element, children.element, emailField.element);

const roomGroup = div("booking__group");
const radios = createRadios({ name: "room", value: s.room, options: ROOMS.map((room) => ({ value: room.value, label: `${room.label} — $${room.rate} a night` })) });
radios.element.setAttribute("aria-label", "Room type");
roomGroup.append(text("booking__label mtrl-title-small", "Room type"), radios.element);

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

const priceGroup = div("booking__group");
const slider = createSlider({ range: true, showValue: true, min: 50, max: 300, step: 10, value: s.priceMin, secondValue: s.priceMax });
slider.element.setAttribute("aria-label", "Price range");
slider.element.querySelectorAll('[role="slider"]').forEach((handle, index) => handle.setAttribute("aria-label", index === 0 ? "Price range minimum" : "Price range maximum"));
priceGroup.append(text("booking__label mtrl-title-small", "Price range"), slider.element, range);

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
slider.on("input", ({ value, secondValue }) => { s = withPrice(s, value, secondValue ?? s.priceMax); render(); });
nameField.on("input", ({ value }) => { s = { ...s, name: value }; nameField.setError(false); });
emailField.on("input", ({ value }) => { s = { ...s, email: value }; emailField.setError(false); });

const actions = Object.assign(document.createElement("footer"), { className: "booking__actions" });
const book = createButton({ text: "Book" });
book.on("click", () => {
  const errors = validate(s);
  nameField.setError(Boolean(errors.name), errors.name);
  emailField.setError(Boolean(errors.email), errors.email);
  arrival.setError(Boolean(errors.arrivalTime), errors.arrivalTime);
  if (!errors.name && !errors.email && !errors.arrivalTime && roomOf(s)) { render(); dialog.open(); }
});
actions.append(book.element);

section.append(intro, grid, roomGroup, extrasGroup, priceGroup, status, actions, timePicker.element);
app.append(section);
render();
