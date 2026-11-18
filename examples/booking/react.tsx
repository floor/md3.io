// React: material/react wraps the same elements.
import { useState } from "react";
import { Button, Checkbox, Datepicker, Dialog, Radio, Radios, Select, SelectOption, Slider, Snackbar, TextField, Timepicker } from "material/react";
import { ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON, DEFAULTS, EXTRAS, ROOMS, summary, totalText, validate, withDates, type Booking, type BookingErrors } from "./shared";

export default function Booking() {
  const [s, setS] = useState<Booking>(DEFAULTS);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const update = (patch: Partial<Booking>) => setS((prev) => ({ ...prev, ...patch }));

  const book = () => {
    const next = validate(s);
    setErrors(next);
    if (!next.name && !next.email) setDialogOpen(true);
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
        <p className="booking__title">Book a stay</p>
        <p className="booking__lede">Choose dates, guests and a room. The total updates as you go.</p>
      </div>
      <div className="booking__grid">
        <Datepicker label="Check-in" variant="modal" closeOnSelect dateFormat="YYYY-MM-DD" value={s.checkIn}
          onChange={(e) => setS((prev) => withDates(prev, e.detail.value, prev.checkOut))} />
        <Datepicker label="Check-out" variant="modal" closeOnSelect dateFormat="YYYY-MM-DD" min={s.checkIn} value={s.checkOut}
          onChange={(e) => setS((prev) => withDates(prev, prev.checkIn, e.detail.value))} />
        <TextField label="Arrival time" value={s.arrivalTime} trailingIcon={CLOCK_ICON} trailingIconLabel="Choose time"
          onInput={(e) => update({ arrivalTime: e.detail.value })} onTrailing={() => setTimeOpen(true)} />
        <TextField label="Name" value={s.name} supportingText={errors.name ?? "Required"} error={Boolean(errors.name)}
          onInput={(e) => { update({ name: e.detail.value }); setErrors((prev) => ({ ...prev, name: undefined })); }} />
        <Select label="Adults" value={s.adults} onChange={(e) => update({ adults: e.detail.value ?? s.adults })}>
          {ADULT_OPTIONS.map((n) => <SelectOption key={n} value={n}>{n}</SelectOption>)}
        </Select>
        <Select label="Children" value={s.children} onChange={(e) => update({ children: e.detail.value ?? s.children })}>
          {CHILD_OPTIONS.map((n) => <SelectOption key={n} value={n}>{n}</SelectOption>)}
        </Select>
        <TextField label="Email" type="email" value={s.email} supportingText={errors.email ?? "Required"} error={Boolean(errors.email)}
          onInput={(e) => { update({ email: e.detail.value }); setErrors((prev) => ({ ...prev, email: undefined })); }} />
      </div>
      <div className="booking__group">
        <p className="booking__label">Room type</p>
        <Radios aria-label="Room type" value={s.room} onChange={(e) => update({ room: e.detail.value ?? s.room })}>
          {ROOMS.map((room) => <Radio key={room.value} value={room.value}>{`${room.label} — $${room.rate} a night`}</Radio>)}
        </Radios>
      </div>
      <div className="booking__group">
        <p className="booking__label">Extras</p>
        {EXTRAS.map((extra) => (
          <Checkbox key={extra.key} checked={s[extra.key]} onChange={(e) => update({ [extra.key]: e.detail.checked })}>
            {`${extra.label} — $${extra.price} ${extra.unit}`}
          </Checkbox>
        ))}
      </div>
      <div className="booking__group">
        <p className="booking__label">Price range</p>
        <Slider range min={50} max={300} step={10} value={s.priceMin} secondValue={s.priceMax} aria-label="Price range"
          onInput={(e) => update({ priceMin: e.detail.value, priceMax: e.detail.secondValue ?? s.priceMax })} />
      </div>
      <footer className="booking__actions"><Button onClick={book}>Book</Button></footer>
      <output className="booking__total" role="status">{totalText(s)}</output>
      <Timepicker label="Arrival time" format="24h" value={s.arrivalTime} open={timeOpen}
        onChange={(e) => update({ arrivalTime: e.detail.value })} onClose={() => setTimeOpen(false)} />
      <Snackbar message="Booking confirmed" open={confirmed} onClose={() => setConfirmed(false)} />
    </section>
  );
}
