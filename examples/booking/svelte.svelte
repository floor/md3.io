<!-- Svelte: material/svelte wraps the same elements; bind: keeps their live state. -->
<script lang="ts">
  import { Button, Checkbox, Datepicker, Dialog, Radio, Radios, Select, SelectOption, Slider, Snackbar, TextField, Timepicker } from "material/svelte";
  import { ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON, DEFAULTS, EXTRAS, ROOMS, eligibleRooms, normalizeTime, rangeText, roomOf, summary, totalText, validate, withDates, withPrice, type BookingErrors } from "./shared";

  let s = $state({ ...DEFAULTS });
  let errors = $state<BookingErrors>({});
  let dialogOpen = $state(false);
  let confirmed = $state(false);
  let timeOpen = $state(false);

  const book = () => {
    errors = validate(s);
    if (!errors.name && !errors.email && !errors.arrivalTime && roomOf(s)) dialogOpen = true;
  };
  const confirm = () => { dialogOpen = false; confirmed = true; };
  const commitTime = (value: string) => {
    const time = normalizeTime(value);
    if (time) { s.arrivalTime = time; errors = { ...errors, arrivalTime: undefined }; }
    else errors = { ...errors, arrivalTime: "Enter a valid time" };
  };
</script>

<section class="booking">
  <Dialog headline="Confirm booking" open={dialogOpen} onclose={() => (dialogOpen = false)}>
    <p>{summary(s)}</p>
    {#snippet actions()}
      <Button variant="text" onclick={() => (dialogOpen = false)}>Cancel</Button>
      <Button variant="text" onclick={confirm}>Confirm booking</Button>
    {/snippet}
  </Dialog>
  <div class="booking__intro">
    <h1 class="booking__title mtrl-headline-small">Book a stay</h1>
    <p class="booking__lede mtrl-body-medium">Choose dates, guests and a room. The total updates as you go.</p>
  </div>
  <div class="booking__grid">
    <Datepicker label="Check-in" variant="modal" closeOnSelect dateFormat="YYYY-MM-DD" value={s.checkIn}
      onchange={(e) => (s = withDates(s, e.detail.value, s.checkOut))} />
    <Datepicker label="Check-out" variant="modal" closeOnSelect dateFormat="YYYY-MM-DD" min={s.checkIn} value={s.checkOut}
      onchange={(e) => (s = withDates(s, s.checkIn, e.detail.value))} />
    <TextField label="Arrival time" value={s.arrivalTime} trailingIcon={CLOCK_ICON} trailingIconLabel="Choose time"
      supportingText={errors.arrivalTime ?? "24-hour time"} error={Boolean(errors.arrivalTime)}
      oninput={(e) => { s.arrivalTime = e.detail.value; errors = { ...errors, arrivalTime: undefined }; }}
      onchange={(e) => commitTime(e.detail.value)}
      ontrailing={() => { const time = normalizeTime(s.arrivalTime); if (time) s.arrivalTime = time; timeOpen = true; }} />
    <TextField label="Name" value={s.name} supportingText={errors.name ?? "Required"} error={Boolean(errors.name)}
      oninput={(e) => { s.name = e.detail.value; errors = { ...errors, name: undefined }; }} />
    <Select label="Adults" value={s.adults} onchange={(e) => (s.adults = e.detail.value ?? s.adults)}>
      {#each ADULT_OPTIONS as n}<SelectOption value={n}>{n}</SelectOption>{/each}
    </Select>
    <Select label="Children" value={s.children} onchange={(e) => (s.children = e.detail.value ?? s.children)}>
      {#each CHILD_OPTIONS as n}<SelectOption value={n}>{n}</SelectOption>{/each}
    </Select>
    <TextField label="Email" type="email" value={s.email} supportingText={errors.email ?? "Required"} error={Boolean(errors.email)}
      oninput={(e) => { s.email = e.detail.value; errors = { ...errors, email: undefined }; }} />
  </div>
  <div class="booking__group">
    <p class="booking__label mtrl-title-small">Room type</p>
    <Radios aria-label="Room type" value={s.room} onchange={(e) => (s.room = e.detail.value ?? s.room)}>
      {#each ROOMS as room}<Radio value={room.value} disabled={!eligibleRooms(s).some((r) => r.value === room.value)}>{room.label} — ${room.rate} a night</Radio>{/each}
    </Radios>
  </div>
  <div class="booking__group" role="group" aria-labelledby="extras-label">
    <p class="booking__label mtrl-title-small" id="extras-label">Extras</p>
    {#each EXTRAS as extra}
      <Checkbox checked={s[extra.key]} onchange={(e) => (s[extra.key] = e.detail.checked)}>{extra.label} — ${extra.price} {extra.unit}</Checkbox>
    {/each}
  </div>
  <div class="booking__group">
    <p class="booking__label mtrl-title-small">Price range</p>
    <Slider range showValue min={50} max={300} step={10} value={s.priceMin} secondValue={s.priceMax} aria-label="Price range"
      oninput={(e) => (s = withPrice(s, e.detail.value, e.detail.secondValue ?? s.priceMax))} />
    <p class="booking__range mtrl-body-medium">{rangeText(s)}</p>
  </div>
  <output class="booking__total mtrl-body-medium" role="status">{totalText(s)}</output>
  <footer class="booking__actions"><Button onclick={book}>Book</Button></footer>
  <Timepicker label="Arrival time" format="24h" value={normalizeTime(s.arrivalTime) ?? "15:00"} open={timeOpen}
    onchange={(e) => { s.arrivalTime = e.detail.value; errors = { ...errors, arrivalTime: undefined }; }} onclose={() => (timeOpen = false)} />
  <Snackbar message="Booking confirmed" open={confirmed} onclose={() => (confirmed = false)} />
</section>
