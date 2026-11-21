<script lang="ts">
  import { onMount } from 'svelte';
  import { Button, Card, Checkbox, Datepicker, Radio, Radios, Select, SelectOption, Snackbar, TextField } from 'material/svelte';
  import { Step, Stepper } from 'material-addons/svelte';
  import type { StepperElement } from 'material-addons/elements';
  import type { StepperBeforeChangeEvent, StepperChangeEvent } from 'material-addons/components/stepper';
  import { DEFAULTS, DETAIL_FIELDS, EXTRAS, GUEST_FIELDS, HOTEL, PAYMENT_OPTIONS, RATES, ROOMS, STEPS, TODAY, amenitiesOf, amend, cancellation, choiceAfter, choiceOf, choicePatch, choices, extraIncluded, extraLabel, guestText, money, nightlyRate, nightText, paymentNote, priceLines, rangeParts, rateConditions, rateText, roomOf, roomTotal, stayText, stepHeading, stepNumberOf, total, unavailable, validateStep, vatIncluded, type Booking, type BookingErrors } from './shared';
  import { focusControl, watchStepper } from './hotel-ui';
  let s=$state<Booking>({...DEFAULTS});let errors=$state<BookingErrors>({});let expanded=$state(false);
  let rootEl:HTMLElement;let stepperEl:{element:StepperElement}|undefined=$state();
  const update=(patch:Partial<Booking>)=>{s=amend(s,patch);};
  onMount(()=>stepperEl?watchStepper(stepperEl.element):undefined);
  const announce=(message:string)=>{const host=rootEl.querySelector('m-snackbar') as HTMLElement & {show():void;component?:{setDuration(value:string):void}};host.setAttribute('message',message);host.component?.setDuration('short');host.show();};
  const veto=(event:CustomEvent<StepperBeforeChangeEvent>)=>{
    if(event.detail.direction!=='forward')return;const number=stepNumberOf(event.detail.previousValue??'dates');const messages=validateStep(s,number);errors=messages;
    if(Object.keys(messages).length){event.detail.preventDefault();stepperEl?.element.setError(event.detail.previousValue!,true);const key=Object.keys(messages)[0];requestAnimationFrame(()=>focusControl(rootEl.querySelector<HTMLElement>(key==='dates'?'#stay':key==='room'?'[data-choice][tabindex="0"]':`#${key}`)));}
    else{stepperEl?.element.setError(event.detail.previousValue!,false);if(number===2)update({roomChosen:true});}
  };
  const changed=(event:CustomEvent<StepperChangeEvent>)=>{
    if(event.detail.value==='room'&&!unavailable(s,roomOf(s)))update({roomChosen:true});
    if(event.detail.value==='confirmation'){for(const step of STEPS.slice(0,4))stepperEl?.element.setStepState(step.value,{editable:false});stepperEl?.element.completeStep('confirmation');}
  };
  const choose=(value:string,focus=false)=>{update(choicePatch(value));if(focus)requestAnimationFrame(()=>rootEl.querySelector<HTMLElement>(`[data-choice="${value}"]`)?.focus());};
  const onChoiceKey=(event:KeyboardEvent,value:string)=>{
    const options=choices(s);let next:string|undefined;
    if(['ArrowRight','ArrowDown'].includes(event.key))next=choiceAfter(s,value,1);else if(['ArrowLeft','ArrowUp'].includes(event.key))next=choiceAfter(s,value,-1);
    else if(event.key==='Home')next=options[0];else if(event.key==='End')next=options.at(-1);else if([' ','Enter'].includes(event.key)&&options.includes(value))next=value;
    if(next){event.preventDefault();choose(next,true);}
  };
</script>

