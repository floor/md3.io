/** @jsxImportSource solid-js — this file's JSX is Solid's, not React's; tsc reads it. */
// Solid: material/solid wraps the same elements, material-addons/solid the stepper
// whose headers replace the hand-built step header and whose data-stepper-* actions
// replace the wiring between Back, Next and the panels.
import { createSignal, Show, For } from "solid-js";
import { createStore } from "solid-js/store";
import { Button, Card, Checkbox, Datepicker, Dialog, Select, SelectOption, Snackbar, TextField, Timepicker } from "material/solid";
import { Stepper, Step } from "material-addons/solid";
import type { StepperElement } from "material-addons/elements";
import type { StepperBeforeChangeEvent } from "material-addons/components/stepper";
import type { TextFieldElement } from "material/elements";
import { ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON, DEFAULTS, EXTRAS, HERO_IMAGE, PROPERTY, ROOMS, TODAY, normalizeTime, priceLines, rangeParts, reviewLines, roomAfter, roomOf, stayText, stepHeading, stepNumberOf, stepValue, summary, totalText, validateStep, withRange, type Booking, type BookingErrors } from "./shared";

export default function Booking() {
  const [s, setS] = createStore<Booking>({ ...DEFAULTS });
  const [errors, setErrors] = createStore<BookingErrors>({});
  const [dialogOpen, setDialogOpen] = createSignal(false);
  const [confirmed, setConfirmed] = createSignal(false);
  const [timeOpen, setTimeOpen] = createSignal(false);
  let stepperEl: StepperElement | undefined;
  let arrivalEl: TextFieldElement | undefined;
  let roomsEl: HTMLDivElement | undefined;
  let stayEl: HTMLElement | undefined;
  let nameEl: TextFieldElement | undefined;
  let emailEl: TextFieldElement | undefined;

  const focusFirstInvalid = (n: number) => {
    if (n === 1) {
      if (validateStep({ ...s }, 1).dates) stayEl?.focus(); else arrivalEl?.focus();
    }
  };
  // The adapter exposes no validator functions, so a forward move is checked in the
  // stepper's cancellable beforechange: an invalid step vetoes the move (the payload's
  // own preventDefault is what the stepper checks) and the stepper's error state is
  // set to mirror what the factory's pipeline would do. The message shows at the
  // field, with focus on the first one that needs fixing.
  const veto = (event: CustomEvent<StepperBeforeChangeEvent>): void => {
    if (event.detail.direction !== "forward" || event.detail.previousValue === null) return;
    const { previousValue } = event.detail;
    const n = stepNumberOf(previousValue);
    const stepErrors = validateStep({ ...s }, n);
    setErrors("arrivalTime", stepErrors.arrivalTime);
    setErrors("dates", stepErrors.dates);
    if (stepErrors.dates || stepErrors.arrivalTime) {
      event.detail.preventDefault();
      stepperEl?.setError(previousValue, true);
      focusFirstInvalid(n);
    } else stepperEl?.setError(previousValue, false);
  };
  // Book validates the details itself: it is not a move, so the stepper has no say in it.
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

  const selectRoom = (value: string, focus = false) => {
    setS("room", value);
    if (focus) requestAnimationFrame(() => roomsEl?.querySelector<HTMLElement>(`[data-room="${value}"]`)?.focus());
  };
  const onRoomKey = (event: { key: string; preventDefault: () => void }, value: string) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); selectRoom(roomAfter(value, 1), true); }
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); selectRoom(roomAfter(value, -1), true); }
    else if (event.key === "Home") { event.preventDefault(); selectRoom(ROOMS[0]!.value, true); }
    else if (event.key === "End") { event.preventDefault(); selectRoom(ROOMS[ROOMS.length - 1]!.value, true); }
    else if (event.key === " " || event.key === "Enter") { event.preventDefault(); selectRoom(value, true); }
  };
  const summaryPanel = (
    <Card variant="filled" headline="Price summary" class="booking__summary">
      <div class="booking__summary-lines">
        <For each={priceLines({ ...s })}>{(line) => (
          <div class="booking__price-line">
            <span class="booking__price-line mtrl-body-medium">{line.label}</span>
            <span class="booking__price-line mtrl-body-medium">{line.amount}</span>
          </div>
        )}</For>
        <div class="booking__price-total">
          <span class="booking__price-line mtrl-title-small">Total</span>
          <span class="booking__price-line mtrl-title-small">{totalText({ ...s }).replace("Estimated total ", "")}</span>
        </div>
        <p class="booking__lede mtrl-body-medium">{totalText({ ...s })}</p>
        <p class="booking__lede mtrl-body-medium">{PROPERTY.policy}</p>
      </div>
    </Card>
  );
  // Each panel's heading carries tabindex -1: the stepper's focus after an action
  // reaches it first, so a step change puts focus on the new step's heading.
  const heading = (step: number) => <h2 class="booking__step-title mtrl-title-large" tabindex={-1}>{stepHeading(step)}</h2>;
  const action = (kind: "prev" | "next", label: string) => (
    <div {...(kind === "prev" ? { "data-stepper-prev": true } : { "data-stepper-next": true })}>
      <Button {...(kind === "prev" ? { variant: "outlined" as const } : {})}>{label}</Button>
    </div>
  );

  // orientation "auto" turns vertical below 600px of container width: the widened
  // booking column passes that on Desktop and Tablet frames, and stays vertical
  // on Mobile; labels sit below their indicators so all four fit on Tablet.
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
        <img class="booking__hero" src={HERO_IMAGE} alt={`The Dune House above the dunes in ${PROPERTY.town}`} loading="lazy" />
        <h1 class="booking__title mtrl-headline-small">{PROPERTY.name}</h1>
        <p class="booking__lede mtrl-body-medium">{PROPERTY.town} · {PROPERTY.rating}</p>
        <p class="booking__lede mtrl-body-medium">{PROPERTY.lede}</p>
        <p class="booking__lede mtrl-body-medium">{PROPERTY.facts}</p>
      </div>
      <div class="booking__layout">
      <Stepper ref={(el) => (stepperEl = el)} linear orientation="auto" labelPlacement="bottom" ariaLabel="Booking steps" defaultValue="dates" onBeforechange={veto}>
        <Step value="dates" label="Dates and arrival">
          <div class="booking__step">
            {heading(1)}
            <div class="booking__grid">
              <Datepicker ref={(el) => (stayEl = el as unknown as HTMLElement)} label="Check-in → Check-out" variant="modal" selectionMode="range" dateFormat="YYYY-MM-DD" min={TODAY} value={`${s.checkIn}/${s.checkOut}`}
                onChange={(e) => { const parts = rangeParts(e.detail.value); if (parts) { setS(withRange({ ...s }, parts[0], parts[1])); setErrors("dates", undefined); } }} />
              <TextField ref={arrivalEl} label="Arrival time" value={s.arrivalTime} trailingIcon={CLOCK_ICON} trailingIconLabel="Choose time"
                supportingText={errors.arrivalTime ?? "24-hour time"} error={Boolean(errors.arrivalTime)}
                onInput={(e) => { setS("arrivalTime", e.detail.value); setErrors("arrivalTime", undefined); }}
                onChange={(e) => commitTime(e.detail.value)}
                onTrailing={() => { const time = normalizeTime(s.arrivalTime); if (time) setS("arrivalTime", time); setTimeOpen(true); }} />
            </div>
            <p class="booking__stay mtrl-body-medium">{stayText({ ...s })}</p>
            <Show when={errors.dates}><p class="booking__field-error mtrl-body-small">{errors.dates}</p></Show>
            <footer class="booking__actions">{action("next", "Next")}</footer>
          </div>
        </Step>
        <Step value="guests" label="Guests and room">
          <div class="booking__step">
            {heading(2)}
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
              <div class="booking__rooms" role="radiogroup" aria-label="Room type" ref={roomsEl}>
                <For each={ROOMS}>{(room) => (
                  <div class="booking__room" role="radio" aria-label={`${room.label}, ${room.beds}, ${room.size}, $${room.rate} a night, ${room.features}`} aria-checked={s.room === room.value} tabIndex={s.room === room.value ? 0 : -1} data-room={room.value}
                    onClick={() => selectRoom(room.value, true)} onKeyDown={(e) => onRoomKey(e, room.value)}>
                    <Card variant="outlined">
                      <div class="booking__room-card">
                        <img class="booking__room-image" src={room.image} alt="" loading="lazy" />
                        <p class="booking__room-name mtrl-title-medium">{room.label}</p>
                        <p class="booking__room-facts mtrl-body-medium">{room.beds} · {room.size}</p>
                        <p class="booking__room-price mtrl-body-medium">${room.rate} a night</p>
                        <p class="booking__room-features mtrl-body-medium">{room.features}</p>
                      </div>
                    </Card>
                  </div>
                )}</For>
              </div>
            </div>
            <footer class="booking__actions">{action("prev", "Back")}{action("next", "Next")}</footer>
          </div>
        </Step>
        <Step value="extras" label="Extras">
          <div class="booking__step">
            {heading(3)}
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
            <footer class="booking__actions">{action("prev", "Back")}{action("next", "Next")}</footer>
          </div>
        </Step>
        <Step value="details" label="Your details and review">
          <div class="booking__step">
            {heading(4)}
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
                    <div class="booking__review-copy">
                      <p class="booking__review-label mtrl-title-small">{line.label}</p>
                      <p class="booking__review-line mtrl-body-medium">{line.text}</p>
                    </div>
                    <div data-stepper-goto={stepValue(line.step)}>
                      <Button variant="text" ariaLabel={`Edit ${line.label}`}>Edit</Button>
                    </div>
                  </div>
                )}
              </For>
            </div>
            <footer class="booking__actions">{action("prev", "Back")}<div><Button onClick={book}>Book</Button></div></footer>
          </div>
        </Step>
      </Stepper>
      {summaryPanel}
      </div>
      <Timepicker label="Arrival time" format="24h" value={normalizeTime(s.arrivalTime) ?? "15:00"} open={timeOpen()}
        onChange={(e) => { setS("arrivalTime", e.detail.value); setErrors("arrivalTime", undefined); }} onClose={() => setTimeOpen(false)} />
      <Snackbar message="Booking confirmed" open={confirmed()} onClose={() => setConfirmed(false)} />
    </section>
  );
}
