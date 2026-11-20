// Vue: material/vue wraps the same elements, material-addons/vue the stepper whose
// headers replace the hand-built step header and whose data-stepper-* actions replace
// the wiring between Back, Next and the panels.
import { defineComponent, reactive, ref } from "vue";
import { MButton, MCard, MCheckbox, MDatepicker, MDialog, MSelect, MSelectOption, MSnackbar, MTextField, MTimepicker } from "material/vue";
import { MStepper, MStep } from "material-addons/vue";
import { StepperElement } from "material-addons/elements";
import type { StepperBeforeChangeEvent } from "material-addons/components/stepper";
import { ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON, DEFAULTS, EXTRAS, HERO_IMAGE, PROPERTY, ROOMS, TODAY, normalizeTime, priceLines, rangeParts, reviewLines, roomAfter, roomOf, stayText, stepHeading, stepNumberOf, stepValue, summary, totalText, validateStep, withRange, type Booking, type BookingErrors } from "./shared";

export default defineComponent({
  components: { MButton, MCard, MCheckbox, MDatepicker, MDialog, MSelect, MSelectOption, MSnackbar, MStepper, MStep, MTextField, MTimepicker },
  setup() {
    const s = reactive<Booking>({ ...DEFAULTS });
    const errors = reactive<BookingErrors>({});
    const dialogOpen = ref(false);
    const confirmed = ref(false);
    const timeOpen = ref(false);
    const stepperEl = ref<{ element: StepperElement } | null>(null);
    const arrivalEl = ref<HTMLElement | null>(null);
    const stayEl = ref<HTMLElement | null>(null);
    const roomsEl = ref<HTMLElement | null>(null);
    const nameEl = ref<HTMLElement | null>(null);
    const emailEl = ref<HTMLElement | null>(null);
    const setRange = (value: string) => { const parts = rangeParts(value); if (parts) { Object.assign(s, withRange({ ...s }, parts[0], parts[1])); errors.dates = undefined; } };
    const selectRoom = (value: string, focus = false) => { s.room = value; if (focus) requestAnimationFrame(() => roomsEl.value?.querySelector<HTMLElement>(`[data-room="${value}"]`)?.focus()); };
    const onRoomKey = (event: KeyboardEvent, value: string) => {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); selectRoom(roomAfter(value, 1), true); }
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); selectRoom(roomAfter(value, -1), true); }
      else if (event.key === "Home") { event.preventDefault(); selectRoom(ROOMS[0]!.value, true); }
      else if (event.key === "End") { event.preventDefault(); selectRoom(ROOMS[ROOMS.length - 1]!.value, true); }
      else if (event.key === " " || event.key === "Enter") { event.preventDefault(); selectRoom(value, true); }
    };
    // An adapter ref is its component; the element is what takes focus.
    const elementOf = (ref: { value: unknown }) => ((ref.value as { element?: HTMLElement } | null)?.element ?? ref.value) as HTMLElement | null;
    const focusFirstInvalid = (n: number) => {
      if (n === 1) {
        if (validateStep({ ...s }, 1).dates) elementOf(stayEl)?.focus();
        else elementOf(arrivalEl)?.focus();
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
      errors.arrivalTime = stepErrors.arrivalTime;
      errors.dates = stepErrors.dates;
      if (stepErrors.dates || stepErrors.arrivalTime) {
        event.detail.preventDefault();
        stepperEl.value?.element.setError(previousValue, true);
      } else stepperEl.value?.element.setError(previousValue, false);
      if (stepErrors.dates || stepErrors.arrivalTime) focusFirstInvalid(n);
    };
    // Book validates the details itself: it is not a move, so the stepper has no say in it.
    const book = () => {
      const stepErrors = validateStep({ ...s }, 4);
      errors.name = stepErrors.name;
      errors.email = stepErrors.email;
      if (!stepErrors.name && !stepErrors.email && roomOf(s)) dialogOpen.value = true;
      else if (stepErrors.name) elementOf(nameEl)?.focus();
      else if (stepErrors.email) elementOf(emailEl)?.focus();
    };
    const confirm = () => { dialogOpen.value = false; confirmed.value = true; };
    const commitTime = (value: string) => {
      const time = normalizeTime(value);
      if (time) { s.arrivalTime = time; errors.arrivalTime = undefined; }
      else errors.arrivalTime = "Enter a valid time";
    };
    const openPicker = () => {
      const time = normalizeTime(s.arrivalTime);
      if (time) s.arrivalTime = time;
      timeOpen.value = true;
    };
    return { s, errors, dialogOpen, confirmed, timeOpen, stepperEl, arrivalEl, stayEl, roomsEl, nameEl, emailEl, setRange, selectRoom, onRoomKey, veto, book, confirm, commitTime, openPicker, stepHeading, stepValue, totalText, summary, stayText, priceLines, reviewLines, normalizeTime, PROPERTY, HERO_IMAGE, TODAY, ROOMS, EXTRAS, ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON };
  },
  // orientation "auto" turns vertical below 600px of container width: the widened
  // booking column passes that on Desktop and Tablet frames, and stays vertical
  // on Mobile; labels sit below their indicators so all four fit on Tablet.
  template: `
    <section class="booking">
      <MDialog headline="Confirm booking" :open="dialogOpen" @close="dialogOpen = false">
        <p>{{ summary(s) }}</p>
        <template #actions>
          <MButton variant="text" @click="dialogOpen = false">Cancel</MButton>
          <MButton variant="text" @click="confirm">Confirm booking</MButton>
        </template>
      </MDialog>
      <div class="booking__intro">
        <img class="booking__hero" :src="HERO_IMAGE" :alt="'The Dune House above the dunes in ' + PROPERTY.town" loading="lazy">
        <h1 class="booking__title mtrl-headline-small">{{ PROPERTY.name }}</h1>
        <p class="booking__lede mtrl-body-medium">{{ PROPERTY.town }} · {{ PROPERTY.rating }}</p>
        <p class="booking__lede mtrl-body-medium">{{ PROPERTY.lede }}</p>
        <p class="booking__lede mtrl-body-medium">{{ PROPERTY.facts }}</p>
      </div>
      <div class="booking__layout">
      <MStepper ref="stepperEl" linear orientation="auto" label-placement="bottom" aria-label="Booking steps" default-value="dates" @beforechange="veto">
        <MStep value="dates" label="Dates and arrival">
          <div class="booking__step">
            <h2 class="booking__step-title mtrl-title-large" tabindex="-1">{{ stepHeading(1) }}</h2>
            <div class="booking__grid">
              <MDatepicker ref="stayEl" label="Check-in → Check-out" variant="modal" selection-mode="range" date-format="YYYY-MM-DD" :min="TODAY" :value="s.checkIn + '/' + s.checkOut" @change="setRange($event.detail.value)" />
              <MTextField ref="arrivalEl" label="Arrival time" :value="s.arrivalTime" :trailing-icon="CLOCK_ICON" trailing-icon-label="Choose time" :supporting-text="errors.arrivalTime ?? '24-hour time'" :error="Boolean(errors.arrivalTime)" @input="s.arrivalTime = $event.detail.value; errors.arrivalTime = undefined" @change="commitTime($event.detail.value)" @trailing="openPicker" />
            </div>
            <p class="booking__stay mtrl-body-medium">{{ stayText(s) }}</p>
            <p v-if="errors.dates" class="booking__field-error mtrl-body-small">{{ errors.dates }}</p>
            <footer class="booking__actions"><div data-stepper-next><MButton>Next</MButton></div></footer>
          </div>
        </MStep>
        <MStep value="guests" label="Guests and room">
          <div class="booking__step">
            <h2 class="booking__step-title mtrl-title-large" tabindex="-1">{{ stepHeading(2) }}</h2>
            <div class="booking__grid">
              <MSelect label="Adults" :value="s.adults" @change="s.adults = $event.detail.value ?? s.adults">
                <MSelectOption v-for="n in ADULT_OPTIONS" :key="n" :value="n">{{ n }}</MSelectOption>
              </MSelect>
              <MSelect label="Children" :value="s.children" @change="s.children = $event.detail.value ?? s.children">
                <MSelectOption v-for="n in CHILD_OPTIONS" :key="n" :value="n">{{ n }}</MSelectOption>
              </MSelect>
            </div>
            <div class="booking__group">
              <p class="booking__label mtrl-title-small">Room type</p>
              <div class="booking__rooms" role="radiogroup" aria-label="Room type" ref="roomsEl">
                <div v-for="room in ROOMS" :key="room.value" class="booking__room" role="radio" :aria-label="room.label + ', ' + room.beds + ', ' + room.size + ', $' + room.rate + ' a night, ' + room.features" :aria-checked="s.room === room.value" :tabindex="s.room === room.value ? 0 : -1" :data-room="room.value" @click="selectRoom(room.value, true)" @keydown="onRoomKey($event, room.value)">
                  <MCard variant="outlined">
                    <div class="booking__room-card">
                      <img class="booking__room-image" :src="room.image" alt="" loading="lazy">
                      <p class="booking__room-name mtrl-title-medium">{{ room.label }}</p>
                      <p class="booking__room-facts mtrl-body-medium">{{ room.beds }} · {{ room.size }}</p>
                      <p class="booking__room-price mtrl-body-medium">\${{ room.rate }} a night</p>
                      <p class="booking__room-features mtrl-body-medium">{{ room.features }}</p>
                    </div>
                  </MCard>
                </div>
              </div>
            </div>
            <footer class="booking__actions"><div data-stepper-prev><MButton variant="outlined">Back</MButton></div><div data-stepper-next><MButton>Next</MButton></div></footer>
          </div>
        </MStep>
        <MStep value="extras" label="Extras">
          <div class="booking__step">
            <h2 class="booking__step-title mtrl-title-large" tabindex="-1">{{ stepHeading(3) }}</h2>
            <div class="booking__group" role="group" aria-labelledby="extras-label">
              <p class="booking__label mtrl-title-small" id="extras-label">Extras</p>
              <MCheckbox v-for="extra in EXTRAS" :key="extra.key" :checked="s[extra.key]" @change="s[extra.key] = $event.detail.checked">{{ extra.label }} — \${{ extra.price }} {{ extra.unit }}</MCheckbox>
            </div>
            <footer class="booking__actions"><div data-stepper-prev><MButton variant="outlined">Back</MButton></div><div data-stepper-next><MButton>Next</MButton></div></footer>
          </div>
        </MStep>
        <MStep value="details" label="Your details and review">
          <div class="booking__step">
            <h2 class="booking__step-title mtrl-title-large" tabindex="-1">{{ stepHeading(4) }}</h2>
            <div class="booking__grid">
              <MTextField ref="nameEl" label="Name" :value="s.name" :supporting-text="errors.name ?? 'Required'" :error="Boolean(errors.name)" @input="s.name = $event.detail.value; errors.name = undefined" />
              <MTextField ref="emailEl" label="Email" type="email" :value="s.email" :supporting-text="errors.email ?? 'Required'" :error="Boolean(errors.email)" @input="s.email = $event.detail.value; errors.email = undefined" />
            </div>
            <div class="booking__group">
              <div v-for="line in reviewLines(s)" :key="line.step" class="booking__review-row">
                <div class="booking__review-copy">
                  <p class="booking__review-label mtrl-title-small">{{ line.label }}</p>
                  <p class="booking__review-line mtrl-body-medium">{{ line.text }}</p>
                </div>
                <div :data-stepper-goto="stepValue(line.step)">
                  <MButton variant="text" :aria-label="'Edit ' + line.label">Edit</MButton>
                </div>
              </div>
            </div>
            <footer class="booking__actions"><div data-stepper-prev><MButton variant="outlined">Back</MButton></div><div><MButton @click="book">Book</MButton></div></footer>
          </div>
        </MStep>
      </MStepper>
      <MCard variant="filled" headline="Price summary" class="booking__summary">
        <div class="booking__summary-lines">
          <div v-for="line in priceLines(s)" :key="line.label" class="booking__price-line">
            <span class="booking__price-line mtrl-body-medium">{{ line.label }}</span>
            <span class="booking__price-line mtrl-body-medium">{{ line.amount }}</span>
          </div>
          <div class="booking__price-total">
            <span class="booking__price-line mtrl-title-small">Total</span>
            <span class="booking__price-line mtrl-title-small">{{ totalText(s).replace("Estimated total ", "") }}</span>
          </div>
          <p class="booking__lede mtrl-body-medium">{{ totalText(s) }}</p>
          <p class="booking__lede mtrl-body-medium">{{ PROPERTY.policy }}</p>
        </div>
      </MCard>
      </div>
      <MTimepicker label="Arrival time" format="24h" :value="normalizeTime(s.arrivalTime) ?? '15:00'" :open="timeOpen" @change="s.arrivalTime = $event.detail.value; errors.arrivalTime = undefined" @close="timeOpen = false" />
      <MSnackbar message="Booking confirmed" :open="confirmed" @close="confirmed = false" />
    </section>`,
});
