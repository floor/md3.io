<!-- Svelte: material/svelte wraps the same elements; bind: keeps their live state. -->
<script lang="ts">
  import { tick } from "svelte";
  import { Button, Checkbox, Datepicker, Dialog, Progress, Radio, Radios, Select, SelectOption, Slider, Snackbar, TextField, Timepicker } from "material/svelte";
  import { ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON, DEFAULTS, EXTRAS, ROOMS, eligibleRooms, normalizeTime, rangeText, reviewLines, roomOf, stepHeading, stepLabel, summary, totalText, validateStep, withDates, withPrice, type Booking, type BookingErrors } from "./shared";

  let s = $state<Booking>({ ...DEFAULTS });
  let errors = $state<BookingErrors>({});
  let step = $state(1);
  let dialogOpen = $state(false);
  let confirmed = $state(false);
  let timeOpen = $state(false);
  let heading: HTMLHeadingElement | undefined = $state();
  let arrivalEl: HTMLElement | undefined = $state();
  let sliderEl: HTMLElement | undefined = $state();
  let nameEl: HTMLElement | undefined = $state();
  let emailEl: HTMLElement | undefined = $state();

  // A step change puts focus on the new step's heading, so screen readers announce it.
  const gotoStep = async (next: number) => {
    step = next;
    await tick();
    heading?.focus();
  };
  // A component's bind:this is its instance; the element is what takes focus.
  const elementOf = (component: { element?: HTMLElement } | undefined) => component?.element ?? component;
  const focusFirstInvalid = (current: number) => {
    if (current === 1) elementOf(arrivalEl)?.focus();
    else if (current === 2) {
      const slider = elementOf(sliderEl);
      const handle = (slider?.shadowRoot ?? slider)?.querySelector<HTMLElement>('[role="slider"]');
      (handle ?? slider)?.focus();
    }
  };
  const next = () => {
    const stepErrors = validateStep(s, step);
    errors = { ...errors, arrivalTime: stepErrors.arrivalTime };
    if (stepErrors.arrivalTime || stepErrors.room) { focusFirstInvalid(step); return; }
    if (step < 4) gotoStep(step + 1);
  };
  const book = () => {
    const stepErrors = validateStep(s, 4);
    errors = { ...errors, name: stepErrors.name, email: stepErrors.email };
    if (!stepErrors.name && !stepErrors.email && roomOf(s)) dialogOpen = true;
    else if (stepErrors.name) elementOf(nameEl)?.focus();
    else if (stepErrors.email) elementOf(emailEl)?.focus();
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
    <p class="booking__lede mtrl-body-medium">Four steps: dates, guests and room, extras, then your details. The total updates as you go.</p>
  </div>
  <!-- The step header, one piece: material's stepper replaces this block whole. -->
  <header class="booking__step-header">
    <h2 bind:this={heading} class="booking__step-title mtrl-title-large" tabindex="-1">{stepHeading(step)}</h2>
    <Progress max={4} value={step} ariaLabel={stepLabel(step)} />
  </header>
  {#if step === 1}
    <div class="booking__step">
      <div class="booking__grid">
        <Datepicker label="Check-in" variant="modal" closeOnSelect dateFormat="YYYY-MM-DD" value={s.checkIn}
          onchange={(e) => (s = withDates(s, e.detail.value, s.checkOut))} />
        <Datepicker label="Check-out" variant="modal" closeOnSelect dateFormat="YYYY-MM-DD" min={s.checkIn} value={s.checkOut}
          onchange={(e) => (s = withDates(s, s.checkIn, e.detail.value))} />
        <TextField bind:this={arrivalEl} label="Arrival time" value={s.arrivalTime} trailingIcon={CLOCK_ICON} trailingIconLabel="Choose time"
          supportingText={errors.arrivalTime ?? "24-hour time"} error={Boolean(errors.arrivalTime)}
          oninput={(e) => { s.arrivalTime = e.detail.value; errors = { ...errors, arrivalTime: undefined }; }}
          onchange={(e) => commitTime(e.detail.value)}
          ontrailing={() => { const time = normalizeTime(s.arrivalTime); if (time) s.arrivalTime = time; timeOpen = true; }} />
      </div>
    </div>
  {:else if step === 2}
    <div class="booking__step">
      <div class="booking__grid">
        <Select label="Adults" value={s.adults} onchange={(e) => (s.adults = e.detail.value ?? s.adults)}>
          {#each ADULT_OPTIONS as n}<SelectOption value={n}>{n}</SelectOption>{/each}
        </Select>
        <Select label="Children" value={s.children} onchange={(e) => (s.children = e.detail.value ?? s.children)}>
          {#each CHILD_OPTIONS as n}<SelectOption value={n}>{n}</SelectOption>{/each}
        </Select>
      </div>
      <div class="booking__group">
        <p class="booking__label mtrl-title-small">Room type</p>
        <Radios aria-label="Room type" value={s.room} onchange={(e) => (s.room = e.detail.value ?? s.room)}>
          {#each ROOMS as room}<Radio value={room.value} disabled={!eligibleRooms(s).some((r) => r.value === room.value)}>{room.label} — ${room.rate} a night</Radio>{/each}
        </Radios>
      </div>
      <div class="booking__group">
        <p class="booking__label mtrl-title-small">Price range</p>
        <Slider bind:this={sliderEl} range showValue min={50} max={300} step={10} value={s.priceMin} secondValue={s.priceMax} aria-label="Price range"
          oninput={(e) => (s = withPrice(s, e.detail.value, e.detail.secondValue ?? s.priceMax))} />
        <p class="booking__range mtrl-body-medium">{rangeText(s)}</p>
      </div>
    </div>
  {:else if step === 3}
    <div class="booking__step">
      <div class="booking__group" role="group" aria-labelledby="extras-label">
        <p class="booking__label mtrl-title-small" id="extras-label">Extras</p>
        {#each EXTRAS as extra}
          <Checkbox checked={s[extra.key]} onchange={(e) => (s[extra.key] = e.detail.checked)}>{extra.label} — ${extra.price} {extra.unit}</Checkbox>
        {/each}
      </div>
    </div>
  {:else}
    <div class="booking__step">
      <div class="booking__grid">
        <TextField bind:this={nameEl} label="Name" value={s.name} supportingText={errors.name ?? "Required"} error={Boolean(errors.name)}
          oninput={(e) => { s.name = e.detail.value; errors = { ...errors, name: undefined }; }} />
        <TextField bind:this={emailEl} label="Email" type="email" value={s.email} supportingText={errors.email ?? "Required"} error={Boolean(errors.email)}
          oninput={(e) => { s.email = e.detail.value; errors = { ...errors, email: undefined }; }} />
      </div>
      <div class="booking__group">
        {#each reviewLines(s) as line (line.step)}
          <div class="booking__review-row">
            <p class="booking__review-line mtrl-body-medium">{line.text}</p>
            <Button variant="text" ariaLabel={`Edit ${line.title}`} onclick={() => gotoStep(line.step)}>Edit</Button>
          </div>
        {/each}
      </div>
    </div>
  {/if}
  <output class="booking__total mtrl-body-medium" role="status">{totalText(s)}</output>
  <footer class="booking__actions">
    {#if step > 1}<Button variant="outlined" onclick={() => gotoStep(step - 1)}>Back</Button>{/if}
    {#if step < 4}<Button onclick={next}>Next</Button>{:else}<Button onclick={book}>Book</Button>{/if}
  </footer>
  <Timepicker label="Arrival time" format="24h" value={normalizeTime(s.arrivalTime) ?? "15:00"} open={timeOpen}
    onchange={(e) => { s.arrivalTime = e.detail.value; errors = { ...errors, arrivalTime: undefined }; }} onclose={() => (timeOpen = false)} />
  <Snackbar message="Booking confirmed" open={confirmed} onclose={() => (confirmed = false)} />
</section>
