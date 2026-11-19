/** @jsxImportSource solid-js — this file's JSX is Solid's, not React's; tsc reads it. */
// Solid: material/solid wraps the same elements.
import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { Button, Checkbox, Datepicker, Dialog, Radio, Radios, Select, SelectOption, Slider, Snackbar, TextField, Timepicker } from "material/solid";
import { ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON, DEFAULTS, EXTRAS, ROOMS, eligibleRooms, normalizeTime, rangeText, roomOf, summary, totalText, validate, withDates, withPrice, type Booking, type BookingErrors } from "./shared";

export default function Booking() {
  const [s, setS] = createStore<Booking>({ ...DEFAULTS });
  const [errors, setErrors] = createStore<BookingErrors>({});
  const [dialogOpen, setDialogOpen] = createSignal(false);
  const [confirmed, setConfirmed] = createSignal(false);
  const [timeOpen, setTimeOpen] = createSignal(false);

  const book = () => {
    const next = validate({ ...s });
    setErrors(next);
    if (!next.name && !next.email && !next.arrivalTime && roomOf({ ...s })) setDialogOpen(true);
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
        <p class="booking__lede mtrl-body-medium">Choose dates, guests and a room. The total updates as you go.</p>
      </div>
      <div class="booking__grid">
        <Datepicker label="Check-in" variant="modal" closeOnSelect dateFormat="YYYY-MM-DD" value={s.checkIn}
          onChange={(e) => setS(withDates({ ...s }, e.detail.value, s.checkOut))} />
        <Datepicker label="Check-out" variant="modal" closeOnSelect dateFormat="YYYY-MM-DD" min={s.checkIn} value={s.checkOut}
          onChange={(e) => setS(withDates({ ...s }, s.checkIn, e.detail.value))} />
        <TextField label="Arrival time" value={s.arrivalTime} trailingIcon={CLOCK_ICON} trailingIconLabel="Choose time"
          supportingText={errors.arrivalTime ?? "24-hour time"} error={Boolean(errors.arrivalTime)}
          onInput={(e) => { setS("arrivalTime", e.detail.value); setErrors("arrivalTime", undefined); }}
          onChange={(e) => commitTime(e.detail.value)}
          onTrailing={() => { const time = normalizeTime(s.arrivalTime); if (time) setS("arrivalTime", time); setTimeOpen(true); }} />
        <TextField label="Name" value={s.name} supportingText={errors.name ?? "Required"} error={Boolean(errors.name)}
          onInput={(e) => { setS("name", e.detail.value); setErrors("name", undefined); }} />
        <Select label="Adults" value={s.adults} onChange={(e) => setS("adults", e.detail.value ?? s.adults)}>
          {ADULT_OPTIONS.map((n) => <SelectOption value={n}>{n}</SelectOption>)}
        </Select>
        <Select label="Children" value={s.children} onChange={(e) => setS("children", e.detail.value ?? s.children)}>
          {CHILD_OPTIONS.map((n) => <SelectOption value={n}>{n}</SelectOption>)}
        </Select>
        <TextField label="Email" type="email" value={s.email} supportingText={errors.email ?? "Required"} error={Boolean(errors.email)}
          onInput={(e) => { setS("email", e.detail.value); setErrors("email", undefined); }} />
      </div>
      <div class="booking__group">
        <p class="booking__label mtrl-title-small">Room type</p>
        <Radios aria-label="Room type" value={s.room} onChange={(e) => setS("room", e.detail.value ?? s.room)}>
          {ROOMS.map((room) => <Radio value={room.value} disabled={!eligibleRooms({ ...s }).some((r) => r.value === room.value)}>{`${room.label} — $${room.rate} a night`}</Radio>)}
        </Radios>
      </div>
      <div class="booking__group" role="group" aria-labelledby="extras-label">
        <p class="booking__label mtrl-title-small" id="extras-label">Extras</p>
        {EXTRAS.map((extra) => (
          <Checkbox checked={s[extra.key]} onChange={(e) => setS(extra.key, e.detail.checked)}>
            {`${extra.label} — $${extra.price} ${extra.unit}`}
          </Checkbox>
        ))}
      </div>
      <div class="booking__group">
        <p class="booking__label mtrl-title-small">Price range</p>
        <Slider range showValue min={50} max={300} step={10} value={s.priceMin} secondValue={s.priceMax} aria-label="Price range"
          onInput={(e) => setS(withPrice({ ...s }, e.detail.value, e.detail.secondValue ?? s.priceMax))} />
        <p class="booking__range mtrl-body-medium">{rangeText({ ...s })}</p>
      </div>
      <output class="booking__total mtrl-body-medium" role="status">{totalText({ ...s })}</output>
      <footer class="booking__actions"><Button onClick={book}>Book</Button></footer>
      <Timepicker label="Arrival time" format="24h" value={normalizeTime(s.arrivalTime) ?? "15:00"} open={timeOpen()}
        onChange={(e) => { setS("arrivalTime", e.detail.value); setErrors("arrivalTime", undefined); }} onClose={() => setTimeOpen(false)} />
      <Snackbar message="Booking confirmed" open={confirmed()} onClose={() => setConfirmed(false)} />
    </section>
  );
}
