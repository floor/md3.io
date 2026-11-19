// React: material/react wraps the same elements.
import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { Button, Checkbox, Datepicker, Dialog, Progress, Radio, Radios, Select, SelectOption, Slider, Snackbar, TextField, Timepicker } from "material/react";
import type { SliderElement, TextFieldElement } from "material/elements";
import { ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON, DEFAULTS, EXTRAS, ROOMS, eligibleRooms, normalizeTime, rangeText, reviewLines, roomOf, stepHeading, stepLabel, summary, totalText, validateStep, withDates, withPrice, type Booking, type BookingErrors } from "./shared";

/** The step header — one piece, so material's stepper can replace it whole when it lands. */
function StepHeader({ step, headingRef }: { step: number; headingRef: RefObject<HTMLHeadingElement | null> }) {
  return (
    <header className="booking__step-header">
      <h2 ref={headingRef} className="booking__step-title mtrl-title-large" tabIndex={-1}>{stepHeading(step)}</h2>
      <Progress max={4} value={step} ariaLabel={stepLabel(step)} />
    </header>
  );
}

export default function Booking() {
  const [s, setS] = useState<Booking>(DEFAULTS);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const update = (patch: Partial<Booking>) => setS((prev) => ({ ...prev, ...patch }));
  const eligible = new Set(eligibleRooms(s).map((room) => room.value));
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const arrivalRef = useRef<TextFieldElement | null>(null);
  const sliderRef = useRef<SliderElement | null>(null);

  // A step change puts focus on the new step's heading, so screen readers announce
  // it — after the new step has committed, before anything is observed.
  const firstStep = useRef(true);
  useLayoutEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);
  const gotoStep = (next: number) => {
    setStep(next);
  };
  const focusFirstInvalid = (current: number) => {
    if (current === 1) arrivalRef.current?.focus();
    else if (current === 2) {
      const slider = sliderRef.current;
      const handle = (slider?.shadowRoot ?? slider)?.querySelector<HTMLElement>('[role="slider"]');
      (handle ?? slider)?.focus();
    }
  };
  const next = () => {
    const stepErrors = validateStep(s, step);
    setErrors((prev) => ({ ...prev, arrivalTime: stepErrors.arrivalTime, room: stepErrors.room }));
    if (stepErrors.arrivalTime || stepErrors.room) { focusFirstInvalid(step); return; }
    if (step < 4) gotoStep(step + 1);
  };
  const book = () => {
    const stepErrors = validateStep(s, 4);
    setErrors(stepErrors);
    if (!stepErrors.name && !stepErrors.email && roomOf(s)) setDialogOpen(true);
    else if (stepErrors.name) nameRef.current?.focus();
    else if (stepErrors.email) emailRef.current?.focus();
  };
  const nameRef = useRef<TextFieldElement | null>(null);
  const emailRef = useRef<TextFieldElement | null>(null);
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
      <StepHeader step={step} headingRef={headingRef} />
      {step === 1 && (
        <div className="booking__step">
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
        </div>
      )}
      {step === 2 && (
        <div className="booking__step">
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
        </div>
      )}
      {step === 3 && (
        <div className="booking__step">
          <div className="booking__group" role="group" aria-labelledby="extras-label">
            <p className="booking__label mtrl-title-small" id="extras-label">Extras</p>
            {EXTRAS.map((extra) => (
              <Checkbox key={extra.key} checked={s[extra.key]} onChange={(e) => update({ [extra.key]: e.detail.checked })}>
                {`${extra.label} — $${extra.price} ${extra.unit}`}
              </Checkbox>
            ))}
          </div>
        </div>
      )}
      {step === 4 && (
        <div className="booking__step">
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
                <Button variant="text" ariaLabel={`Edit ${line.label}`} onClick={() => gotoStep(line.step)}>Edit</Button>
              </div>
            ))}
          </div>
        </div>
      )}
      <output className="booking__total mtrl-body-medium" role="status">{totalText(s)}</output>
      <footer className="booking__actions">
        {step > 1 && <Button variant="outlined" onClick={() => gotoStep(step - 1)}>Back</Button>}
        {step < 4 ? <Button onClick={next}>Next</Button> : <Button onClick={book}>Book</Button>}
      </footer>
      <Timepicker label="Arrival time" format="24h" value={normalizeTime(s.arrivalTime) ?? "15:00"} open={timeOpen}
        onChange={(e) => { update({ arrivalTime: e.detail.value }); setErrors((prev) => ({ ...prev, arrivalTime: undefined })); }} onClose={() => setTimeOpen(false)} />
      <Snackbar message="Booking confirmed" open={confirmed} onClose={() => setConfirmed(false)} />
    </section>
  );
}