{#snippet summaryContent()}
  <p class="mtrl-title-medium">{HOTEL.name}</p><p class="mtrl-body-medium">{stayText(s)}</p><p class="mtrl-body-medium">{guestText(s)}</p>
  {#if s.roomChosen}
    <p class="mtrl-body-medium">{roomOf(s).label} · {rateText(s)}</p>
    {#each priceLines(s) as line (line.label)}<div class="booking__price-line"><span class="mtrl-body-medium">{line.label}</span><span class="mtrl-body-medium">{line.amount}</span></div>{/each}
    <p class="mtrl-title-large">Total {money(total(s))}</p><p class="mtrl-body-small mtrl-text-surface-variant">incl. VAT {money(vatIncluded(s))}</p><p class="mtrl-body-small">{cancellation(s)}</p>
  {:else}<p class="mtrl-body-medium">{unavailable(s,roomOf(s))?'Room: choose an available room':'Room: choose in the next step'}</p>{/if}
{/snippet}
<section class="booking" bind:this={rootEl}>
  <div class="booking__intro"><h1 class="booking__title mtrl-headline-medium">{HOTEL.name}</h1><p class="mtrl-body-medium">★★★★ · {HOTEL.address} · 4.6 (1,284 reviews)</p></div>
  <div class="booking__layout">
    <Stepper bind:this={stepperEl} orientation="auto" labelPlacement="end" linear ariaLabel="Hotel booking steps" defaultValue="dates" onbeforechange={veto} onchange={changed}>
      {#each STEPS as step,index (step.value)}<Step value={step.value} label={step.title}>
        <div class="booking__step"><h2 class="booking__step-title" tabindex="-1">{stepHeading(index+1)}</h2>
          {#if index===0}<h3 class="mtrl-title-large">Plan your stay</h3>
            <Datepicker id="stay" label="Check-in → Check-out" variant="modal" selectionMode="range" dateFormat="D MMM YYYY" locale="en-GB" supportingText={nightText(s)} min={TODAY} value={`${s.checkIn}/${s.checkOut}`} onchange={event=>{const range=rangeParts(event.detail.value);if(range)update({checkIn:range[0],checkOut:range[1]});}}/>
            {#if errors.dates}<p class="booking__field-error mtrl-body-small">{errors.dates}</p>{/if}
            <div class="booking__grid booking__grid--three">{#each GUEST_FIELDS as field (field.key)}<Select id={field.key} label={field.label} variant="outlined" value={s[field.key]} onchange={event=>update({[field.key]:event.detail.value??s[field.key]})}>{#each field.options as value}<SelectOption {value}>{value}</SelectOption>{/each}</Select>{/each}</div>
            {#if errors.adults}<p class="booking__field-error mtrl-body-small">{errors.adults}</p>{/if}
          {/if}
          {#if index===1}<h3 class="mtrl-title-large">Choose your room</h3>
            <div class="booking__rooms" role="radiogroup" aria-label="Room type" tabindex="-1">
              {#each ROOMS as room (room.value)}<Card variant="outlined" class="booking__room"><div class="booking__room-card">
                <h3 class="mtrl-title-medium">{room.label}</h3><p class="mtrl-body-medium">{room.beds} · {room.size} m² · Up to {room.capacity} guests</p>
                <div class="booking__amenities">{#each amenitiesOf(room) as amenity (amenity.label)}<span class="booking__amenity"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={amenity.path}/></svg>{amenity.label}</span>{/each}</div>
                <p class="mtrl-title-medium">from {money(room.rate)} / night</p><p id={`${room.value}-availability`} class="mtrl-body-small mtrl-text-surface-variant">{unavailable(s,room)||(room.stock===2?'Only 2 left':'')}</p>
                <div class="booking__rates">{#each RATES as rate (rate.value)}
                  <div class="booking__rate" role="radio" aria-label={`${room.label} — ${rate.label}`} aria-describedby={`${room.value}-availability`} aria-checked={choiceOf(s)===`${room.value}:${rate.value}`&&!unavailable(s,room)} aria-disabled={!!unavailable(s,room)} data-choice={`${room.value}:${rate.value}`} tabindex={`${room.value}:${rate.value}`===(choices(s).includes(choiceOf(s))?choiceOf(s):choices(s)[0])?0:-1} onclick={()=>{if(!unavailable(s,room))choose(`${room.value}:${rate.value}`,true);}} onkeydown={event=>onChoiceKey(event,`${room.value}:${rate.value}`)}>
                    <span inert aria-hidden="true"><Radios value={choiceOf(s)===`${room.value}:${rate.value}`&&!unavailable(s,room)?'selected':''} disabled={!!unavailable(s,room)}><Radio value="selected" label=""/></Radios></span>
                    <div class="booking__rate-copy"><p class="mtrl-title-small">{rate.label}</p><p class="mtrl-body-small">{rateConditions(s,rate)}</p></div>
                    <div class="booking__rate-price"><p class="mtrl-title-small">{money(nightlyRate({...s,room:room.value,rate:rate.value}))} / night</p><p class="mtrl-body-small">{money(roomTotal({...s,room:room.value,rate:rate.value}))} stay total</p></div>
                  </div>
                {/each}</div>
              </div></Card>{/each}
            </div>{#if errors.room}<p class="booking__field-error mtrl-body-small">{errors.room}</p>{/if}
          {/if}
          {#if index===2}<h3 class="mtrl-title-large">Make your stay yours</h3>
            {#each EXTRAS as extra (extra.key)}<Checkbox id={extra.key} checked={s[extra.key]||extraIncluded(s,extra.key)} disabled={extraIncluded(s,extra.key)} onchange={event=>update({[extra.key]:event.detail.checked})}>{extraLabel(s,extra)}</Checkbox>{/each}
          {/if}
          {#if index===3}<h3 class="mtrl-title-large">Who is staying?</h3>
            <div class="booking__grid">{#each DETAIL_FIELDS as field (field.key)}<TextField id={field.key} label={field.label} variant="outlined" type={field.type} value={s[field.key]} error={!!errors[field.key]} supportingText={errors[field.key]??field.helper} oninput={event=>update({[field.key]:event.detail.value})}/>{/each}</div>
            <Checkbox id="forSomeoneElse" checked={s.forSomeoneElse} onchange={event=>update({forSomeoneElse:event.detail.checked})}>I'm booking for someone else</Checkbox>
            <div hidden={!s.forSomeoneElse}><TextField id="guestName" label="Lead guest name" variant="outlined" value={s.guestName} error={!!errors.guestName} supportingText={errors.guestName??'Required when booking for someone else'} oninput={event=>update({guestName:event.detail.value})}/></div>
            <TextField id="requests" label="Special requests" variant="outlined" type="multiline" value={s.requests} supportingText="Optional · Subject to availability" oninput={event=>update({requests:event.detail.value})}/>
            <Select id="payment" label="Payment" variant="outlined" value={s.payment} onchange={event=>update({payment:event.detail.value??'hotel'})}>{#each PAYMENT_OPTIONS as option}<SelectOption value={option.value}>{option.label}</SelectOption>{/each}</Select><p class="mtrl-body-medium">{paymentNote(s)}</p>
          {/if}
          {#if index===4}<h3 class="mtrl-title-large">Your stay is confirmed</h3><p class="mtrl-headline-small">Booking reference {HOTEL.reference}</p><p class="mtrl-body-medium">Demo reservation · Nothing has been charged or sent.</p>
            <div class="booking__confirmation">{@render summaryContent()}<p class="mtrl-body-medium">Lead guest: {s.forSomeoneElse?s.guestName:`${s.firstName} ${s.lastName}`}</p><p class="mtrl-body-medium">Confirmation email: {s.email}</p><p class="mtrl-body-medium">Check-in from 15:00 · Check-out until 11:00</p><p class="mtrl-body-medium">Payment: {PAYMENT_OPTIONS.find(option=>option.value===s.payment)?.label}</p></div>
            <div class="booking__actions"><Button variant="outlined" onclick={()=>announce('Calendar download is a demo action.')}>Add to calendar</Button><Button onclick={()=>announce('Manage booking is a demo action.')}>Manage booking</Button></div>
          {/if}
          {#if index<4}<footer class="booking__actions">{#if index>0}<div class="booking__action" data-stepper-prev><Button variant="text">Back</Button></div>{/if}<div class="booking__action booking__action--next" data-stepper-next><Button>{index===0?'Check availability':index===3?'Book':'Next'}</Button></div></footer>{/if}
        </div>
      </Step>{/each}
    </Stepper>
    <div class={`booking__summary-wrap${expanded?' booking__summary-wrap--open':''}`}><Button variant="outlined" class="booking__summary-toggle" aria-expanded={expanded} aria-controls="price-summary" onclick={()=>expanded=!expanded}>{s.roomChosen?`Total ${money(total(s))} · View details`:'Your stay · View details'}</Button><Card id="price-summary" class="booking__summary" variant="filled" headline="Your stay"><div class="booking__summary-lines">{@render summaryContent()}</div></Card></div>
  </div><p class="mtrl-body-small">Fictional hotel · Demonstration rates and taxes. No payment is collected.</p><Snackbar duration="short"/>
</section>
