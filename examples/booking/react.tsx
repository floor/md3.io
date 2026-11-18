// React: material/react wraps the same elements.
import { useState } from "react";
import { Button, Checkbox, Datepicker, Dialog, Radio, Radios, Select, SelectOption, Slider, Snackbar, TextField, Timepicker } from "material/react";
import { ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON, DEFAULTS, EXTRAS, ROOMS, eligibleRooms, normalizeTime, rangeText, roomOf, summary, totalText, validate, withDates, withPrice, type Booking, type BookingErrors } from "./shared";

export default function Booking() {
  const [s, setS] = useState<Booking>(DEFAULTS);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const update = (patch: Partial<Booking>) => setS((prev) => ({ ...prev, ...patch }));
  const eligible = new Set(eligibleRooms(s).map((room) => room.value));

  const book = () => {
    const next = validate(s);
    setErrors(next);
    if (!next.name && !next.email && !next.arrivalTime && roomOf(s)) setDialogOpen(true);
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
        <h2 className="booking__title mtrl-headline-small">Book a stay</h2>
        <p className="booking__lede mtrl-body-medium">Choose dates, guests and a room. The total updates as you go.</p>
      </div>
      <div className="booking__grid">
        <Datepicker label="Check-in" variant="modal" closeOnSelect dateFormat="YYYY-MM-DD" value={s.checkIn}
          onChange={(e) => setS((prev) => withDates(prev, e.detail.value, prev.checkOut))} />
        <Datepicker label="Check-out" variant="modal" closeOnSelect dateFormat="YYYY-MM-DD" min={s.checkIn} value={s.checkOut}
          onChange={(e) => setS((prev) => withDates(prev, prev.checkIn, e.detail.value))} />
        <TextField label="Arrival time" value={s.arrivalTime} trailingIcon={CLOCK_ICON} trailingIconLabel="Choose time"
          supportingText={errors.arrivalTime ?? "24-hour time"} error={Boolean(errors.arrivalTime)}
          onInput={(e) => { update({ arrivalTime: e.detail.value }); setErrors((prev) => ({ ...prev, arrivalTime: undefined })); }}
          onChange={(e) => commitTime(e.detail.value)} onTrailing={openPicker} />
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
        <p className="booking__label mtrl-title-small">Room type</p>
        <Radios aria-label="Room type" value={s.room} onChange={(e) => update({ room: e.detail.value ?? s.room })}>
          {ROOMS.map((room) => <Radio key={room.value} value={room.value} disabled={!eligible.has(room.value)}>{`${room.label} — $${room.rate} a night`}</Radio>)}
        </Radios>
      </div>
      <div className="booking__group" role="group" aria-labelledby="extras-label">
        <p className="booking__label mtrl-title-small" id="extras-label">Extras</p>
        {EXTRAS.map((extra) => (
          <Checkbox key={extra.key} checked={s[extra.key]} onChange={(e) => update({ [extra.key]: e.detail.checked })}>
            {`${extra.label} — $${extra.price} ${extra.unit}`}
          </Checkbox>
        ))}
      </div>
      <div className="booking__group">
        <p className="booking__label mtrl-title-small">Price range</p>
        <Slider range showValue min={50} max={300} step={10} value={s.priceMin} secondValue={s.priceMax} aria-label="Price range"
          onInput={(e) => setS((prev) => withPrice(prev, e.detail.value, e.detail.secondValue ?? prev.priceMax))} />
        <p className="booking__range mtrl-body-medium">{rangeText(s)}</p>
      </div>
      <output className="booking__total mtrl-body-medium" role="status">{totalText(s)}</output>
      <footer className="booking__actions"><Button onClick={book}>Book</Button></footer>
      <Timepicker label="Arrival time" format="24h" value={normalizeTime(s.arrivalTime) ?? "15:00"} open={timeOpen}
        onChange={(e) => { update({ arrivalTime: e.detail.value }); setErrors((prev) => ({ ...prev, arrivalTime: undefined })); }} onClose={() => setTimeOpen(false)} />
      <Snackbar message="Booking confirmed" open={confirmed} onClose={() => setConfirmed(false)} />
    </section>
  );
}
