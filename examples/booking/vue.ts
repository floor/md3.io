// Vue: material/vue wraps the same elements, material-addons/vue the stepper whose
// headers replace the hand-built step header and whose data-stepper-* actions replace
// the wiring between Back, Next and the panels.
import { defineComponent, reactive, ref } from "vue";
import { MButton, MCheckbox, MDatepicker, MDialog, MRadio, MRadios, MSelect, MSelectOption, MSlider, MSnackbar, MTextField, MTimepicker } from "material/vue";
import { MStepper, MStep } from "material-addons/vue";
import { StepperElement } from "material-addons/elements";
import type { StepperBeforeChangeEvent } from "material-addons/components/stepper";
import { ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON, DEFAULTS, EXTRAS, ROOMS, eligibleRooms, normalizeTime, rangeText, reviewLines, roomOf, stepHeading, stepNumberOf, stepValue, summary, totalText, validateStep, withDates, withPrice, type Booking, type BookingErrors } from "./shared";

export default defineComponent({
  components: { MButton, MCheckbox, MDatepicker, MDialog, MRadio, MRadios, MSelect, MSelectOption, MSlider, MSnackbar, MStepper, MStep, MTextField, MTimepicker },
  setup() {
    const s = reactive<Booking>({ ...DEFAULTS });
    const errors = reactive<BookingErrors>({});
    const dialogOpen = ref(false);
    const confirmed = ref(false);
    const timeOpen = ref(false);
    const stepperEl = ref<{ element: StepperElement } | null>(null);
    const arrivalEl = ref<HTMLElement | null>(null);
    const sliderEl = ref<HTMLElement | null>(null);
    const nameEl = ref<HTMLElement | null>(null);
    const emailEl = ref<HTMLElement | null>(null);
    const setDates = (checkIn: string, checkOut: string) => Object.assign(s, withDates({ ...s }, checkIn, checkOut));
    // An adapter ref is its component; the element is what takes focus.
    const elementOf = (ref: { value: unknown }) => ((ref.value as { element?: HTMLElement } | null)?.element ?? ref.value) as HTMLElement | null;
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
      const stepErrors = validateStep({ ...s }, n);
      errors.arrivalTime = stepErrors.arrivalTime;
      errors.room = stepErrors.room;
      if (stepErrors.arrivalTime || stepErrors.room) {
        event.detail.preventDefault();
        stepperEl.value?.element.setError(previousValue, true);
      } else stepperEl.value?.element.setError(previousValue, false);
      if (stepErrors.arrivalTime || stepErrors.room) focusFirstInvalid(n);
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
    return { s, errors, dialogOpen, confirmed, timeOpen, stepperEl, arrivalEl, sliderEl, nameEl, emailEl, setDates, veto, book, confirm, commitTime, openPicker, stepHeading, stepValue, totalText, summary, rangeText, reviewLines, normalizeTime, eligibleRooms, withPrice, ROOMS, EXTRAS, ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON };
  },
  // orientation "auto" turns vertical below 600px of container width: the booking
  // column is at most 560px, so the headers stack and every label stays readable.
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
        <h1 class="booking__title mtrl-headline-small">Book a stay</h1>
        <p class="booking__lede mtrl-body-medium">Four steps: dates, guests and room, extras, then your details. The total updates as you go.</p>
      </div>
      <MStepper ref="stepperEl" linear orientation="auto" aria-label="Booking steps" default-value="dates" @beforechange="veto">
        <MStep value="dates" label="Dates and arrival">
          <div class="booking__step">
            <h2 class="booking__step-title mtrl-title-large" tabindex="-1">{{ stepHeading(1) }}</h2>
            <div class="booking__grid">
              <MDatepicker label="Check-in" variant="modal" close-on-select date-format="YYYY-MM-DD" :value="s.checkIn" @change="setDates($event.detail.value, s.checkOut)" />
              <MDatepicker label="Check-out" variant="modal" close-on-select date-format="YYYY-MM-DD" :min="s.checkIn" :value="s.checkOut" @change="setDates(s.checkIn, $event.detail.value)" />
              <MTextField ref="arrivalEl" label="Arrival time" :value="s.arrivalTime" :trailing-icon="CLOCK_ICON" trailing-icon-label="Choose time" :supporting-text="errors.arrivalTime ?? '24-hour time'" :error="Boolean(errors.arrivalTime)" @input="s.arrivalTime = $event.detail.value; errors.arrivalTime = undefined" @change="commitTime($event.detail.value)" @trailing="openPicker" />
            </div>
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
              <MRadios aria-label="Room type" :value="s.room" @change="s.room = $event.detail.value ?? s.room">
                <MRadio v-for="room in ROOMS" :key="room.value" :value="room.value" :disabled="!eligibleRooms(s).some((r) => r.value === room.value)">{{ room.label }} — \${{ room.rate }} a night</MRadio>
              </MRadios>
            </div>
            <div class="booking__group">
              <p class="booking__label mtrl-title-small">Price range</p>
              <MSlider ref="sliderEl" range show-value :min="50" :max="300" :step="10" :value="s.priceMin" :second-value="s.priceMax" aria-label="Price range" @input="Object.assign(s, withPrice(s, $event.detail.value, $event.detail.secondValue ?? s.priceMax)); errors.room = undefined" />
              <p class="booking__range mtrl-body-medium">{{ rangeText(s) }}</p>
              <p v-if="errors.room" class="booking__field-error mtrl-body-small">{{ errors.room }}</p>
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
      <output class="booking__total mtrl-body-medium" role="status">{{ totalText(s) }}</output>
      <MTimepicker label="Arrival time" format="24h" :value="normalizeTime(s.arrivalTime) ?? '15:00'" :open="timeOpen" @change="s.arrivalTime = $event.detail.value; errors.arrivalTime = undefined" @close="timeOpen = false" />
      <MSnackbar message="Booking confirmed" :open="confirmed" @close="confirmed = false" />
    </section>`,
});
