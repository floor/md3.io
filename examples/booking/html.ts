// Web Components: a fictional hotel's own booking engine. No data leaves the page.
import 'material/elements/css';
import 'material-addons/elements/css/stepper';
import { defineAll } from 'material/elements';
import { defineStepper, type StepperElement } from 'material-addons/elements';
import { DEFAULTS, DETAIL_FIELDS, EXTRAS, GUEST_FIELDS, HOTEL, PAYMENT_OPTIONS, RATES, ROOMS, STEPS, TODAY, amenitiesOf, amend, choiceAfter, choiceOf, choicePatch, choices, cancellation, extraIncluded, extraLabel, formatDay, guestText, money, nightlyRate, nightText, paymentNote, priceLines, rangeParts, rateConditions, rateOf, rateText, roomAfter, roomOf, roomTotal, stayText, stepHeading, stepNumberOf, total, unavailable, validateStep, vatIncluded, type Booking, type BookingErrors } from './hotel';
import { focusControl, watchStepper } from './hotel-ui';
defineAll(); defineStepper();
let s: Booking = { ...DEFAULTS };
let confirmed = false;
const app = document.getElementById('app')!;
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string,string|boolean|undefined> = {}, text?: string): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  for (const [name,value] of Object.entries(attrs)) if (value !== undefined && value !== false) node.setAttribute(name, value === true ? '' : value);
  if (text !== undefined) node.textContent = text;
  return node;
};
const box = (className: string) => el('div',{class:className});
const text = (value: string, className = 'mtrl-body-medium', tag: 'p'|'h1'|'h2'|'h3'|'span' = 'p') => el(tag,{class:className},value);
const control = (tag: string, attrs: Record<string,string|boolean|undefined> = {}, label?: string) => el(tag as 'div',attrs,label);
const field = (id: string, label: string, attrs: Record<string,string|boolean|undefined> = {}) => control('m-text-field',{id,label,variant:'outlined',...attrs});
const select = (id: string, label: string, options: readonly {value:string;label:string}[], value: string) => {
  const host = control('m-select',{id,label,variant:'outlined',value});
  for (const option of options) host.append(control('m-select-option',{value:option.value},option.label));
  return host;
};
const button = (label: string, variant = 'filled') => control('m-button',{variant},label);
const shell = el('section',{class:'booking'});
const intro = box('booking__intro');
intro.append(text(HOTEL.name,'booking__title mtrl-headline-medium','h1'),text(`★★★★ · ${HOTEL.address} · 4.6 (1,284 reviews)`));
const layout = box('booking__layout');
const stepper = control('m-stepper',{orientation:'auto','label-placement':'end',linear:true,'aria-label':'Hotel booking steps',value:'dates'}) as unknown as StepperElement;
const panes: HTMLElement[] = [];
const errors = new Map<string,HTMLElement>();
for (const [index,step] of STEPS.entries()) {
  const declaration = control('m-step',{value:step.value,label:step.title});
  const pane = box('booking__step');
  pane.append(el('h2',{class:'booking__step-title',tabindex:'-1'},stepHeading(index+1)));
  declaration.append(pane);stepper.append(declaration);panes.push(pane);
}
const title = (pane: HTMLElement, value: string) => pane.append(text(value,'mtrl-title-large','h3'));
const actions = (pane: HTMLElement, index: number, nextLabel='Next') => {
  const footer = el('footer',{class:'booking__actions'});
  if (index > 0) { const previous=box('booking__action');previous.setAttribute('data-stepper-prev','');previous.append(button('Back','text'));footer.append(previous); }
  const next=box('booking__action booking__action--next'); next.setAttribute('data-stepper-next','');next.append(button(nextLabel));footer.append(next);pane.append(footer);
};
const errorLine = (key: string, parent: HTMLElement) => {const node=text('','booking__field-error mtrl-body-small');node.hidden=true;errors.set(key,node);parent.append(node);};
const step1=panes[0]!;title(step1,'Plan your stay');
const dates=control('m-datepicker',{id:'stay',label:'Check-in → Check-out',variant:'modal','selection-mode':'range','date-format':'D MMM YYYY',locale:'en-GB','supporting-text':nightText(s),min:TODAY,value:`${s.checkIn}/${s.checkOut}`});
step1.append(dates); errorLine('dates',step1);
const guestGrid=box('booking__grid booking__grid--three');
for (const item of GUEST_FIELDS) guestGrid.append(select(item.key,item.label,item.options.map(value=>({value,label:value})),s[item.key]));
step1.append(guestGrid);errorLine('adults',step1);actions(step1,0,'Check availability');
const step2=panes[1]!;title(step2,'Choose your room');
const roomGroup=el('div',{class:'booking__rooms',role:'radiogroup','aria-label':'Room type'});
const rateNodes=new Map<string,{option:HTMLElement;radio:HTMLElement;night:HTMLElement;stay:HTMLElement;policy:HTMLElement}>();
const roomReasons=new Map<string,HTMLElement>();
for (const room of ROOMS) {
  const card=control('m-card',{variant:'outlined',class:'booking__room'});const content=box('booking__room-card');
  content.append(text(room.label,'mtrl-title-medium','h3'),text(`${room.beds} · ${room.size} m² · Up to ${room.capacity} guests`));
  const amenities=box('booking__amenities');
  for (const amenity of amenitiesOf(room)) {
    const node=el('span',{class:'booking__amenity'});
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','currentColor');svg.setAttribute('aria-hidden','true');
    const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',amenity.path);svg.append(path);node.append(svg,document.createTextNode(amenity.label));amenities.append(node);
  }
  const reason=text('','mtrl-body-small mtrl-text-surface-variant');reason.id=`${room.value}-availability`;roomReasons.set(room.value,reason);
  content.append(amenities,text(`from ${money(room.rate)} / night`,'mtrl-title-medium'),reason);
  const rates=box('booking__rates');
  for (const rate of RATES) {
    const key=`${room.value}:${rate.value}`;
    const option=el('div',{class:'booking__rate',role:'radio','aria-label':`${room.label} — ${rate.label}`,'data-choice':key,'aria-describedby':reason.id});
    // The declaration needs its rendered radios host. It is decorative here;
    // the surrounding combined room/rate option owns focus and keyboard behavior.
    const radio=control('m-radios',{'aria-hidden':'true',inert:true,tabindex:'-1'});
    radio.append(control('m-radio',{value:'selected',label:''}));
    const copy=box('booking__rate-copy');const policy=text('','mtrl-body-small');copy.append(text(rate.label,'mtrl-title-small'),policy);
    const prices=box('booking__rate-price');const night=text('','mtrl-title-small'),stay=text('','mtrl-body-small');prices.append(night,stay);
    option.append(radio,copy,prices);rates.append(option);rateNodes.set(key,{option,radio,night,stay,policy});
  }
  content.append(rates);card.append(content);roomGroup.append(card);
}
step2.append(roomGroup);errorLine('room',step2);actions(step2,1);
const step3=panes[2]!;title(step3,'Make your stay yours');
const extraNodes=new Map<string,HTMLElement>();
for (const extra of EXTRAS) {const node=control('m-checkbox',{id:extra.key},extraLabel(s,extra));extraNodes.set(extra.key,node);step3.append(node);}
actions(step3,2);
const step4=panes[3]!;title(step4,'Who is staying?');
const details=box('booking__grid');
for (const item of DETAIL_FIELDS) details.append(field(item.key,item.label,{type:item.type,value:s[item.key],'supporting-text':item.helper}));
const other=control('m-checkbox',{id:'forSomeoneElse'},"I'm booking for someone else");
const guestName=field('guestName','Lead guest name',{'supporting-text':'Required when booking for someone else'});
const requests=field('requests','Special requests',{type:'multiline','supporting-text':'Optional · Subject to availability'});
const payment=select('payment','Payment',PAYMENT_OPTIONS,s.payment);const paymentCopy=text(paymentNote(s));
step4.append(details,other,guestName,requests,payment,paymentCopy);actions(step4,3,'Book');
const step5=panes[4]!;title(step5,'Your stay is confirmed');
step5.append(text(`Booking reference ${HOTEL.reference}`,'mtrl-headline-small'),text('Demo reservation · Nothing has been charged or sent.'));
const confirmation=box('booking__confirmation');step5.append(confirmation);
const confirmActions=box('booking__actions');
const calendar=button('Add to calendar','outlined'), manage=button('Manage booking');confirmActions.append(calendar,manage);step5.append(confirmActions);
// One summary, beside the flow on wide frames and expandable behind a compact total on phones.
const summaryWrap=box('booking__summary-wrap');
const summaryToggle=button('','outlined');summaryToggle.classList.add('booking__summary-toggle');summaryToggle.setAttribute('aria-expanded','false');summaryToggle.setAttribute('aria-controls','price-summary');
const summaryCard=control('m-card',{id:'price-summary',class:'booking__summary',variant:'filled',headline:'Your stay'});const summaryBody=box('booking__summary-lines');summaryCard.append(summaryBody);summaryWrap.append(summaryToggle,summaryCard);
summaryToggle.addEventListener('click',()=>{const open=summaryToggle.getAttribute('aria-expanded')!=='true';summaryToggle.setAttribute('aria-expanded',String(open));summaryWrap.classList.toggle('booking__summary-wrap--open',open);});
const snackbar=control('m-snackbar',{'duration':'short'});
const announce=(message:string)=>{snackbar.setAttribute('message',message);(snackbar as unknown as {show():void}).show();};
calendar.addEventListener('click',()=>announce('Calendar download is a demo action.'));manage.addEventListener('click',()=>announce('Manage booking is a demo action.'));
const renderSummary=(target:HTMLElement)=>{
  target.replaceChildren(text(HOTEL.name,'mtrl-title-medium'),text(stayText(s)),text(guestText(s)));
  if (!s.roomChosen) {target.append(text(unavailable(s,roomOf(s))?'Room: choose an available room':'Room: choose in the next step'));return;}
  target.append(text(`${roomOf(s).label} · ${rateText(s)}`),...priceLines(s).map(line=>{const row=box('booking__price-line');row.append(text(line.label,'mtrl-body-medium','span'),text(line.amount,'mtrl-body-medium','span'));return row;}),text(`Total ${money(total(s))}`,'mtrl-title-large'),text(`incl. VAT ${money(vatIncluded(s))}`,'mtrl-body-small mtrl-text-surface-variant'),text(cancellation(s),'mtrl-body-small'));
};
const setErrors=(messages:BookingErrors)=>{
  for (const [key,node] of errors) {node.textContent=messages[key as keyof BookingErrors]??'';node.hidden=!node.textContent;}
  for (const item of [...DETAIL_FIELDS,{key:'guestName',helper:'Required when booking for someone else'}] as const) {
    const host=shell.querySelector(`#${item.key}`)!;host.toggleAttribute('error',!!messages[item.key]);host.setAttribute('supporting-text',messages[item.key]??item.helper);
  }
  if (Object.keys(messages).length) focusControl(shell.querySelector<HTMLElement>(Object.keys(messages)[0]==='dates'?'#stay':Object.keys(messages)[0]==='room'?'[data-choice][tabindex="0"]':`#${Object.keys(messages)[0]}`));
};
const render=()=>{
  dates.setAttribute('supporting-text',nightText(s));
  const available=choices(s);const current=choiceOf(s);const focusable=available.includes(current)?current:available[0];
  for (const room of ROOMS) {
    const reason=unavailable(s,room);roomReasons.get(room.value)!.textContent=reason||(room.stock===2?'Only 2 left':'');
    for (const rate of RATES) {
      const key=`${room.value}:${rate.value}`;const node=rateNodes.get(key)!;const selected=current===key&&!reason;
      node.option.setAttribute('aria-checked',String(selected));node.option.setAttribute('aria-disabled',String(!!reason));node.option.tabIndex=key===focusable?0:-1;
      (node.radio as unknown as {value:string}).value=selected?'selected':'';(node.radio as unknown as {disabled:boolean}).disabled=!!reason;
      const stay={...s,room:room.value,rate:rate.value};
      node.night.textContent=`${money(nightlyRate(stay))} / night`;node.stay.textContent=`${money(roomTotal(stay))} stay total`;node.policy.textContent=rateConditions(s,rate);
    }
  }
  for (const extra of EXTRAS) {const node=extraNodes.get(extra.key)!;node.textContent=extraLabel(s,extra);(node as unknown as {checked:boolean}).checked=s[extra.key]||extraIncluded(s,extra.key);(node as unknown as {disabled:boolean}).disabled=extraIncluded(s,extra.key);}
  guestName.hidden=!s.forSomeoneElse;paymentCopy.textContent=paymentNote(s);
  renderSummary(summaryBody);summaryToggle.textContent=s.roomChosen?`Total ${money(total(s))} · View details`:'Your stay · View details';
  renderSummary(confirmation);confirmation.append(text(`Lead guest: ${s.forSomeoneElse?s.guestName:`${s.firstName} ${s.lastName}`}`),text(`Confirmation email: ${s.email}`),text('Check-in from 15:00 · Check-out until 11:00'),text(`Payment: ${PAYMENT_OPTIONS.find(item=>item.value===s.payment)?.label}`));
};
const update=(patch:Partial<Booking>)=>{s=amend(s,patch);render();};
dates.addEventListener('change',event=>{const range=rangeParts((event as CustomEvent<{value:string}>).detail.value);if(range) update({checkIn:range[0],checkOut:range[1]});});
for (const item of GUEST_FIELDS) shell.addEventListener('change',event=>{if(event.target===guestGrid.querySelector(`#${item.key}`)) update({[item.key]:(event as CustomEvent<{value:string}>).detail.value});});
roomGroup.addEventListener('click',event=>{const option=(event.target as HTMLElement).closest<HTMLElement>('[data-choice]');if(option&&option.getAttribute('aria-disabled')!=='true'){update(choicePatch(option.dataset.choice!));option.focus();}});
roomGroup.addEventListener('keydown',event=>{
 const option=(event.target as HTMLElement).closest<HTMLElement>('[data-choice]');if(!option)return;
 const available=choices(s);let value:string|undefined;
 if(['ArrowRight','ArrowDown'].includes(event.key))value=choiceAfter(s,option.dataset.choice!,1);
 else if(['ArrowLeft','ArrowUp'].includes(event.key))value=choiceAfter(s,option.dataset.choice!,-1);
 else if(event.key==='Home')value=available[0];else if(event.key==='End')value=available.at(-1);
 else if([' ','Enter'].includes(event.key)&&option.getAttribute('aria-disabled')!=='true')value=option.dataset.choice;
 if(value){event.preventDefault();update(choicePatch(value));rateNodes.get(value)?.option.focus();}
});
for (const extra of EXTRAS) extraNodes.get(extra.key)!.addEventListener('change',event=>update({[extra.key]:(event as CustomEvent<{checked:boolean}>).detail.checked}));
for (const key of [...DETAIL_FIELDS.map(item=>item.key),'guestName','requests'] as const) shell.addEventListener('input',event=>{if((event.target as HTMLElement).id===key)s=amend(s,{[key]:(event as CustomEvent<{value:string}>).detail.value});});
other.addEventListener('change',event=>update({forSomeoneElse:(event as CustomEvent<{checked:boolean}>).detail.checked}));
payment.addEventListener('change',event=>update({payment:(event as CustomEvent<{value:string}>).detail.value}));
stepper.addEventListener('beforechange',event=>{
  if(event.detail.direction!=='forward')return;
  const number=stepNumberOf(event.detail.previousValue??'dates');const messages=validateStep(s,number);
  if(Object.keys(messages).length){event.detail.preventDefault();stepper.setError(event.detail.previousValue!,true);setErrors(messages);}
  else {stepper.setError(event.detail.previousValue!,false);setErrors({});if(number===2)update({roomChosen:true});}
});
stepper.addEventListener('change',event=>{if(event.detail.value==='room'&&!unavailable(s,roomOf(s)))update({roomChosen:true});if(event.detail.value==='confirmation'){confirmed=true;render();for(const step of STEPS.slice(0,4))stepper.setStepState(step.value,{editable:false});stepper.completeStep('confirmation');}});
layout.append(stepper,summaryWrap);shell.append(intro,layout,text('Fictional hotel · Demonstration rates and taxes. No payment is collected.','mtrl-body-small'),snackbar);app.append(shell);watchStepper(stepper);render();
