// React: material/react wraps the same elements, and material-addons/react the
// stepper whose headers replace the hand-built step header and whose data-stepper-*
// actions replace the wiring between Back, Next and the panels.
import { useRef, useState } from "react";
import { Button, Checkbox, Datepicker, Dialog, Radio, Radios, Select, SelectOption, Slider, Snackbar, TextField, Timepicker } from "material/react";
import { Stepper, Step } from "material-addons/react";
import type { StepperElement } from "material-addons/elements";
import type { StepperBeforeChangeEvent } from "material-addons/components/stepper";
import type { SliderElement, TextFieldElement } from "material/elements";
import { ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON, DEFAULTS, EXTRAS, ROOMS, eligibleRooms, normalizeTime, rangeText, reviewLines, roomOf, stepHeading, stepNumberOf, stepValue, summary, totalText, validateStep, withDates, withPrice, type Booking, type BookingErrors } from "./shared";

export default function Booking() {
  const [s, setS] = useState<Booking>(DEFAULTS);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const update = (patch: Partial<Booking>) => setS((prev) => ({ ...prev, ...patch }));
  const eligible = new Set(eligibleRooms(s).map((room) => room.value));
  const stepperRef = useRef<StepperElement | null>(null);
  const arrivalRef = useRef<TextFieldElement | null>(null);
  const sliderRef = useRef<SliderElement | null>(null);
  const nameRef = useRef<TextFieldElement | null>(null);
  const emailRef = useRef<TextFieldElement | null>(null);

  // An adapter exposes no validator functions, so a forward move is checked in the
  // stepper's cancellable beforechange: an invalid step vetoes the move and the
  // stepper's own error state is set to mirror what the factory's pipeline would do.
  // The message shows at the field, with focus on the first one that needs fixing.
  const veto = (event: CustomEvent<StepperBeforeChangeEvent>): void => {
    if (event.detail.direction !== "forward" || event.detail.previousValue === null) return;
    const { previousValue } = event.detail;
    const stepErrors = validateStep(s, stepNumberOf(previousValue));
    if (stepErrors.arrivalTime || stepErrors.room) {
      // The payload's own preventDefault is what the stepper checks.
      event.detail.preventDefault();
      stepperRef.current?.setError(previousValue, true);
    } else stepperRef.current?.setError(previousValue, false);
    setErrors((prev) => ({ ...prev, arrivalTime: stepErrors.arrivalTime, room: stepErrors.room }));
    if (stepErrors.arrivalTime) arrivalRef.current?.focus();
    else if (stepErrors.room) {
      const slider = sliderRef.current;
      const handle = (slider?.shadowRoot ?? slider)?.querySelector<HTMLElement>('[role="slider"]');
      (handle ?? slider)?.focus();
    }
  };
  // Book validates the details itself: it is not a move, so the stepper has no say in it.
  const book = () => {
    const stepErrors = validateStep(s, 4);
    setErrors(stepErrors);
    if (!stepErrors.name && !stepErrors.email && roomOf(s)) setDialogOpen(true);
    else if (stepErrors.name) nameRef.current?.focus();
    else if (stepErrors.email) emailRef.current?.focus();
  };
  const commitTime = (value: string) => {
    const time = normalizeTime(value);
    if (time) { update({ arrivalTime: time }); setErrors((prev) => ({ ...prev, arrivalTime: undefined })); }
    else setErrors((prev) => ({ ...prev, arrivalTime: "Enter a valid time" }));
  };
  const openPicker = () => {
    const time = normalizeTime(s.arrivalTime);
    if (time) update({ arrivalTime: time });
    setTimeOpen(true);
  };
  // Each panel's heading carries tabindex -1: the stepper's focus after an action
  // reaches it first, so a step change puts focus on the new step's heading.
  const heading = (step: number) => <h2 className="booking__step-title mtrl-title-large" tabIndex={-1}>{stepHeading(step)}</h2>;
  const action = (kind: "prev" | "next", label: string) => (
    <div {...(kind === "prev" ? { "data-stepper-prev": true } : { "data-stepper-next": true })}>
      <Button {...(kind === "prev" ? { variant: "outlined" as const } : {})}>{label}</Button>
    </div>
  );

  // orientation "auto" turns vertical below 600px of container width: the booking
  // column is at most 560px, so the headers stack and every label stays readable.
  return (
    <section className="booking">
      <Dialog headline="Confirm booking" open={dialogOpen} onClose={() => setDialogOpen(false)}
        actions={<>
          <Button variant="text" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="text" onClick={() => { setDialogOpen(false); setConfirmed(true); }}>Confirm booking</Button>
        </>}>
        <p>{summary(s)}</p>
      </Dialog>
      <div className="booking__intro">
        <h1 className="booking__title mtrl-headline-small">Book a stay</h1>
        <p className="booking__lede mtrl-body-medium">Four steps: dates, guests and room, extras, then your details. The total updates as you go.</p>
      </div>
      <Stepper ref={stepperRef} linear orientation="auto" ariaLabel="Booking steps" defaultValue="dates" onBeforechange={veto}>
        <Step value="dates" label="Dates and arrival">
          <div className="booking__step">
            {heading(1)}
            <div className="booking__grid">
              <Datepicker label="Check-in" variant="modal" closeOnSelect dateFormat="YYYY-MM-DD" value={s.checkIn}
                onChange={(e) => setS((prev) => withDates(prev, e.detail.value, prev.checkOut))} />
              <Datepicker label="Check-out" variant="modal" closeOnSelect dateFormat="YYYY-MM-DD" min={s.checkIn} value={s.checkOut}
                onChange={(e) => setS((prev) => withDates(prev, prev.checkIn, e.detail.value))} />
              <TextField ref={arrivalRef} label="Arrival time" value={s.arrivalTime} trailingIcon={CLOCK_ICON} trailingIconLabel="Choose time"
                supportingText={errors.arrivalTime ?? "24-hour time"} error={Boolean(errors.arrivalTime)}
                onInput={(e) => { update({ arrivalTime: e.detail.value }); setErrors((prev) => ({ ...prev, arrivalTime: undefined })); }}
                onChange={(e) => commitTime(e.detail.value)} onTrailing={openPicker} />
            </div>
            <footer className="booking__actions">{action("next", "Next")}</footer>
          </div>
        </Step>
        <Step value="guests" label="Guests and room">
          <div className="booking__step">
            {heading(2)}
            <div className="booking__grid">
              <Select label="Adults" value={s.adults} onChange={(e) => update({ adults: e.detail.value ?? s.adults })}>
                {ADULT_OPTIONS.map((n) => <SelectOption key={n} value={n}>{n}</SelectOption>)}
              </Select>
              <Select label="Children" value={s.children} onChange={(e) => update({ children: e.detail.value ?? s.children })}>
                {CHILD_OPTIONS.map((n) => <SelectOption key={n} value={n}>{n}</SelectOption>)}
              </Select>
            </div>
            <div className="booking__group">
              <p className="booking__label mtrl-title-small">Room type</p>
              <Radios aria-label="Room type" value={s.room} onChange={(e) => update({ room: e.detail.value ?? s.room })}>
                {ROOMS.map((room) => <Radio key={room.value} value={room.value} disabled={!eligible.has(room.value)}>{`${room.label} — $${room.rate} a night`}</Radio>)}
              </Radios>
            </div>
            <div className="booking__group">
              <p className="booking__label mtrl-title-small">Price range</p>
              <Slider ref={sliderRef} range showValue min={50} max={300} step={10} value={s.priceMin} secondValue={s.priceMax} aria-label="Price range"
                onInput={(e) => { setS((prev) => withPrice(prev, e.detail.value, e.detail.secondValue ?? prev.priceMax)); setErrors((prev) => ({ ...prev, room: undefined })); }} />
              <p className="booking__range mtrl-body-medium">{rangeText(s)}</p>
              {errors.room && <p className="booking__field-error mtrl-body-small">{errors.room}</p>}
            </div>
            <footer className="booking__actions">{action("prev", "Back")}{action("next", "Next")}</footer>
          </div>
        </Step>
        <Step value="extras" label="Extras">
          <div className="booking__step">
            {heading(3)}
            <div className="booking__group" role="group" aria-labelledby="extras-label">
              <p className="booking__label mtrl-title-small" id="extras-label">Extras</p>
              {EXTRAS.map((extra) => (
                <Checkbox key={extra.key} checked={s[extra.key]} onChange={(e) => update({ [extra.key]: e.detail.checked })}>
                  {`${extra.label} — $${extra.price} ${extra.unit}`}
                </Checkbox>
              ))}
            </div>
            <footer className="booking__actions">{action("prev", "Back")}{action("next", "Next")}</footer>
          </div>
        </Step>
        <Step value="details" label="Your details and review">
          <div className="booking__step">
            {heading(4)}
            <div className="booking__grid">
              <TextField ref={nameRef} label="Name" value={s.name} supportingText={errors.name ?? "Required"} error={Boolean(errors.name)}
                onInput={(e) => { update({ name: e.detail.value }); setErrors((prev) => ({ ...prev, name: undefined })); }} />
              <TextField ref={emailRef} label="Email" type="email" value={s.email} supportingText={errors.email ?? "Required"} error={Boolean(errors.email)}
                onInput={(e) => { update({ email: e.detail.value }); setErrors((prev) => ({ ...prev, email: undefined })); }} />
            </div>
            <div className="booking__group">
              {reviewLines(s).map((line) => (
                <div key={line.step} className="booking__review-row">
                  <div className="booking__review-copy">
                    <p className="booking__review-label mtrl-title-small">{line.label}</p>
                    <p className="booking__review-line mtrl-body-medium">{line.text}</p>
                  </div>
                  <div data-stepper-goto={stepValue(line.step)}>
                    <Button variant="text" ariaLabel={`Edit ${line.label}`}>Edit</Button>
                  </div>
                </div>
              ))}
            </div>
            <footer className="booking__actions">{action("prev", "Back")}<div><Button onClick={book}>Book</Button></div></footer>
          </div>
        </Step>
      </Stepper>
      <output className="booking__total mtrl-body-medium" role="status">{totalText(s)}</output>
      <Timepicker label="Arrival time" format="24h" value={normalizeTime(s.arrivalTime) ?? "15:00"} open={timeOpen}
        onChange={(e) => { update({ arrivalTime: e.detail.value }); setErrors((prev) => ({ ...prev, arrivalTime: undefined })); }} onClose={() => setTimeOpen(false)} />
      <Snackbar message="Booking confirmed" open={confirmed} onClose={() => setConfirmed(false)} />
    </section>
  );
}
