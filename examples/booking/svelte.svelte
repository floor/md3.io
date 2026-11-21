<!-- Svelte: material/svelte wraps the same elements, material-addons/svelte the stepper
     whose headers replace the hand-built step header and whose data-stepper-* actions
     replace the wiring between Back, Next and the panels. -->
<script lang="ts">
  import { Button, Card, Checkbox, Datepicker, Dialog, Select, SelectOption, Snackbar, TextField, Timepicker } from "material/svelte";
  import { Stepper, Step } from "material-addons/svelte";
  import type { StepperElement } from "material-addons/elements";
  import type { StepperBeforeChangeEvent } from "material-addons/components/stepper";
  import { ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON, DEFAULTS, EXTRAS, HERO_IMAGE, PROPERTY, ROOMS, TODAY, normalizeTime, priceLines, rangeParts, reviewLines, roomAfter, roomOf, stayText, stepHeading, stepNumberOf, stepValue, summary, totalText, validateStep, withRange, type Booking, type BookingErrors } from "./shared";

  let s = $state<Booking>({ ...DEFAULTS });
  let errors = $state<BookingErrors>({});
  let dialogOpen = $state(false);
  let confirmed = $state(false);
  let timeOpen = $state(false);
  let stepperEl: { element: StepperElement } | undefined = $state();
  let arrivalEl: HTMLElement | undefined = $state();
  let stayEl: HTMLElement | undefined = $state();
  let roomsEl: HTMLElement | undefined = $state();
  let nameEl: HTMLElement | undefined = $state();
  let emailEl: HTMLElement | undefined = $state();

  // A component's bind:this is its instance; the element is what takes focus.
  const elementOf = (component: { element?: HTMLElement } | undefined) => component?.element ?? component;
  const focusFirstInvalid = (n: number) => {
    if (n === 1) {
      if (validateStep(s, 1).dates) elementOf(stayEl)?.focus();
      else elementOf(arrivalEl)?.focus();
    }
  };
  const selectRoom = (value: string, focus = false) => {
    s.room = value;
    if (focus) requestAnimationFrame(() => roomsEl?.querySelector<HTMLElement>(`[data-room="${value}"]`)?.focus());
  };
  const onRoomKey = (event: KeyboardEvent, value: string) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); selectRoom(roomAfter(value, 1), true); }
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); selectRoom(roomAfter(value, -1), true); }
    else if (event.key === "Home") { event.preventDefault(); selectRoom(ROOMS[0]!.value, true); }
    else if (event.key === "End") { event.preventDefault(); selectRoom(ROOMS[ROOMS.length - 1]!.value, true); }
    else if (event.key === " " || event.key === "Enter") { event.preventDefault(); selectRoom(value, true); }
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
    errors = { ...errors, arrivalTime: stepErrors.arrivalTime, dates: stepErrors.dates };
    if (stepErrors.dates || stepErrors.arrivalTime) {
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

<!-- orientation "auto" turns vertical below 600px of container width: the widened booking
     column passes that on Desktop and Tablet frames, and stays vertical on Mobile;
     labels sit below their indicators so all four fit on Tablet. Each panel's
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
    <img class="booking__hero" src={HERO_IMAGE} alt="The Dune House above the dunes in {PROPERTY.town}" loading="lazy" />
    <h1 class="booking__title mtrl-headline-small">{PROPERTY.name}</h1>
    <p class="booking__lede mtrl-body-medium">{PROPERTY.town} · {PROPERTY.rating}</p>
    <p class="booking__lede mtrl-body-medium">{PROPERTY.lede}</p>
    <p class="booking__lede mtrl-body-medium">{PROPERTY.facts}</p>
  </div>
  <div class="booking__layout">
  <Stepper bind:this={stepperEl} linear orientation="auto" labelPlacement="bottom" ariaLabel="Booking steps" defaultValue="dates" onbeforechange={veto}>
    <Step value="dates" label="Dates and arrival">
      <div class="booking__step">
        <h2 class="booking__step-title mtrl-title-large" tabindex="-1">{stepHeading(1)}</h2>
        <div class="booking__grid">
          <Datepicker bind:this={stayEl} label="Check-in → Check-out" variant="modal" selectionMode="range" dateFormat="YYYY-MM-DD" min={TODAY} value="{s.checkIn}/{s.checkOut}"
            onchange={(e) => { const parts = rangeParts(e.detail.value); if (parts) { s = withRange(s, parts[0], parts[1]); errors = { ...errors, dates: undefined }; } }} />
          <TextField bind:this={arrivalEl} label="Arrival time" value={s.arrivalTime} trailingIcon={CLOCK_ICON} trailingIconLabel="Choose time"
            supportingText={errors.arrivalTime ?? "24-hour time"} error={Boolean(errors.arrivalTime)}
            oninput={(e) => { s.arrivalTime = e.detail.value; errors = { ...errors, arrivalTime: undefined }; }}
            onchange={(e) => commitTime(e.detail.value)}
            ontrailing={() => { const time = normalizeTime(s.arrivalTime); if (time) s.arrivalTime = time; timeOpen = true; }} />
        </div>
        <p class="booking__stay mtrl-body-medium">{stayText(s)}</p>
        {#if errors.dates}<p class="booking__field-error mtrl-body-small">{errors.dates}</p>{/if}
                <Card variant="filled" headline="Price summary" class="booking__summary-compact">
          <div class="booking__summary-lines">
            {#each priceLines(s) as line (line.label)}
              <div class="booking__price-line">
                <span class="booking__price-line mtrl-body-medium">{line.label}</span>
                <span class="booking__price-line mtrl-body-medium">{line.amount}</span>
              </div>
            {/each}
            <div class="booking__price-total">
              <span class="booking__price-line mtrl-title-small">Total</span>
              <span class="booking__price-line mtrl-title-small">{totalText(s).replace("Estimated total ", "")}</span>
            </div>
            <p class="booking__lede mtrl-body-medium">{PROPERTY.policy}</p>
          </div>
        </Card>
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
          <div class="booking__rooms" role="radiogroup" aria-label="Room type" bind:this={roomsEl}>
            {#each ROOMS as room (room.value)}
              <div class="booking__room" role="radio" aria-label="{room.label}, {room.beds}, {room.size}, ${room.rate} a night, {room.features}" aria-checked={s.room === room.value} tabindex={s.room === room.value ? 0 : -1} data-room={room.value}
                onclick={() => selectRoom(room.value, true)} onkeydown={(e) => onRoomKey(e, room.value)}>
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
            {/each}
          </div>
        </div>
                <Card variant="filled" headline="Price summary" class="booking__summary-compact">
          <div class="booking__summary-lines">
            {#each priceLines(s) as line (line.label)}
              <div class="booking__price-line">
                <span class="booking__price-line mtrl-body-medium">{line.label}</span>
                <span class="booking__price-line mtrl-body-medium">{line.amount}</span>
              </div>
            {/each}
            <div class="booking__price-total">
              <span class="booking__price-line mtrl-title-small">Total</span>
              <span class="booking__price-line mtrl-title-small">{totalText(s).replace("Estimated total ", "")}</span>
            </div>
            <p class="booking__lede mtrl-body-medium">{PROPERTY.policy}</p>
          </div>
        </Card>
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
                <Card variant="filled" headline="Price summary" class="booking__summary-compact">
          <div class="booking__summary-lines">
            {#each priceLines(s) as line (line.label)}
              <div class="booking__price-line">
                <span class="booking__price-line mtrl-body-medium">{line.label}</span>
                <span class="booking__price-line mtrl-body-medium">{line.amount}</span>
              </div>
            {/each}
            <div class="booking__price-total">
              <span class="booking__price-line mtrl-title-small">Total</span>
              <span class="booking__price-line mtrl-title-small">{totalText(s).replace("Estimated total ", "")}</span>
            </div>
            <p class="booking__lede mtrl-body-medium">{PROPERTY.policy}</p>
          </div>
        </Card>
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
                <Card variant="filled" headline="Price summary" class="booking__summary-compact">
          <div class="booking__summary-lines">
            {#each priceLines(s) as line (line.label)}
              <div class="booking__price-line">
                <span class="booking__price-line mtrl-body-medium">{line.label}</span>
                <span class="booking__price-line mtrl-body-medium">{line.amount}</span>
              </div>
            {/each}
            <div class="booking__price-total">
              <span class="booking__price-line mtrl-title-small">Total</span>
              <span class="booking__price-line mtrl-title-small">{totalText(s).replace("Estimated total ", "")}</span>
            </div>
            <p class="booking__lede mtrl-body-medium">{PROPERTY.policy}</p>
          </div>
        </Card>
        <footer class="booking__actions"><div data-stepper-prev><Button variant="outlined">Back</Button></div><div><Button onclick={book}>Book</Button></div></footer>
      </div>
    </Step>
  </Stepper>
  <Card variant="filled" headline="Price summary" class="booking__summary">
    <div class="booking__summary-lines">
      {#each priceLines(s) as line (line.label)}
        <div class="booking__price-line">
          <span class="booking__price-line mtrl-body-medium">{line.label}</span>
          <span class="booking__price-line mtrl-body-medium">{line.amount}</span>
        </div>
      {/each}
      <div class="booking__price-total">
        <span class="booking__price-line mtrl-title-small">Total</span>
        <span class="booking__price-line mtrl-title-small">{totalText(s).replace("Estimated total ", "")}</span>
      </div>
      <p class="booking__lede mtrl-body-medium">{PROPERTY.policy}</p>
    </div>
  </Card>
  </div>
  <Timepicker label="Arrival time" format="24h" value={normalizeTime(s.arrivalTime) ?? "15:00"} open={timeOpen}
    onchange={(e) => { s.arrivalTime = e.detail.value; errors = { ...errors, arrivalTime: undefined }; }} onclose={() => (timeOpen = false)} />
  <Snackbar message="Booking confirmed" open={confirmed} onclose={() => (confirmed = false)} />
</section>
