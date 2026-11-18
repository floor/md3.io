<!-- Svelte: material/svelte wraps the same elements; bind: keeps their live state. -->
<script lang="ts">
  import { Button, Checkbox, Datepicker, Dialog, Radio, Radios, Select, SelectOption, Slider, Snackbar, TextField, Timepicker } from "material/svelte";
  import { ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON, DEFAULTS, EXTRAS, ROOMS, summary, totalText, validate, withDates, type BookingErrors } from "./shared";

  let s = $state({ ...DEFAULTS });
  let errors = $state<BookingErrors>({});
  let dialogOpen = $state(false);
  let confirmed = $state(false);
  let timeOpen = $state(false);

  const book = () => {
    errors = validate(s);
    if (!errors.name && !errors.email) dialogOpen = true;
  };
  const confirm = () => { dialogOpen = false; confirmed = true; };
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
    <p class="booking__title">Book a stay</p>
    <p class="booking__lede">Choose dates, guests and a room. The total updates as you go.</p>
  </div>
  <div class="booking__grid">
    <Datepicker label="Check-in" variant="modal" closeOnSelect dateFormat="YYYY-MM-DD" value={s.checkIn}
      onchange={(e) => (s = withDates(s, e.detail.value, s.checkOut))} />
    <Datepicker label="Check-out" variant="modal" closeOnSelect dateFormat="YYYY-MM-DD" min={s.checkIn} value={s.checkOut}
      onchange={(e) => (s = withDates(s, s.checkIn, e.detail.value))} />
    <TextField label="Arrival time" value={s.arrivalTime} trailingIcon={CLOCK_ICON} trailingIconLabel="Choose time"
      oninput={(e) => (s.arrivalTime = e.detail.value)} ontrailing={() => (timeOpen = true)} />
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
    <p class="booking__label">Room type</p>
    <Radios aria-label="Room type" value={s.room} onchange={(e) => (s.room = e.detail.value ?? s.room)}>
      {#each ROOMS as room}<Radio value={room.value}>{room.label} — ${room.rate} a night</Radio>{/each}
    </Radios>
  </div>
  <div class="booking__group">
    <p class="booking__label">Extras</p>
    {#each EXTRAS as extra}
      <Checkbox checked={s[extra.key]} onchange={(e) => (s[extra.key] = e.detail.checked)}>{extra.label} — ${extra.price} {extra.unit}</Checkbox>
    {/each}
  </div>
  <div class="booking__group">
    <p class="booking__label">Price range</p>
    <Slider range min={50} max={300} step={10} value={s.priceMin} secondValue={s.priceMax} aria-label="Price range"
      oninput={(e) => { s.priceMin = e.detail.value; s.priceMax = e.detail.secondValue ?? s.priceMax; }} />
  </div>
  <footer class="booking__actions"><Button onclick={book}>Book</Button></footer>
  <output class="booking__total" role="status">{totalText(s)}</output>
  <Timepicker label="Arrival time" format="24h" value={s.arrivalTime} open={timeOpen}
    onchange={(e) => (s.arrivalTime = e.detail.value)} onclose={() => (timeOpen = false)} />
  <Snackbar message="Booking confirmed" open={confirmed} onclose={() => (confirmed = false)} />
</section>
