// React: material/react wraps the same elements, and material-addons/react the
// stepper whose headers replace the hand-built step header and whose data-stepper-*
// actions replace the wiring between Back, Next and the panels.
import { useRef, useState } from "react";
import { Button, Card, Checkbox, Datepicker, Dialog, Select, SelectOption, Snackbar, TextField, Timepicker } from "material/react";
import { Stepper, Step } from "material-addons/react";
import type { StepperElement } from "material-addons/elements";
import type { StepperBeforeChangeEvent } from "material-addons/components/stepper";
import type { TextFieldElement } from "material/elements";
import { ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON, DEFAULTS, EXTRAS, HERO_IMAGE, PROPERTY, ROOMS, TODAY, normalizeTime, priceLines, rangeParts, reviewLines, roomAfter, roomOf, stayText, stepHeading, stepNumberOf, stepValue, summary, totalText, validateStep, withRange, type Booking, type BookingErrors } from "./shared";

export default function Booking() {
  const [s, setS] = useState<Booking>(DEFAULTS);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const update = (patch: Partial<Booking>) => setS((prev) => ({ ...prev, ...patch }));
  const stepperRef = useRef<StepperElement | null>(null);
  const arrivalRef = useRef<TextFieldElement | null>(null);
  const roomsRef = useRef<HTMLDivElement | null>(null);
  const stayRef = useRef<HTMLElement | null>(null);
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
    if (stepErrors.dates || stepErrors.arrivalTime) {
      // The payload's own preventDefault is what the stepper checks.
      event.detail.preventDefault();
      stepperRef.current?.setError(previousValue, true);
    } else stepperRef.current?.setError(previousValue, false);
    setErrors((prev) => ({ ...prev, arrivalTime: stepErrors.arrivalTime, dates: stepErrors.dates }));
    if (stepErrors.dates) (stayRef.current as unknown as HTMLElement)?.focus();
    else if (stepErrors.arrivalTime) arrivalRef.current?.focus();
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

  const selectRoom = (value: string, focus = false) => {
    update({ room: value });
    if (focus) requestAnimationFrame(() => roomsRef.current?.querySelector<HTMLElement>(`[data-room="${value}"]`)?.focus());
  };
  const onRoomKey = (event: { key: string; preventDefault: () => void }, value: string) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); selectRoom(roomAfter(value, 1), true); }
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); selectRoom(roomAfter(value, -1), true); }
    else if (event.key === "Home") { event.preventDefault(); selectRoom(ROOMS[0]!.value, true); }
    else if (event.key === "End") { event.preventDefault(); selectRoom(ROOMS[ROOMS.length - 1]!.value, true); }
    else if (event.key === " " || event.key === "Enter") { event.preventDefault(); selectRoom(value, true); }
  };
  const summaryPanel = (
    <Card variant="filled" headline="Price summary" className="booking__summary">
      <div className="booking__summary-lines">
        {priceLines(s).map((line) => (
          <div key={line.label} className="booking__price-line">
            <span className="booking__price-line mtrl-body-medium">{line.label}</span>
            <span className="booking__price-line mtrl-body-medium">{line.amount}</span>
          </div>
        ))}
        <div className="booking__price-total">
          <span className="booking__price-line mtrl-title-small">Total</span>
          <span className="booking__price-line mtrl-title-small">{totalText(s).replace("Estimated total ", "")}</span>
        </div>
        <p className="booking__lede mtrl-body-medium">{totalText(s)}</p>
        <p className="booking__lede mtrl-body-medium">{PROPERTY.policy}</p>
      </div>
    </Card>
  );
  // Each panel's heading carries tabindex -1: the stepper's focus after an action
  // reaches it first, so a step change puts focus on the new step's heading.
  const heading = (step: number) => <h2 className="booking__step-title mtrl-title-large" tabIndex={-1}>{stepHeading(step)}</h2>;
  const action = (kind: "prev" | "next", label: string) => (
    <div {...(kind === "prev" ? { "data-stepper-prev": true } : { "data-stepper-next": true })}>
      <Button {...(kind === "prev" ? { variant: "outlined" as const } : {})}>{label}</Button>
    </div>
  );

  // orientation "auto" turns vertical below 600px of container width: the widened
  // booking column passes that on Desktop and Tablet frames, and stays vertical
  // on Mobile; labels sit below their indicators so all four fit on Tablet.
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
        <img className="booking__hero" src={HERO_IMAGE} alt={`The Dune House above the dunes in ${PROPERTY.town}`} loading="lazy" />
        <h1 className="booking__title mtrl-headline-small">{PROPERTY.name}</h1>
        <p className="booking__lede mtrl-body-medium">{PROPERTY.town} · {PROPERTY.rating}</p>
        <p className="booking__lede mtrl-body-medium">{PROPERTY.lede}</p>
        <p className="booking__lede mtrl-body-medium">{PROPERTY.facts}</p>
      </div>
      <div className="booking__layout">
      <Stepper ref={stepperRef} linear orientation="auto" labelPlacement="bottom" ariaLabel="Booking steps" defaultValue="dates" onBeforechange={veto}>
        <Step value="dates" label="Dates and arrival">
          <div className="booking__step">
            {heading(1)}
            <div className="booking__grid">
              <Datepicker ref={stayRef as never} label="Check-in → Check-out" variant="modal" selectionMode="range" dateFormat="YYYY-MM-DD" min={TODAY} value={`${s.checkIn}/${s.checkOut}`}
                onChange={(e) => { const parts = rangeParts(e.detail.value); if (parts) { setS((prev) => withRange(prev, parts[0], parts[1])); setErrors((prev) => ({ ...prev, dates: undefined })); } }} />
              <TextField ref={arrivalRef} label="Arrival time" value={s.arrivalTime} trailingIcon={CLOCK_ICON} trailingIconLabel="Choose time"
                supportingText={errors.arrivalTime ?? "24-hour time"} error={Boolean(errors.arrivalTime)}
                onInput={(e) => { update({ arrivalTime: e.detail.value }); setErrors((prev) => ({ ...prev, arrivalTime: undefined })); }}
                onChange={(e) => commitTime(e.detail.value)} onTrailing={openPicker} />
            </div>
            <p className="booking__stay mtrl-body-medium">{stayText(s)}</p>
            {errors.dates && <p className="booking__field-error mtrl-body-small">{errors.dates}</p>}
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
              <div className="booking__rooms" role="radiogroup" aria-label="Room type" ref={roomsRef}>
                {ROOMS.map((room) => (
                  <div key={room.value} className="booking__room" role="radio" aria-label={`${room.label}, ${room.beds}, ${room.size}, $${room.rate} a night, ${room.features}`} aria-checked={s.room === room.value} tabIndex={s.room === room.value ? 0 : -1} data-room={room.value}
                    onClick={() => selectRoom(room.value, true)} onKeyDown={(e) => onRoomKey(e, room.value)}>
                    <Card variant="outlined">
                      <div className="booking__room-card">
                        <img className="booking__room-image" src={room.image} alt="" loading="lazy" />
                        <p className="booking__room-name mtrl-title-medium">{room.label}</p>
                        <p className="booking__room-facts mtrl-body-medium">{room.beds} · {room.size}</p>
                        <p className="booking__room-price mtrl-body-medium">${room.rate} a night</p>
                        <p className="booking__room-features mtrl-body-medium">{room.features}</p>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
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
      {summaryPanel}
      </div>
      <Timepicker label="Arrival time" format="24h" value={normalizeTime(s.arrivalTime) ?? "15:00"} open={timeOpen}
        onChange={(e) => { update({ arrivalTime: e.detail.value }); setErrors((prev) => ({ ...prev, arrivalTime: undefined })); }} onClose={() => setTimeOpen(false)} />
      <Snackbar message="Booking confirmed" open={confirmed} onClose={() => setConfirmed(false)} />
    </section>
  );
}
