// Vue owns its state and Material adapter tree; pricing rules are shared.
import { defineComponent, reactive, ref, onMounted, onBeforeUnmount, type PropType } from 'vue';
import { MButton, MCard, MCheckbox, MDatepicker, MRadio, MRadios, MSelect, MSelectOption, MSnackbar, MTextField } from 'material/vue';
import { MStep, MStepper } from 'material-addons/vue';
import type { StepperElement } from 'material-addons/elements';
import type { StepperBeforeChangeEvent, StepperChangeEvent } from 'material-addons/components/stepper';
import { DEFAULTS, DETAIL_FIELDS, EXTRAS, GUEST_FIELDS, HOTEL, PAYMENT_OPTIONS, RATES, ROOMS, STEPS, TODAY, amenitiesOf, amend, cancellation, choiceAfter, choiceOf, choicePatch, choices, extraIncluded, extraLabel, guestText, money, nightlyRate, nightText, paymentNote, priceLines, rangeParts, rateConditions, rateText, roomOf, roomTotal, stayText, stepHeading, stepNumberOf, total, unavailable, validateStep, vatIncluded, type Booking, type BookingErrors, type Room } from './shared';
import { focusControl, invalidateSteps, watchHotel } from './hotel-ui';
const HotelSummary=defineComponent({
  props:{booking:{type:Object as PropType<Booking>,required:true}},
  setup(){return {HOTEL,stayText,guestText,roomOf,rateText,priceLines,money,total,vatIncluded,cancellation,unavailable};},
  template:`<p class="mtrl-title-medium">{{ HOTEL.name }}</p><p class="mtrl-body-medium">{{ stayText(booking) }}</p><p class="mtrl-body-medium">{{ guestText(booking) }}</p>
    <template v-if="booking.roomChosen"><p class="mtrl-body-medium">{{ roomOf(booking).label }} · {{ rateText(booking) }}</p>
      <div v-for="line in priceLines(booking)" :key="line.label" class="booking__price-line"><span class="mtrl-body-medium">{{ line.label }}</span><span class="mtrl-body-medium">{{ line.amount }}</span></div>
      <p class="mtrl-title-large">Total {{ money(total(booking)) }}</p><p class="mtrl-body-small mtrl-text-surface-variant">incl. VAT {{ money(vatIncluded(booking)) }}</p><p class="mtrl-body-small">{{ cancellation(booking) }}</p>
    </template><p v-else class="mtrl-body-medium">{{ unavailable(booking,roomOf(booking))?'Room: choose an available room':'Room: choose in the next step' }}</p>`,
});
export default defineComponent({
  components:{MButton,MCard,MCheckbox,MDatepicker,MRadio,MRadios,MSelect,MSelectOption,MSnackbar,MTextField,MStep,MStepper,HotelSummary},
  setup(){
    const s=reactive<Booking>({...DEFAULTS});const errors=ref<BookingErrors>({});const expanded=ref(false);
    const rootEl=ref<HTMLElement|null>(null);const stepperEl=ref<{element:StepperElement}|null>(null);
    const update=(patch:Partial<Booking>)=>{Object.assign(s,amend({...s},patch));invalidateSteps(stepperEl.value?.element,patch);};
    let cleanup:(()=>void)|undefined;onMounted(()=>{if(rootEl.value&&stepperEl.value)cleanup=watchHotel(rootEl.value,stepperEl.value.element);});onBeforeUnmount(()=>cleanup?.());
    const announce=(message:string)=>{const host=rootEl.value?.querySelector('m-snackbar') as HTMLElement & {show():void;component?:{setDuration(value:string):void}};host.setAttribute('message',message);host.component?.setDuration('short');host.show();};
    const veto=(event:CustomEvent<StepperBeforeChangeEvent>)=>{
      if(event.detail.direction!=='forward')return;const number=stepNumberOf(event.detail.previousValue??'dates');const messages=validateStep({...s},number);errors.value=messages;
      if(Object.keys(messages).length){event.detail.preventDefault();stepperEl.value?.element.setError(event.detail.previousValue!,true);const key=Object.keys(messages)[0];requestAnimationFrame(()=>focusControl(rootEl.value?.querySelector<HTMLElement>(key==='dates'?'#stay':key==='room'?'[data-choice][tabindex="0"]':`#${key}`)));}
      else {stepperEl.value?.element.setError(event.detail.previousValue!,false);if(number===2)update({roomChosen:true});}
    };
    const changed=(event:CustomEvent<StepperChangeEvent>)=>{
      if(event.detail.value==='room'&&!unavailable(s,roomOf(s)))update({roomChosen:true});
      if(event.detail.value==='confirmation'){for(const step of STEPS.slice(0,4))stepperEl.value?.element.setStepState(step.value,{editable:false});stepperEl.value?.element.completeStep('confirmation');}
    };
    const choose=(value:string,focus=false)=>{update(choicePatch(value));if(focus)requestAnimationFrame(()=>rootEl.value?.querySelector<HTMLElement>(`[data-choice="${value}"]`)?.focus());};
    const onChoiceKey=(event:KeyboardEvent,value:string)=>{
      const options=choices(s);let next:string|undefined;
      if(['ArrowRight','ArrowDown'].includes(event.key))next=choiceAfter(s,value,1);else if(['ArrowLeft','ArrowUp'].includes(event.key))next=choiceAfter(s,value,-1);
      else if(event.key==='Home')next=options[0];else if(event.key==='End')next=options.at(-1);else if([' ','Enter'].includes(event.key)&&options.includes(value))next=value;
      if(next){event.preventDefault();choose(next,true);}
    };
    const selected=(room:Room,rate:typeof RATES[number])=>choiceOf(s)===`${room.value}:${rate.value}`&&!unavailable(s,room);
    const tabFor=(key:string)=>key===(choices(s).includes(choiceOf(s))?choiceOf(s):choices(s)[0])?0:-1;
    const priceFor=(room:Room,rate:typeof RATES[number])=>({...s,room:room.value,rate:rate.value});
    const setRange=(value:string)=>{const range=rangeParts(value);if(range)update({checkIn:range[0],checkOut:range[1]});};
    const paymentLabel=()=>PAYMENT_OPTIONS.find(option=>option.value===s.payment)?.label;
    return {s,errors,expanded,rootEl,stepperEl,update,announce,veto,changed,choose,onChoiceKey,selected,tabFor,priceFor,setRange,paymentLabel,DEFAULTS,DETAIL_FIELDS,EXTRAS,GUEST_FIELDS,HOTEL,PAYMENT_OPTIONS,RATES,ROOMS,STEPS,TODAY,amenitiesOf,unavailable,money,nightlyRate,nightText,roomTotal,rateConditions,extraIncluded,extraLabel,paymentNote,stepHeading,total};
  },
  template:`<section ref="rootEl" class="booking">
    <div class="booking__intro"><h1 class="booking__title mtrl-headline-medium">{{ HOTEL.name }}</h1><p class="mtrl-body-medium">{{ HOTEL.stars }} · {{ HOTEL.address }} · {{ HOTEL.rating }}</p></div>
    <div class="booking__layout">
      <MStepper ref="stepperEl" orientation="auto" labelPlacement="end" linear ariaLabel="Hotel booking steps" defaultValue="dates" @beforechange="veto" @change="changed">
        <MStep v-for="(step,index) in STEPS" :key="step.value" :value="step.value" :label="step.title">
          <div class="booking__step"><h2 class="booking__step-title" tabindex="-1">{{ stepHeading(index+1) }}</h2>
            <template v-if="index===0"><h3 class="mtrl-title-large">Plan your stay</h3>
              <MDatepicker id="stay" label="Check-in → Check-out" variant="modal" selectionMode="range" dateFormat="D MMM YYYY" locale="en-GB" :supportingText="nightText(s)" :min="TODAY" :value="s.checkIn+'/'+s.checkOut" @change="setRange($event.detail.value)"/>
              <p v-if="errors.dates" class="booking__field-error mtrl-body-small">{{ errors.dates }}</p>
              <div class="booking__grid booking__grid--three"><MSelect v-for="field in GUEST_FIELDS" :key="field.key" :id="field.key" :label="field.label" variant="outlined" :value="s[field.key]" @change="update({[field.key]:$event.detail.value})"><MSelectOption v-for="value in field.options" :key="value" :value="value">{{ value }}</MSelectOption></MSelect></div>
              <p v-if="errors.adults" class="booking__field-error mtrl-body-small">{{ errors.adults }}</p>
            </template>
            <template v-if="index===1"><h3 class="mtrl-title-large">Choose your room</h3>
              <div class="booking__rooms" role="radiogroup" aria-label="Room type" tabindex="-1">
                <MCard v-for="room in ROOMS" :key="room.value" variant="outlined" class="booking__room"><div class="booking__room-card">
                  <h3 class="mtrl-title-medium">{{ room.label }}</h3><p class="mtrl-body-medium">{{ room.beds }} · {{ room.size }} m² · Up to {{ room.capacity }} guests</p>
                  <div class="booking__amenities"><span v-for="amenity in amenitiesOf(room)" :key="amenity.label" class="booking__amenity"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path :d="amenity.path"/></svg>{{ amenity.label }}</span></div>
                  <p class="mtrl-title-medium">from {{ money(room.rate) }} / night</p><p :id="room.value+'-availability'" class="mtrl-body-small mtrl-text-surface-variant">{{ unavailable(s,room)||(room.stock===2?'Only 2 left':'') }}</p>
                  <div class="booking__rates"><div v-for="rate in RATES" :key="rate.value" class="booking__rate" role="radio" :aria-label="room.label+' — '+rate.label" :aria-describedby="room.value+'-availability'" :aria-checked="selected(room,rate)" :aria-disabled="Boolean(unavailable(s,room))" :data-choice="room.value+':'+rate.value" :tabindex="tabFor(room.value+':'+rate.value)" @click="!unavailable(s,room)&&choose(room.value+':'+rate.value,true)" @keydown="onChoiceKey($event,room.value+':'+rate.value)">
                    <span inert aria-hidden="true"><MRadios :value="selected(room,rate)?'selected':''" :disabled="Boolean(unavailable(s,room))"><MRadio value="selected" label=""/></MRadios></span>
                    <div class="booking__rate-copy"><p class="mtrl-title-small">{{ rate.label }}</p><p class="mtrl-body-small">{{ rateConditions(s,rate) }}</p></div>
                    <div class="booking__rate-price"><p class="mtrl-title-small">{{ money(nightlyRate(priceFor(room,rate))) }} / night</p><p class="mtrl-body-small">{{ money(roomTotal(priceFor(room,rate))) }} stay total</p></div>
                  </div></div>
                </div></MCard>
              </div><p v-if="errors.room" class="booking__field-error mtrl-body-small">{{ errors.room }}</p>
            </template>
            <template v-if="index===2"><h3 class="mtrl-title-large">Make your stay yours</h3>
              <MCheckbox v-for="extra in EXTRAS" :key="extra.key" :id="extra.key" :checked="s[extra.key]||extraIncluded(s,extra.key)" :disabled="extraIncluded(s,extra.key)" @change="update({[extra.key]:$event.detail.checked})">{{ extraLabel(s,extra) }}</MCheckbox>
            </template>
            <template v-if="index===3"><h3 class="mtrl-title-large">Who is staying?</h3>
              <div class="booking__grid"><MTextField v-for="field in DETAIL_FIELDS" :key="field.key" :id="field.key" :label="field.label" variant="outlined" :type="field.type" :value="s[field.key]" :error="Boolean(errors[field.key])" :supportingText="errors[field.key]||field.helper" @input="update({[field.key]:$event.detail.value})"/></div>
              <MCheckbox id="forSomeoneElse" :checked="s.forSomeoneElse" @change="update({forSomeoneElse:$event.detail.checked})">I'm booking for someone else</MCheckbox>
              <div :hidden="!s.forSomeoneElse"><MTextField id="guestName" label="Lead guest name" variant="outlined" :value="s.guestName" :error="Boolean(errors.guestName)" :supportingText="errors.guestName||'Required when booking for someone else'" @input="update({guestName:$event.detail.value})"/></div>
              <MTextField id="requests" label="Special requests" variant="outlined" type="multiline" :value="s.requests" supportingText="Optional · Subject to availability" @input="update({requests:$event.detail.value})"/>
              <MSelect id="payment" label="Payment" variant="outlined" :value="s.payment" @change="update({payment:$event.detail.value})"><MSelectOption v-for="option in PAYMENT_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</MSelectOption></MSelect><p class="mtrl-body-medium">{{ paymentNote(s) }}</p>
            </template>
            <template v-if="index===4"><h3 class="mtrl-title-large">Your stay is confirmed</h3><p class="mtrl-headline-small">Booking reference {{ HOTEL.reference }}</p><p class="mtrl-body-medium">Demo reservation · Nothing has been charged or sent.</p>
              <div class="booking__confirmation"><HotelSummary :booking="s"/><p class="mtrl-body-medium">Lead guest: {{ s.forSomeoneElse?s.guestName:s.firstName+' '+s.lastName }}</p><p class="mtrl-body-medium">Confirmation email: {{ s.email }}</p><p class="mtrl-body-medium">Check-in from 15:00 · Check-out until 11:00</p><p class="mtrl-body-medium">Payment: {{ paymentLabel() }}</p></div>
              <div class="booking__actions"><MButton variant="outlined" @click="announce('Calendar download is a demo action.')">Add to calendar</MButton><MButton @click="announce('Manage booking is a demo action.')">Manage booking</MButton></div>
            </template>
            <footer v-if="index<4" class="booking__actions"><div v-if="index>0" class="booking__action" data-stepper-prev><MButton variant="text">Back</MButton></div><div class="booking__action booking__action--next" data-stepper-next><MButton>{{ index===0?'Check availability':index===3?'Book':'Next' }}</MButton></div></footer>
          </div>
        </MStep>
      </MStepper>
      <div :class="['booking__summary-wrap',{'booking__summary-wrap--open':expanded}]"><MButton variant="outlined" class="booking__summary-toggle" :aria-expanded="expanded" aria-controls="price-summary" @click="expanded=!expanded">{{ s.roomChosen?'Total '+money(total(s))+' · View details':'Your stay · View details' }}</MButton><MCard id="price-summary" class="booking__summary" variant="filled" headline="Your stay"><div class="booking__summary-lines"><HotelSummary :booking="s"/></div></MCard></div>
    </div><p class="mtrl-body-small">Fictional hotel · Demonstration rates and taxes. No payment is collected.</p><MSnackbar duration="short"/>
  </section>`,
});
