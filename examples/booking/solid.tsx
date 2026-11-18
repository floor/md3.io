// Solid: material/solid wraps the same elements.
import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { Button, Checkbox, Datepicker, Dialog, Radio, Radios, Select, SelectOption, Slider, Snackbar, TextField, Timepicker } from "material/solid";
import { ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON, DEFAULTS, EXTRAS, ROOMS, summary, totalText, validate, withDates, type Booking, type BookingErrors } from "./shared";

export default function Booking() {
  const [s, setS] = createStore<Booking>({ ...DEFAULTS });
  const [errors, setErrors] = createStore<BookingErrors>({});
  const [dialogOpen, setDialogOpen] = createSignal(false);
  const [confirmed, setConfirmed] = createSignal(false);
  const [timeOpen, setTimeOpen] = createSignal(false);

  const book = () => {
    const next = validate(s);
    setErrors(next);
    if (!next.name && !next.email) setDialogOpen(true);
  };

  return (
    <section class="booking">
      <Dialog headline="Confirm booking" open={dialogOpen()} onClose={() => setDialogOpen(false)}
        actions={<>
          <Button variant="text" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="text" onClick={() => { setDialogOpen(false); setConfirmed(true); }}>Confirm booking</Button>
        </>}>
        <p>{summary(s)}</p>
      </Dialog>
      <div class="booking__intro">
        <p class="booking__title">Book a stay</p>
        <p class="booking__lede">Choose dates, guests and a room. The total updates as you go.</p>
      </div>
      <div class="booking__grid">
        <Datepicker label="Check-in" variant="modal" closeOnSelect dateFormat="YYYY-MM-DD" value={s.checkIn}
          onChange={(e) => setS(withDates({ ...s }, e.detail.value, s.checkOut))} />
        <Datepicker label="Check-out" variant="modal" closeOnSelect dateFormat="YYYY-MM-DD" min={s.checkIn} value={s.checkOut}
          onChange={(e) => setS(withDates({ ...s }, s.checkIn, e.detail.value))} />
        <TextField label="Arrival time" value={s.arrivalTime} trailingIcon={CLOCK_ICON} trailingIconLabel="Choose time"
          onInput={(e) => setS("arrivalTime", e.detail.value)} onTrailing={() => setTimeOpen(true)} />
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
        <p class="booking__label">Room type</p>
        <Radios aria-label="Room type" value={s.room} onChange={(e) => setS("room", e.detail.value ?? s.room)}>
          {ROOMS.map((room) => <Radio value={room.value}>{`${room.label} — $${room.rate} a night`}</Radio>)}
        </Radios>
      </div>
      <div class="booking__group">
        <p class="booking__label">Extras</p>
        {EXTRAS.map((extra) => (
          <Checkbox checked={s[extra.key]} onChange={(e) => setS(extra.key, e.detail.checked)}>
            {`${extra.label} — $${extra.price} ${extra.unit}`}
          </Checkbox>
        ))}
      </div>
      <div class="booking__group">
        <p class="booking__label">Price range</p>
        <Slider range min={50} max={300} step={10} value={s.priceMin} secondValue={s.priceMax} aria-label="Price range"
          onInput={(e) => { setS("priceMin", e.detail.value); setS("priceMax", e.detail.secondValue ?? s.priceMax); }} />
      </div>
      <footer class="booking__actions"><Button onClick={book}>Book</Button></footer>
      <output class="booking__total" role="status">{totalText(s)}</output>
      <Timepicker label="Arrival time" format="24h" value={s.arrivalTime} open={timeOpen()}
        onChange={(e) => setS("arrivalTime", e.detail.value)} onClose={() => setTimeOpen(false)} />
      <Snackbar message="Booking confirmed" open={confirmed()} onClose={() => setConfirmed(false)} />
    </section>
  );
}
