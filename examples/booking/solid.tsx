/** @jsxImportSource solid-js */
// Solid renders the same hotel reservation rules through Material's adapters.
import { createSignal, onMount, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Button, Card, Checkbox, Datepicker, Radio, Radios, Select, SelectOption, Snackbar, TextField } from 'material/solid';
import { Step, Stepper } from 'material-addons/solid';
import type { StepperElement } from 'material-addons/elements';
import type { StepperBeforeChangeEvent, StepperChangeEvent } from 'material-addons/components/stepper';
import { DEFAULTS, DETAIL_FIELDS, EXTRAS, GUEST_FIELDS, HOTEL, PAYMENT_OPTIONS, RATES, ROOMS, STEPS, TODAY, amenitiesOf, amend, cancellation, choiceAfter, choiceOf, choicePatch, choices, extraIncluded, extraLabel, guestText, money, nightlyRate, nightText, paymentNote, priceLines, rangeParts, rateConditions, rateText, roomOf, roomTotal, stayText, stepHeading, stepNumberOf, total, unavailable, validateStep, vatIncluded, type Booking, type BookingErrors } from './shared';
import { focusControl, watchStepper } from './hotel-ui';

export default function Booking() {
  const [s,setS]=createStore<Booking>({...DEFAULTS});
  const [errors,setErrors]=createSignal<BookingErrors>({});
  const [expanded,setExpanded]=createSignal(false);
  const refs={root:{current:null as HTMLElement|null},stepper:{current:null as StepperElement|null}};
  const update=(patch:Partial<Booking>)=>setS(amend({...s},patch));
  onMount(()=>{if(refs.stepper.current)onCleanup(watchStepper(refs.stepper.current));});
  const announce=(message:string)=>{
    const host=refs.root.current?.querySelector('m-snackbar') as HTMLElement & {show():void;component?:{setDuration(value:string):void}};
    host.setAttribute('message',message);host.component?.setDuration('short');host.show();
  };
  const focusError=(messages:BookingErrors)=>{
    const key=Object.keys(messages)[0];if(!key)return;
    requestAnimationFrame(()=>focusControl(refs.root.current?.querySelector<HTMLElement>(key==='dates'?'#stay':key==='room'?'[data-choice][tabindex="0"]':`#${key}`)));
  };
  const veto=(event:CustomEvent<StepperBeforeChangeEvent>)=>{
    if(event.detail.direction!=='forward')return;
    const step=stepNumberOf(event.detail.previousValue??'dates');const nextErrors=validateStep(s,step);setErrors(nextErrors);
    if(Object.keys(nextErrors).length){event.detail.preventDefault();refs.stepper.current?.setError(event.detail.previousValue!,true);focusError(nextErrors);}
    else {refs.stepper.current?.setError(event.detail.previousValue!,false);if(step===2)update({roomChosen:true});}
  };
  const changed=(event:CustomEvent<StepperChangeEvent>)=>{
    if(event.detail.value==='room'&&!unavailable(s,roomOf(s)))update({roomChosen:true});
    if(event.detail.value==='confirmation'){
      for(const step of STEPS.slice(0,4))refs.stepper.current?.setStepState(step.value,{editable:false});
      refs.stepper.current?.completeStep('confirmation');
    }
  };
  const choose=(value:string,focus=false)=>{
    update(choicePatch(value));
    if(focus)requestAnimationFrame(()=>refs.root.current?.querySelector<HTMLElement>(`[data-choice="${value}"]`)?.focus());
  };
  const onChoiceKey=(event:{key:string;preventDefault():void},value:string)=>{
    const options=choices(s);let next:string|undefined;
    if(['ArrowRight','ArrowDown'].includes(event.key))next=choiceAfter(s,value,1);
    else if(['ArrowLeft','ArrowUp'].includes(event.key))next=choiceAfter(s,value,-1);
    else if(event.key==='Home')next=options[0];else if(event.key==='End')next=options.at(-1);
    else if([' ','Enter'].includes(event.key)&&options.includes(value))next=value;
    if(next){event.preventDefault();choose(next,true);}
  };
  const summaryContent=()=> <>
    <p class="mtrl-title-medium">{HOTEL.name}</p><p class="mtrl-body-medium">{stayText(s)}</p><p class="mtrl-body-medium">{guestText(s)}</p>
    {s.roomChosen?<>
      <p class="mtrl-body-medium">{roomOf(s).label} · {rateText(s)}</p>
      {priceLines(s).map(line=><div class="booking__price-line"><span class="mtrl-body-medium">{line.label}</span><span class="mtrl-body-medium">{line.amount}</span></div>)}
      <p class="mtrl-title-large">Total {money(total(s))}</p><p class="mtrl-body-small mtrl-text-surface-variant">incl. VAT {money(vatIncluded(s))}</p><p class="mtrl-body-small">{cancellation(s)}</p>
    </>:<p class="mtrl-body-medium">{unavailable(s,roomOf(s))?'Room: choose an available room':'Room: choose in the next step'}</p>}
  </>;
  const actions=(index:number,label='Next')=><footer class="booking__actions">
    {index>0&&<div class="booking__action" data-stepper-prev><Button variant="text">Back</Button></div>}
    <div class="booking__action booking__action--next" data-stepper-next><Button>{label}</Button></div>
  </footer>;
  return <section class="booking" ref={element=>{refs.root.current=element;}}>
    <div class="booking__intro"><h1 class="booking__title mtrl-headline-medium">{HOTEL.name}</h1><p class="mtrl-body-medium">★★★★ · {HOTEL.address} · 4.6 (1,284 reviews)</p></div>
    <div class="booking__layout">
      <Stepper ref={element=>{refs.stepper.current=element;}} orientation="auto" labelPlacement="end" linear ariaLabel="Hotel booking steps" defaultValue="dates" onBeforeChange={veto} onChange={changed}>
        {STEPS.map((step,index)=><Step value={step.value} label={step.title}>
          <div class="booking__step"><h2 class="booking__step-title" tabIndex={-1}>{stepHeading(index+1)}</h2>
            {index===0&&<>
              <h3 class="mtrl-title-large">Plan your stay</h3>
              <Datepicker id="stay" label="Check-in → Check-out" variant="modal" selectionMode="range" dateFormat="D MMM YYYY" locale="en-GB" supportingText={nightText(s)} min={TODAY} value={`${s.checkIn}/${s.checkOut}`} onChange={event=>{const range=rangeParts(event.detail.value);if(range)update({checkIn:range[0],checkOut:range[1]});}} />
              {errors().dates&&<p class="booking__field-error mtrl-body-small">{errors().dates}</p>}
              <div class="booking__grid booking__grid--three">{GUEST_FIELDS.map(field=><Select id={field.key} label={field.label} variant="outlined" value={s[field.key]} onChange={event=>update({[field.key]:event.detail.value??s[field.key]})}>{field.options.map(value=><SelectOption value={value}>{value}</SelectOption>)}</Select>)}</div>
              {errors().adults&&<p class="booking__field-error mtrl-body-small">{errors().adults}</p>}{actions(index,'Check availability')}
            </>}
            {index===1&&<>
              <h3 class="mtrl-title-large">Choose your room</h3>
              <div class="booking__rooms" role="radiogroup" aria-label="Room type" tabIndex={-1}>
                {ROOMS.map(room=>{
                  const blocked=()=>unavailable(s,room);
                  return <Card variant="outlined" class="booking__room"><div class="booking__room-card">
                    <h3 class="mtrl-title-medium">{room.label}</h3><p class="mtrl-body-medium">{room.beds} · {room.size} m² · Up to {room.capacity} guests</p>
                    <div class="booking__amenities">{amenitiesOf(room).map(amenity=><span class="booking__amenity"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={amenity.path}/></svg>{amenity.label}</span>)}</div>
                    <p class="mtrl-title-medium">from {money(room.rate)} / night</p><p class="mtrl-body-small mtrl-text-surface-variant" id={`${room.value}-availability`}>{blocked()||(room.stock===2?'Only 2 left':'')}</p>
                    <div class="booking__rates">{RATES.map(rate=>{
                      const key=`${room.value}:${rate.value}`;const selected=()=>choiceOf(s)===key&&!blocked();const stay=()=>({...s,room:room.value,rate:rate.value});
                      return <div class="booking__rate" role="radio" aria-label={`${room.label} — ${rate.label}`} aria-describedby={`${room.value}-availability`} aria-checked={selected()} aria-disabled={!!blocked()} data-choice={key} tabIndex={key===(choices(s).includes(choiceOf(s))?choiceOf(s):choices(s)[0])?0:-1} onClick={()=>{if(!blocked())choose(key,true);}} onKeyDown={event=>onChoiceKey(event,key)}>
                        <span inert aria-hidden="true"><Radios value={selected()?'selected':''} disabled={!!blocked()}><Radio value="selected" label=""/></Radios></span>
                        <div class="booking__rate-copy"><p class="mtrl-title-small">{rate.label}</p><p class="mtrl-body-small">{rateConditions(s,rate)}</p></div>
                        <div class="booking__rate-price"><p class="mtrl-title-small">{money(nightlyRate(stay()))} / night</p><p class="mtrl-body-small">{money(roomTotal(stay()))} stay total</p></div>
                      </div>;
                    })}</div>
                  </div></Card>;
                })}
              </div>{errors().room&&<p class="booking__field-error mtrl-body-small">{errors().room}</p>}{actions(index)}
            </>}
            {index===2&&<>
              <h3 class="mtrl-title-large">Make your stay yours</h3>
              {EXTRAS.map(extra=><Checkbox id={extra.key} checked={s[extra.key]||extraIncluded(s,extra.key)} disabled={extraIncluded(s,extra.key)} onChange={event=>update({[extra.key]:event.detail.checked})}>{extraLabel(s,extra)}</Checkbox>)}{actions(index)}
            </>}
            {index===3&&<>
              <h3 class="mtrl-title-large">Who is staying?</h3>
              <div class="booking__grid">{DETAIL_FIELDS.map(field=><TextField id={field.key} label={field.label} variant="outlined" type={field.type} value={s[field.key]} error={!!errors()[field.key]} supportingText={errors()[field.key]??field.helper} onInput={event=>update({[field.key]:event.detail.value})}/>)}</div>
              <Checkbox id="forSomeoneElse" checked={s.forSomeoneElse} onChange={event=>update({forSomeoneElse:event.detail.checked})}>I'm booking for someone else</Checkbox>
              <div hidden={!s.forSomeoneElse}><TextField id="guestName" label="Lead guest name" variant="outlined" value={s.guestName} error={!!errors().guestName} supportingText={errors().guestName??'Required when booking for someone else'} onInput={event=>update({guestName:event.detail.value})}/></div>
              <TextField id="requests" label="Special requests" variant="outlined" type="multiline" value={s.requests} supportingText="Optional · Subject to availability" onInput={event=>update({requests:event.detail.value})}/>
              <Select id="payment" label="Payment" variant="outlined" value={s.payment} onChange={event=>update({payment:event.detail.value??'hotel'})}>{PAYMENT_OPTIONS.map(option=><SelectOption value={option.value}>{option.label}</SelectOption>)}</Select>
              <p class="mtrl-body-medium">{paymentNote(s)}</p>{actions(index,'Book')}
            </>}
            {index===4&&<>
              <h3 class="mtrl-title-large">Your stay is confirmed</h3><p class="mtrl-headline-small">Booking reference {HOTEL.reference}</p><p class="mtrl-body-medium">Demo reservation · Nothing has been charged or sent.</p>
              <div class="booking__confirmation">{summaryContent()}<p class="mtrl-body-medium">Lead guest: {s.forSomeoneElse?s.guestName:`${s.firstName} ${s.lastName}`}</p><p class="mtrl-body-medium">Confirmation email: {s.email}</p><p class="mtrl-body-medium">Check-in from 15:00 · Check-out until 11:00</p><p class="mtrl-body-medium">Payment: {PAYMENT_OPTIONS.find(option=>option.value===s.payment)?.label}</p></div>
              <div class="booking__actions"><Button variant="outlined" onClick={()=>announce('Calendar download is a demo action.')}>Add to calendar</Button><Button onClick={()=>announce('Manage booking is a demo action.')}>Manage booking</Button></div>
            </>}
          </div>
        </Step>)}
      </Stepper>
      <div class={`booking__summary-wrap${expanded()?' booking__summary-wrap--open':''}`}>
        <Button variant="outlined" class="booking__summary-toggle" aria-expanded={expanded()} aria-controls="price-summary" onClick={()=>setExpanded(!expanded())}>{s.roomChosen?`Total ${money(total(s))} · View details`:'Your stay · View details'}</Button>
        <Card id="price-summary" class="booking__summary" variant="filled" headline="Your stay"><div class="booking__summary-lines">{summaryContent()}</div></Card>
      </div>
    </div>
    <p class="mtrl-body-small">Fictional hotel · Demonstration rates and taxes. No payment is collected.</p><Snackbar duration="short"/>
  </section>;
}
