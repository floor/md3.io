// Vue: material/vue wraps the same elements; their live state is paired with its event.
import { defineComponent, nextTick, reactive, ref } from "vue";
import { MButton, MCheckbox, MDatepicker, MDialog, MProgress, MRadio, MRadios, MSelect, MSelectOption, MSlider, MSnackbar, MTextField, MTimepicker } from "material/vue";
import { ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON, DEFAULTS, EXTRAS, ROOMS, eligibleRooms, normalizeTime, rangeText, reviewLines, roomOf, stepHeading, stepLabel, summary, totalText, validateStep, withDates, withPrice, type Booking, type BookingErrors } from "./shared";

export default defineComponent({
  components: { MButton, MCheckbox, MDatepicker, MDialog, MProgress, MRadio, MRadios, MSelect, MSelectOption, MSlider, MSnackbar, MTextField, MTimepicker },
  setup() {
    const s = reactive<Booking>({ ...DEFAULTS });
    const errors = reactive<BookingErrors>({});
    const step = ref(1);
    const dialogOpen = ref(false);
    const confirmed = ref(false);
    const timeOpen = ref(false);
    const heading = ref<HTMLElement | null>(null);
    const arrivalEl = ref<HTMLElement | null>(null);
    const sliderEl = ref<HTMLElement | null>(null);
    const nameEl = ref<HTMLElement | null>(null);
    const emailEl = ref<HTMLElement | null>(null);
    const setDates = (checkIn: string, checkOut: string) => Object.assign(s, withDates({ ...s }, checkIn, checkOut));
    // A step change puts focus on the new step's heading, so screen readers announce it.
    const gotoStep = async (next: number) => {
      step.value = next;
      await nextTick();
      heading.value?.focus();
    };
    // An adapter ref is its component; the element is what takes focus.
    const elementOf = (ref: { value: unknown }) => ((ref.value as { element?: HTMLElement } | null)?.element ?? ref.value) as HTMLElement | null;
    const focusFirstInvalid = (current: number) => {
      if (current === 1) elementOf(arrivalEl)?.focus();
      else if (current === 2) {
        const slider = elementOf(sliderEl);
        const handle = (slider?.shadowRoot ?? slider)?.querySelector<HTMLElement>('[role="slider"]');
        (handle ?? slider)?.focus();
      }
    };
    const next = () => {
      const stepErrors = validateStep({ ...s }, step.value);
      errors.arrivalTime = stepErrors.arrivalTime;
      if (stepErrors.arrivalTime || stepErrors.room) { focusFirstInvalid(step.value); return; }
      if (step.value < 4) gotoStep(step.value + 1);
    };
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
    return { s, errors, step, dialogOpen, confirmed, timeOpen, heading, arrivalEl, sliderEl, nameEl, emailEl, setDates, next, book, confirm, commitTime, openPicker, gotoStep, stepHeading, stepLabel, totalText, summary, rangeText, reviewLines, normalizeTime, eligibleRooms, withPrice, ROOMS, EXTRAS, ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON };
  },
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
      <!-- The step header, one piece: material's stepper replaces this block whole. -->
      <header class="booking__step-header">
        <h2 ref="heading" class="booking__step-title mtrl-title-large" tabindex="-1">{{ stepHeading(step) }}</h2>
        <MProgress :max="4" :value="step" :aria-label="stepLabel(step)"></MProgress>
      </header>
      <div v-if="step === 1" class="booking__step">
        <div class="booking__grid">
          <MDatepicker label="Check-in" variant="modal" close-on-select date-format="YYYY-MM-DD" :value="s.checkIn" @change="setDates($event.detail.value, s.checkOut)" />
          <MDatepicker label="Check-out" variant="modal" close-on-select date-format="YYYY-MM-DD" :min="s.checkIn" :value="s.checkOut" @change="setDates(s.checkIn, $event.detail.value)" />
          <MTextField ref="arrivalEl" label="Arrival time" :value="s.arrivalTime" :trailing-icon="CLOCK_ICON" trailing-icon-label="Choose time" :supporting-text="errors.arrivalTime ?? '24-hour time'" :error="Boolean(errors.arrivalTime)" @input="s.arrivalTime = $event.detail.value; errors.arrivalTime = undefined" @change="commitTime($event.detail.value)" @trailing="openPicker" />
        </div>
      </div>
      <div v-if="step === 2" class="booking__step">
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
          <MSlider ref="sliderEl" range show-value :min="50" :max="300" :step="10" :value="s.priceMin" :second-value="s.priceMax" aria-label="Price range" @input="Object.assign(s, withPrice(s, $event.detail.value, $event.detail.secondValue ?? s.priceMax))" />
          <p class="booking__range mtrl-body-medium">{{ rangeText(s) }}</p>
        </div>
      </div>
      <div v-if="step === 3" class="booking__step">
        <div class="booking__group" role="group" aria-labelledby="extras-label">
          <p class="booking__label mtrl-title-small" id="extras-label">Extras</p>
          <MCheckbox v-for="extra in EXTRAS" :key="extra.key" :checked="s[extra.key]" @change="s[extra.key] = $event.detail.checked">{{ extra.label }} — \${{ extra.price }} {{ extra.unit }}</MCheckbox>
        </div>
      </div>
      <div v-if="step === 4" class="booking__step">
        <div class="booking__grid">
          <MTextField ref="nameEl" label="Name" :value="s.name" :supporting-text="errors.name ?? 'Required'" :error="Boolean(errors.name)" @input="s.name = $event.detail.value; errors.name = undefined" />
          <MTextField ref="emailEl" label="Email" type="email" :value="s.email" :supporting-text="errors.email ?? 'Required'" :error="Boolean(errors.email)" @input="s.email = $event.detail.value; errors.email = undefined" />
        </div>
        <div class="booking__group">
          <div v-for="line in reviewLines(s)" :key="line.step" class="booking__review-row">
            <p class="booking__review-line mtrl-body-medium">{{ line.text }}</p>
            <MButton variant="text" :aria-label="'Edit ' + line.title" @click="gotoStep(line.step)">Edit</MButton>
          </div>
        </div>
      </div>
      <output class="booking__total mtrl-body-medium" role="status">{{ totalText(s) }}</output>
      <footer class="booking__actions">
        <MButton v-if="step > 1" variant="outlined" @click="gotoStep(step - 1)">Back</MButton>
        <MButton v-if="step < 4" @click="next">Next</MButton>
        <MButton v-if="step === 4" @click="book">Book</MButton>
      </footer>
      <MTimepicker label="Arrival time" format="24h" :value="normalizeTime(s.arrivalTime) ?? '15:00'" :open="timeOpen" @change="s.arrivalTime = $event.detail.value; errors.arrivalTime = undefined" @close="timeOpen = false" />
      <MSnackbar message="Booking confirmed" :open="confirmed" @close="confirmed = false" />
    </section>`,
});
