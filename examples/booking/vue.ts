// Vue: material/vue wraps the same elements; their live state is paired with its event.
import { defineComponent, reactive, ref } from "vue";
import { MButton, MCheckbox, MDatepicker, MDialog, MRadio, MRadios, MSelect, MSelectOption, MSlider, MSnackbar, MTextField, MTimepicker } from "material/vue";
import { ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON, DEFAULTS, EXTRAS, ROOMS, summary, totalText, validate, withDates, type Booking, type BookingErrors } from "./shared";

export default defineComponent({
  components: { MButton, MCheckbox, MDatepicker, MDialog, MRadio, MRadios, MSelect, MSelectOption, MSlider, MSnackbar, MTextField, MTimepicker },
  setup() {
    const s = reactive<Booking>({ ...DEFAULTS });
    const errors = reactive<BookingErrors>({});
    const dialogOpen = ref(false);
    const confirmed = ref(false);
    const timeOpen = ref(false);
    const setDates = (checkIn: string, checkOut: string) => Object.assign(s, withDates({ ...s }, checkIn, checkOut));
    const book = () => {
      const next = validate(s);
      errors.name = next.name;
      errors.email = next.email;
      if (!next.name && !next.email) dialogOpen.value = true;
    };
    const confirm = () => { dialogOpen.value = false; confirmed.value = true; };
    return { s, errors, dialogOpen, confirmed, timeOpen, setDates, book, confirm, totalText, summary, ROOMS, EXTRAS, ADULT_OPTIONS, CHILD_OPTIONS, CLOCK_ICON };
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
        <p class="booking__title">Book a stay</p>
        <p class="booking__lede">Choose dates, guests and a room. The total updates as you go.</p>
      </div>
      <div class="booking__grid">
        <MDatepicker label="Check-in" variant="modal" close-on-select date-format="YYYY-MM-DD" :value="s.checkIn" @change="setDates($event.detail.value, s.checkOut)" />
        <MDatepicker label="Check-out" variant="modal" close-on-select date-format="YYYY-MM-DD" :min="s.checkIn" :value="s.checkOut" @change="setDates(s.checkIn, $event.detail.value)" />
        <MTextField label="Arrival time" :value="s.arrivalTime" :trailing-icon="CLOCK_ICON" trailing-icon-label="Choose time" @input="s.arrivalTime = $event.detail.value" @trailing="timeOpen = true" />
        <MTextField label="Name" :value="s.name" :supporting-text="errors.name ?? 'Required'" :error="Boolean(errors.name)" @input="s.name = $event.detail.value; errors.name = undefined" />
        <MSelect label="Adults" :value="s.adults" @change="s.adults = $event.detail.value ?? s.adults">
          <MSelectOption v-for="n in ADULT_OPTIONS" :key="n" :value="n">{{ n }}</MSelectOption>
        </MSelect>
        <MSelect label="Children" :value="s.children" @change="s.children = $event.detail.value ?? s.children">
          <MSelectOption v-for="n in CHILD_OPTIONS" :key="n" :value="n">{{ n }}</MSelectOption>
        </MSelect>
        <MTextField label="Email" type="email" :value="s.email" :supporting-text="errors.email ?? 'Required'" :error="Boolean(errors.email)" @input="s.email = $event.detail.value; errors.email = undefined" />
      </div>
      <div class="booking__group">
        <p class="booking__label">Room type</p>
        <MRadios aria-label="Room type" :value="s.room" @change="s.room = $event.detail.value ?? s.room">
          <MRadio v-for="room in ROOMS" :key="room.value" :value="room.value">{{ room.label }} — \${{ room.rate }} a night</MRadio>
        </MRadios>
      </div>
      <div class="booking__group">
        <p class="booking__label">Extras</p>
        <MCheckbox v-for="extra in EXTRAS" :key="extra.key" :checked="s[extra.key]" @change="s[extra.key] = $event.detail.checked">{{ extra.label }} — \${{ extra.price }} {{ extra.unit }}</MCheckbox>
      </div>
      <div class="booking__group">
        <p class="booking__label">Price range</p>
        <MSlider range :min="50" :max="300" :step="10" :value="s.priceMin" :second-value="s.priceMax" aria-label="Price range" @input="s.priceMin = $event.detail.value; s.priceMax = $event.detail.secondValue ?? s.priceMax" />
      </div>
      <footer class="booking__actions"><MButton @click="book">Book</MButton></footer>
      <output class="booking__total" role="status">{{ totalText(s) }}</output>
      <MTimepicker label="Arrival time" format="24h" :value="s.arrivalTime" :open="timeOpen" @change="s.arrivalTime = $event.detail.value" @close="timeOpen = false" />
      <MSnackbar message="Booking confirmed" :open="confirmed" @close="confirmed = false" />
    </section>`,
});
