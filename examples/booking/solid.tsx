/** @jsxImportSource solid-js — this file's JSX is Solid's, not React's; tsc reads it. */
// Solid: material/solid wraps the same elements.
import { createSignal, Show, For } from "solid-js";
import { createStore } from "solid-js/store";
import { Button, Checkbox, Datepicker, Dialog, Progress, Radio, Radios, Select, SelectOption, Slider, Snackbar, TextField, Timepicker } from "material/solid";
import type { SliderElement, TextFieldElement } from "material/elements";
import { ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON, DEFAULTS, EXTRAS, ROOMS, eligibleRooms, normalizeTime, rangeText, reviewLines, roomOf, stepHeading, stepLabel, summary, totalText, validateStep, withDates, withPrice, type Booking, type BookingErrors } from "./shared";

/** The step header — one piece, so material's stepper can replace it whole when it lands. */
function StepHeader(props: { step: number; headingRef: (el: HTMLHeadingElement) => void }) {
  return (
    <header class="booking__step-header">
      <h2 ref={props.headingRef} class="booking__step-title mtrl-title-large" tabindex={-1}>{stepHeading(props.step)}</h2>
      <Progress max={4} value={props.step} ariaLabel={stepLabel(props.step)} />
    </header>
  );
}

export default function Booking() {
  const [s, setS] = createStore<Booking>({ ...DEFAULTS });
  const [errors, setErrors] = createStore<BookingErrors>({});
  const [step, setStep] = createSignal(1);
  const [dialogOpen, setDialogOpen] = createSignal(false);
  const [confirmed, setConfirmed] = createSignal(false);
  const [timeOpen, setTimeOpen] = createSignal(false);
  let heading: HTMLHeadingElement | undefined;
  let arrivalEl: TextFieldElement | undefined;
  let sliderEl: SliderElement | undefined;
  let nameEl: TextFieldElement | undefined;
  let emailEl: TextFieldElement | undefined;

  // A step change puts focus on the new step's heading, so screen readers announce it.
  const gotoStep = (next: number) => {
    setStep(next);
    heading?.focus();
  };
  const focusFirstInvalid = (current: number) => {
    if (current === 1) arrivalEl?.focus();
    else if (current === 2) {
      const handle = (sliderEl?.shadowRoot ?? sliderEl)?.querySelector<HTMLElement>('[role="slider"]');
      (handle ?? sliderEl)?.focus();
    }
  };
  const next = () => {
    const stepErrors = validateStep({ ...s }, step());
    setErrors("arrivalTime", stepErrors.arrivalTime);
    if (stepErrors.arrivalTime || stepErrors.room) { focusFirstInvalid(step()); return; }
    if (step() < 4) gotoStep(step() + 1);
  };
  const book = () => {
    const stepErrors = validateStep({ ...s }, 4);
    setErrors({ ...errors, name: stepErrors.name, email: stepErrors.email });
    if (!stepErrors.name && !stepErrors.email && roomOf({ ...s })) setDialogOpen(true);
    else if (stepErrors.name) nameEl?.focus();
    else if (stepErrors.email) emailEl?.focus();
  };
  const commitTime = (value: string) => {
    const time = normalizeTime(value);
    if (time) { setS("arrivalTime", time); setErrors("arrivalTime", undefined); }
    else setErrors("arrivalTime", "Enter a valid time");
  };

  return (
    <section class="booking">
      <Dialog headline="Confirm booking" open={dialogOpen()} onClose={() => setDialogOpen(false)}
        actions={<>
          <Button variant="text" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="text" onClick={() => { setDialogOpen(false); setConfirmed(true); }}>Confirm booking</Button>
        </>}>
        <p>{summary({ ...s })}</p>
      </Dialog>
      <div class="booking__intro">
        <h1 class="booking__title mtrl-headline-small">Book a stay</h1>
        <p class="booking__lede mtrl-body-medium">Four steps: dates, guests and room, extras, then your details. The total updates as you go.</p>
      </div>
      <StepHeader step={step()} headingRef={(el) => (heading = el)} />
      <Show when={step() === 1}>
        <div class="booking__step">
          <div class="booking__grid">
            <Datepicker label="Check-in" variant="modal" closeOnSelect dateFormat="YYYY-MM-DD" value={s.checkIn}
              onChange={(e) => setS(withDates({ ...s }, e.detail.value, s.checkOut))} />
            <Datepicker label="Check-out" variant="modal" closeOnSelect dateFormat="YYYY-MM-DD" min={s.checkIn} value={s.checkOut}
              onChange={(e) => setS(withDates({ ...s }, s.checkIn, e.detail.value))} />
            <TextField ref={arrivalEl} label="Arrival time" value={s.arrivalTime} trailingIcon={CLOCK_ICON} trailingIconLabel="Choose time"
              supportingText={errors.arrivalTime ?? "24-hour time"} error={Boolean(errors.arrivalTime)}
              onInput={(e) => { setS("arrivalTime", e.detail.value); setErrors("arrivalTime", undefined); }}
              onChange={(e) => commitTime(e.detail.value)}
              onTrailing={() => { const time = normalizeTime(s.arrivalTime); if (time) setS("arrivalTime", time); setTimeOpen(true); }} />
          </div>
        </div>
      </Show>
      <Show when={step() === 2}>
        <div class="booking__step">
          <div class="booking__grid">
            <Select label="Adults" value={s.adults} onChange={(e) => setS("adults", e.detail.value ?? s.adults)}>
              <For each={ADULT_OPTIONS}>{(n) => <SelectOption value={n}>{n}</SelectOption>}</For>
            </Select>
            <Select label="Children" value={s.children} onChange={(e) => setS("children", e.detail.value ?? s.children)}>
              <For each={CHILD_OPTIONS}>{(n) => <SelectOption value={n}>{n}</SelectOption>}</For>
            </Select>
          </div>
          <div class="booking__group">
            <p class="booking__label mtrl-title-small">Room type</p>
            <Radios aria-label="Room type" value={s.room} onChange={(e) => setS("room", e.detail.value ?? s.room)}>
              <For each={ROOMS}>{(room) => <Radio value={room.value} disabled={!eligibleRooms({ ...s }).some((r) => r.value === room.value)}>{`${room.label} — $${room.rate} a night`}</Radio>}</For>
            </Radios>
          </div>
          <div class="booking__group">
            <p class="booking__label mtrl-title-small">Price range</p>
            <Slider ref={sliderEl} range showValue min={50} max={300} step={10} value={s.priceMin} secondValue={s.priceMax} aria-label="Price range"
              onInput={(e) => setS(withPrice({ ...s }, e.detail.value, e.detail.secondValue ?? s.priceMax))} />
            <p class="booking__range mtrl-body-medium">{rangeText({ ...s })}</p>
          </div>
        </div>
      </Show>
      <Show when={step() === 3}>
        <div class="booking__step">
          <div class="booking__group" role="group" aria-labelledby="extras-label">
            <p class="booking__label mtrl-title-small" id="extras-label">Extras</p>
            <For each={EXTRAS}>
              {(extra) => (
                <Checkbox checked={s[extra.key]} onChange={(e) => setS(extra.key, e.detail.checked)}>
                  {`${extra.label} — $${extra.price} ${extra.unit}`}
                </Checkbox>
              )}
            </For>
          </div>
        </div>
      </Show>
      <Show when={step() === 4}>
        <div class="booking__step">
          <div class="booking__grid">
            <TextField ref={nameEl} label="Name" value={s.name} supportingText={errors.name ?? "Required"} error={Boolean(errors.name)}
              onInput={(e) => { setS("name", e.detail.value); setErrors("name", undefined); }} />
            <TextField ref={emailEl} label="Email" type="email" value={s.email} supportingText={errors.email ?? "Required"} error={Boolean(errors.email)}
              onInput={(e) => { setS("email", e.detail.value); setErrors("email", undefined); }} />
          </div>
          <div class="booking__group">
            <For each={reviewLines({ ...s })}>
              {(line) => (
                <div class="booking__review-row">
                  <p class="booking__review-line mtrl-body-medium">{line.text}</p>
                  <Button variant="text" ariaLabel={`Edit ${line.title}`} onClick={() => gotoStep(line.step)}>Edit</Button>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
      <output class="booking__total mtrl-body-medium" role="status">{totalText({ ...s })}</output>
      <footer class="booking__actions">
        <Show when={step() > 1}>
          <Button variant="outlined" onClick={() => gotoStep(step() - 1)}>Back</Button>
        </Show>
        <Show when={step() < 4} fallback={<Button onClick={book}>Book</Button>}>
          <Button onClick={next}>Next</Button>
        </Show>
      </footer>
      <Timepicker label="Arrival time" format="24h" value={normalizeTime(s.arrivalTime) ?? "15:00"} open={timeOpen()}
        onChange={(e) => { setS("arrivalTime", e.detail.value); setErrors("arrivalTime", undefined); }} onClose={() => setTimeOpen(false)} />
      <Snackbar message="Booking confirmed" open={confirmed()} onClose={() => setConfirmed(false)} />
    </section>
  );
}
