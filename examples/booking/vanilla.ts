// Vanilla builds the hotel flow with the same factories used by the elements.
import createButton from 'material/components/button';
import createCard from 'material/components/card';
import createCheckbox from 'material/components/checkbox';
import createDatePicker from 'material/components/datepicker';
import createRadios from 'material/components/radios';
import createSelect from 'material/components/select';
import createSnackbar from 'material/components/snackbar';
import createTextField from 'material/components/text-field';
import { createStepper, type StepConfig } from 'material-addons/components/stepper';
import { focusControl, invalidateSteps, DEFAULTS, DETAIL_FIELDS, EXTRAS, GUEST_FIELDS, HOTEL, PAYMENT_OPTIONS, RATES, ROOMS, STEPS, TODAY, amenitiesOf, amend, cancellation, choiceAfter, choiceOf, choicePatch, choices, extraIncluded, extraLabel, guestText, money, nightlyRate, nightText, paymentNote, priceLines, rateConditions, rateText, roomOf, roomTotal, stayText, stepHeading, total, unavailable, validateStep, vatIncluded, type Booking, type BookingErrors } from './shared';
let s:Booking={...DEFAULTS};let syncing=false;
const app=document.getElementById('app')!;
const node=(tag:string,className='',content?:string):HTMLElement=>Object.assign(document.createElement(tag),{className,...(content===undefined?{}:{textContent:content})});
const box=(className:string)=>node('div',className);
const text=(value:string,className='mtrl-body-medium',tag='p')=>node(tag,className,value);
const shell=node('section','booking');
const intro=box('booking__intro');intro.append(text(HOTEL.name,'booking__title mtrl-headline-medium','h1'),text(`${HOTEL.stars} · ${HOTEL.address} · ${HOTEL.rating}`));
const panes=STEPS.map((_,index)=>{const pane=box('booking__step');const heading=text(stepHeading(index+1),'booking__step-title','h2');heading.tabIndex=-1;pane.append(heading);return pane;});
const actions=(pane:HTMLElement,index:number,label='Next')=>{
  const footer=node('footer','booking__actions');
  if(index>0){const previous=box('booking__action');previous.setAttribute('data-stepper-prev','');previous.append(createButton({text:'Back',variant:'text'}).element);footer.append(previous);}
  const next=box('booking__action booking__action--next');next.setAttribute('data-stepper-next','');next.append(createButton({text:label}).element);footer.append(next);pane.append(footer);
};
const errorLines=new Map<string,HTMLElement>();
const errorLine=(key:string,pane:HTMLElement)=>{const item=text('','booking__field-error mtrl-body-small');item.hidden=true;errorLines.set(key,item);pane.append(item);};
const step1=panes[0]!;step1.append(text('Plan your stay','mtrl-title-large','h3'));
const stay=createDatePicker({label:'Check-in → Check-out',variant:'modal',selectionMode:'range',dateFormat:'D MMM YYYY',locale:'en-GB',supportingText:nightText(s),minDate:TODAY,value:[s.checkIn,s.checkOut]});stay.element.id='stay';step1.append(stay.element);errorLine('dates',step1);
const guestGrid=box('booking__grid booking__grid--three');
for(const field of GUEST_FIELDS){const select=createSelect({label:field.label,variant:'outlined',value:s[field.key],options:field.options.map(value=>({id:value,text:value}))});select.element.id=field.key;select.on('change',({value})=>{if(value)update({[field.key]:value});});guestGrid.append(select.element);}
step1.append(guestGrid);errorLine('adults',step1);actions(step1,0,'Check availability');
const step2=panes[1]!;step2.append(text('Choose your room','mtrl-title-large','h3'));
const group=box('booking__rooms');group.setAttribute('role','radiogroup');group.setAttribute('aria-label','Room type');group.tabIndex=-1;
const rateNodes=new Map<string,{option:HTMLElement;radio:ReturnType<typeof createRadios>;night:HTMLElement;stay:HTMLElement;policy:HTMLElement}>();
const reasons=new Map<string,HTMLElement>();
for(const room of ROOMS){
 const body=box('booking__room-card');body.append(text(room.label,'mtrl-title-medium','h3'),text(`${room.beds} · ${room.size} m² · Up to ${room.capacity} guests`));
 const amenities=box('booking__amenities');
 for(const amenity of amenitiesOf(room)){
  const item=node('span','booking__amenity');const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','currentColor');svg.setAttribute('aria-hidden','true');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',amenity.path);svg.append(path);item.append(svg,document.createTextNode(amenity.label));amenities.append(item);
 }
 const reason=text('','mtrl-body-small mtrl-text-surface-variant');reason.id=`${room.value}-availability`;reasons.set(room.value,reason);body.append(amenities,text(`from ${money(room.rate)} / night`,'mtrl-title-medium'),reason);
 const rates=box('booking__rates');
 for(const rate of RATES){
  const key=`${room.value}:${rate.value}`;const option=box('booking__rate');option.setAttribute('role','radio');option.setAttribute('aria-label',`${room.label} — ${rate.label}`);option.setAttribute('aria-describedby',reason.id);option.dataset.choice=key;
  const radio=createRadios({name:`hotel-indicator-${key}`,options:[{value:'selected',label:''}]});radio.element.setAttribute('inert','');radio.element.setAttribute('aria-hidden','true');
  const copy=box('booking__rate-copy');const policy=text('','mtrl-body-small');copy.append(text(rate.label,'mtrl-title-small'),policy);
  const prices=box('booking__rate-price');const night=text('','mtrl-title-small'),stayPrice=text('','mtrl-body-small');prices.append(night,stayPrice);option.append(radio.element,copy,prices);rates.append(option);rateNodes.set(key,{option,radio,night,stay:stayPrice,policy});
 }
 body.append(rates);const card=createCard({variant:'outlined',content:{children:[body]}});card.element.classList.add('booking__room');group.append(card.element);
}
step2.append(group);errorLine('room',step2);actions(step2,1);
const step3=panes[2]!;step3.append(text('Make your stay yours','mtrl-title-large','h3'));
const extras=new Map<string,ReturnType<typeof createCheckbox>>();
for(const extra of EXTRAS){const field=createCheckbox({label:extraLabel(s,extra)});field.element.id=extra.key;field.on('change',({checked})=>{if(!syncing)update({[extra.key]:checked});});extras.set(extra.key,field);step3.append(field.element);}
actions(step3,2);
const step4=panes[3]!;step4.append(text('Who is staying?','mtrl-title-large','h3'));
const details=box('booking__grid');const detailFields=new Map<string,ReturnType<typeof createTextField>>();
for(const field of DETAIL_FIELDS){const input=createTextField({label:field.label,variant:'outlined',type:field.type,value:s[field.key],supportingText:field.helper});input.element.id=field.key;input.on('input',({value})=>update({[field.key]:value}));detailFields.set(field.key,input);details.append(input.element);}
const other=createCheckbox({label:"I'm booking for someone else"});other.element.id='forSomeoneElse';other.on('change',({checked})=>update({forSomeoneElse:checked}));
const guestName=createTextField({label:'Lead guest name',variant:'outlined',supportingText:'Required when booking for someone else'});guestName.element.id='guestName';guestName.on('input',({value})=>update({guestName:value}));detailFields.set('guestName',guestName);
const guestWrap=box('');guestWrap.append(guestName.element);
const requests=createTextField({label:'Special requests',variant:'outlined',type:'multiline',supportingText:'Optional · Subject to availability'});requests.element.id='requests';requests.on('input',({value})=>update({requests:value}));
const payment=createSelect({label:'Payment',variant:'outlined',value:s.payment,options:PAYMENT_OPTIONS.map(option=>({id:option.value,text:option.label}))});payment.element.id='payment';payment.on('change',({value})=>{if(value)update({payment:value});});const paymentCopy=text('');
step4.append(details,other.element,guestWrap,requests.element,payment.element,paymentCopy);actions(step4,3,'Book');
const step5=panes[4]!;step5.append(text('Your stay is confirmed','mtrl-title-large','h3'),text(`Booking reference ${HOTEL.reference}`,'mtrl-headline-small'),text('Demo reservation · Nothing has been charged or sent.'));
const confirmation=box('booking__confirmation');const confirmActions=box('booking__actions');
const snackbar=createSnackbar({message:'Demo booking action',duration:'short'});
const announce=(message:string)=>{snackbar.setMessage(message);snackbar.setDuration('short');snackbar.show();};
const calendar=createButton({text:'Add to calendar',variant:'outlined'}),manage=createButton({text:'Manage booking'});calendar.on('click',()=>announce('Calendar download is a demo action.'));manage.on('click',()=>announce('Manage booking is a demo action.'));confirmActions.append(calendar.element,manage.element);step5.append(confirmation,confirmActions);
const summaryWrap=box('booking__summary-wrap');const summaryBody=box('booking__summary-lines');const summaryCard=createCard({variant:'filled',header:{title:'Your stay'},content:{children:[summaryBody]}});summaryCard.element.id='price-summary';summaryCard.element.classList.add('booking__summary');
const summaryToggle=createButton({text:'Your stay · View details',variant:'outlined'});summaryToggle.element.classList.add('booking__summary-toggle');summaryToggle.element.setAttribute('aria-expanded','false');summaryToggle.element.setAttribute('aria-controls','price-summary');summaryToggle.on('click',()=>{const open=summaryToggle.element.getAttribute('aria-expanded')!=='true';summaryToggle.element.setAttribute('aria-expanded',String(open));summaryWrap.classList.toggle('booking__summary-wrap--open',open);});summaryWrap.append(summaryToggle.element,summaryCard.element);
const renderSummary=(target:HTMLElement)=>{
 target.replaceChildren(text(HOTEL.name,'mtrl-title-medium'),text(stayText(s)),text(guestText(s)));
 if(!s.roomChosen){target.append(text(unavailable(s,roomOf(s))?'Room: choose an available room':'Room: choose in the next step'));return;}
 target.append(text(`${roomOf(s).label} · ${rateText(s)}`),...priceLines(s).map(line=>{const row=box('booking__price-line');row.append(text(line.label,'mtrl-body-medium','span'),text(line.amount,'mtrl-body-medium','span'));return row;}),text(`Total ${money(total(s))}`,'mtrl-title-large'),text(`incl. VAT ${money(vatIncluded(s))}`,'mtrl-body-small mtrl-text-surface-variant'),text(cancellation(s),'mtrl-body-small'));
};
const showErrors=(messages:BookingErrors)=>{
 for(const [key,item] of errorLines){item.textContent=messages[key as keyof BookingErrors]??'';item.hidden=!item.textContent;}
 for(const [key,field] of detailFields){field.setError(!!messages[key as keyof BookingErrors],messages[key as keyof BookingErrors]);}
 const key=Object.keys(messages)[0];if(key)focusControl(shell.querySelector<HTMLElement>(key==='dates'?'#stay':key==='room'?'[data-choice][tabindex="0"]':`#${key}`));
};
const hook=(index:number):Exclude<StepConfig['validate'],undefined>=>()=>{const messages=validateStep(s,index+1);showErrors(messages);if(Object.keys(messages).length)return false;if(index===1)update({roomChosen:true});return true;};
const stepper=createStepper({orientation:'auto',labelPlacement:'end',linear:true,focusOnAction:'heading',ariaLabel:'Hotel booking steps',steps:STEPS.map((step,index)=>({value:step.value,label:step.title,content:panes[index]!,validate:hook(index)}))});
// The factory has no label-placement setter. Apply only its existing presentation
// modifiers after resolution; bottom labels must never reach the vertical layout.
let labelRequest=0;const syncLabels=()=>{cancelAnimationFrame(labelRequest);labelRequest=requestAnimationFrame(()=>{const horizontal=stepper.getResolvedOrientation()==='horizontal';stepper.element.classList.toggle('mtrl-stepper--label-bottom',horizontal);stepper.element.classList.toggle('mtrl-stepper--label-end',!horizontal);});};
stepper.on('orientationchange',syncLabels);new ResizeObserver(syncLabels).observe(stepper.element);
stepper.on('change',event=>{if(event.value==='room'&&!unavailable(s,roomOf(s)))update({roomChosen:true});if(event.value==='confirmation'){for(const step of STEPS.slice(0,4))stepper.setStepState(step.value,{editable:false});stepper.completeStep('confirmation');}syncLabels();});
const render=()=>{
 syncing=true;stay.setSupportingText(nightText(s));const available=choices(s);const current=choiceOf(s);const focusable=available.includes(current)?current:available[0];
 for(const room of ROOMS){const reason=unavailable(s,room);reasons.get(room.value)!.textContent=reason||(room.stock===2?'Only 2 left':'');for(const rate of RATES){const key=`${room.value}:${rate.value}`;const item=rateNodes.get(key)!;const selected=current===key&&!reason;item.option.setAttribute('aria-checked',String(selected));item.option.setAttribute('aria-disabled',String(!!reason));item.option.tabIndex=key===focusable?0:-1;item.radio.setValue(selected?'selected':null);if(reason)item.radio.disable();else item.radio.enable();const value={...s,room:room.value,rate:rate.value};item.night.textContent=`${money(nightlyRate(value))} / night`;item.stay.textContent=`${money(roomTotal(value))} stay total`;item.policy.textContent=rateConditions(s,rate);}}
 for(const extra of EXTRAS){const field=extras.get(extra.key)!;field.setLabel(extraLabel(s,extra));const checked=s[extra.key]||extraIncluded(s,extra.key);if(checked!==field.isChecked()){if(checked)field.check();else field.uncheck();}if(extraIncluded(s,extra.key))field.disable();else field.enable();}
 guestWrap.hidden=!s.forSomeoneElse;paymentCopy.textContent=paymentNote(s);renderSummary(summaryBody);summaryToggle.setText(s.roomChosen?`Total ${money(total(s))} · View details`:'Your stay · View details');renderSummary(confirmation);confirmation.append(text(`Lead guest: ${s.forSomeoneElse?s.guestName:`${s.firstName} ${s.lastName}`}`),text(`Confirmation email: ${s.email}`),text('Check-in from 15:00 · Check-out until 11:00'),text(`Payment: ${PAYMENT_OPTIONS.find(option=>option.value===s.payment)?.label}`));syncing=false;
};
function update(patch:Partial<Booking>){s=amend(s,patch);invalidateSteps(stepper,patch);render();}
stay.on('change',payload=>{
 const detail=payload as unknown as {value?:unknown;rangeEndDate?:unknown;iso?:string};
 const iso=(value:unknown):string|null=>value instanceof Date?`${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`:typeof value==='string'?value.split('/')[0]!:null;
 const start=Array.isArray(detail.value)?iso(detail.value[0]):iso(detail.value);const end=iso(detail.rangeEndDate)??detail.iso?.split('/')[1]??(Array.isArray(detail.value)?iso(detail.value[1]):null);if(start&&end)update({checkIn:start,checkOut:end});
});
const choose=(key:string)=>{update(choicePatch(key));rateNodes.get(key)?.option.focus();};
group.addEventListener('click',event=>{const target=(event.target as HTMLElement).closest<HTMLElement>('[data-choice]');if(target&&target.getAttribute('aria-disabled')!=='true')choose(target.dataset.choice!);});
group.addEventListener('keydown',event=>{const target=(event.target as HTMLElement).closest<HTMLElement>('[data-choice]');if(!target)return;const options=choices(s);let next:string|undefined;if(['ArrowRight','ArrowDown'].includes(event.key))next=choiceAfter(s,target.dataset.choice!,1);else if(['ArrowLeft','ArrowUp'].includes(event.key))next=choiceAfter(s,target.dataset.choice!,-1);else if(event.key==='Home')next=options[0];else if(event.key==='End')next=options.at(-1);else if([' ','Enter'].includes(event.key)&&options.includes(target.dataset.choice!))next=target.dataset.choice;if(next){event.preventDefault();choose(next);}});
const layout=box('booking__layout');layout.append(stepper.element,summaryWrap);shell.append(intro,layout,text('Fictional hotel · Demonstration rates and taxes. No payment is collected.','mtrl-body-small'),snackbar.element);app.append(shell);render();syncLabels();
