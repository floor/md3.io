<!-- Svelte: material/svelte wraps the same elements, material-addons/svelte the stepper
     whose headers replace the hand-built step header and whose data-stepper-* actions
     replace the wiring between Back, Next and the panels. -->
<script lang="ts">
  import { Button, Checkbox, Datepicker, Dialog, Radio, Radios, Select, SelectOption, Slider, Snackbar, TextField, Timepicker } from "material/svelte";
  import { Stepper, Step } from "material-addons/svelte";
  import type { StepperElement } from "material-addons/elements";
  import type { StepperBeforeChangeEvent } from "material-addons/components/stepper";
  import { ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON, DEFAULTS, EXTRAS, ROOMS, eligibleRooms, normalizeTime, rangeText, reviewLines, roomOf, stepHeading, stepNumberOf, stepValue, summary, totalText, validateStep, withDates, withPrice, type Booking, type BookingErrors } from "./shared";

  let s = $state<Booking>({ ...DEFAULTS });
  let errors = $state<BookingErrors>({});
  let dialogOpen = $state(false);
  let confirmed = $state(false);
  let timeOpen = $state(false);
  let stepperEl: { element: StepperElement } | undefined = $state();
  let arrivalEl: HTMLElement | undefined = $state();
  let sliderEl: HTMLElement | undefined = $state();
  let nameEl: HTMLElement | undefined = $state();
  let emailEl: HTMLElement | undefined = $state();

  // A component's bind:this is its instance; the element is what takes focus.
  const elementOf = (component: { element?: HTMLElement } | undefined) => component?.element ?? component;
  const focusFirstInvalid = (n: number) => {
    if (n === 1) elementOf(arrivalEl)?.focus();
    else if (n === 2) {
      const slider = elementOf(sliderEl);
      const handle = (slider?.shadowRoot ?? slider)?.querySelector<HTMLElement>('[role="slider"]');
      (handle ?? slider)?.focus();
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
    const stepErrors = validateStep(s, n);
    errors = { ...errors, arrivalTime: stepErrors.arrivalTime, room: stepErrors.room };
    if (stepErrors.arrivalTime || stepErrors.room) {
      event.detail.preventDefault();
      stepperEl?.element.setError(previousValue, true);
      focusFirstInvalid(n);
    } else stepperEl?.element.setError(previousValue, false);
  };
  // Book validates the details itself: it is not a move, so the stepper has no say in it.
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

<!-- orientation "auto" turns vertical below 600px of container width: the booking column
     is at most 560px, so the headers stack and every label stays readable. Each panel's
     heading carries tabindex="-1", which the stepper's focus after an action reaches
     first, so a step change puts focus on the new step's heading. -->
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
  <Stepper bind:this={stepperEl} linear orientation="auto" ariaLabel="Booking steps" defaultValue="dates" onbeforechange={veto}>
    <Step value="dates" label="Dates and arrival">
      <div class="booking__step">
        <h2 class="booking__step-title mtrl-title-large" tabindex="-1">{stepHeading(1)}</h2>
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
        <footer class="booking__actions"><div data-stepper-next><Button>Next</Button></div></footer>
      </div>
    </Step>
    <Step value="guests" label="Guests and room">
      <div class="booking__step">
        <h2 class="booking__step-title mtrl-title-large" tabindex="-1">{stepHeading(2)}</h2>
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
            oninput={(e) => { s = withPrice(s, e.detail.value, e.detail.secondValue ?? s.priceMax); errors = { ...errors, room: undefined }; }} />
          <p class="booking__range mtrl-body-medium">{rangeText(s)}</p>
          {#if errors.room}<p class="booking__field-error mtrl-body-small">{errors.room}</p>{/if}
        </div>
        <footer class="booking__actions"><div data-stepper-prev><Button variant="outlined">Back</Button></div><div data-stepper-next><Button>Next</Button></div></footer>
      </div>
    </Step>
    <Step value="extras" label="Extras">
      <div class="booking__step">
        <h2 class="booking__step-title mtrl-title-large" tabindex="-1">{stepHeading(3)}</h2>
        <div class="booking__group" role="group" aria-labelledby="extras-label">
          <p class="booking__label mtrl-title-small" id="extras-label">Extras</p>
          {#each EXTRAS as extra}
            <Checkbox checked={s[extra.key]} onchange={(e) => (s[extra.key] = e.detail.checked)}>{extra.label} — ${extra.price} {extra.unit}</Checkbox>
          {/each}
        </div>
        <footer class="booking__actions"><div data-stepper-prev><Button variant="outlined">Back</Button></div><div data-stepper-next><Button>Next</Button></div></footer>
      </div>
    </Step>
    <Step value="details" label="Your details and review">
      <div class="booking__step">
        <h2 class="booking__step-title mtrl-title-large" tabindex="-1">{stepHeading(4)}</h2>
        <div class="booking__grid">
          <TextField bind:this={nameEl} label="Name" value={s.name} supportingText={errors.name ?? "Required"} error={Boolean(errors.name)}
            oninput={(e) => { s.name = e.detail.value; errors = { ...errors, name: undefined }; }} />
          <TextField bind:this={emailEl} label="Email" type="email" value={s.email} supportingText={errors.email ?? "Required"} error={Boolean(errors.email)}
            oninput={(e) => { s.email = e.detail.value; errors = { ...errors, email: undefined }; }} />
        </div>
        <div class="booking__group">
          {#each reviewLines(s) as line (line.step)}
            <div class="booking__review-row">
              <div class="booking__review-copy">
                <p class="booking__review-label mtrl-title-small">{line.label}</p>
                <p class="booking__review-line mtrl-body-medium">{line.text}</p>
              </div>
              <div data-stepper-goto={stepValue(line.step)}>
                <Button variant="text" ariaLabel={`Edit ${line.label}`}>Edit</Button>
              </div>
            </div>
          {/each}
        </div>
        <footer class="booking__actions"><div data-stepper-prev><Button variant="outlined">Back</Button></div><div><Button onclick={book}>Book</Button></div></footer>
      </div>
    </Step>
  </Stepper>
  <output class="booking__total mtrl-body-medium" role="status">{totalText(s)}</output>
  <Timepicker label="Arrival time" format="24h" value={normalizeTime(s.arrivalTime) ?? "15:00"} open={timeOpen}
    onchange={(e) => { s.arrivalTime = e.detail.value; errors = { ...errors, arrivalTime: undefined }; }} onclose={() => (timeOpen = false)} />
  <Snackbar message="Booking confirmed" open={confirmed} onclose={() => (confirmed = false)} />
</section>
