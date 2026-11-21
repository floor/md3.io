// Hotel booking behavior, driven in every framework before ARIA parity is compared.
import assert from 'node:assert/strict';
import type { Frame, Locator, Page } from 'playwright';
import { DEFAULTS, addDays } from './shared';
const exact={exact:true} as const;
const focused=(target:Locator)=>target.evaluate(node=>(node.getRootNode() as Document|ShadowRoot).activeElement===node||document.activeElement===node);
async function equal<T>(read:()=>Promise<T>,expected:T,message:string){for(let n=0;n<50;n++){if(await read()===expected)return;await new Promise(resolve=>setTimeout(resolve,40));}assert.equal(await read(),expected,message);}
export async function checkFrame(frame:Frame):Promise<void>{
 await frame.getByRole('heading',{name:'Hotel Lumen',...exact}).waitFor();
 assert.equal(await frame.locator('#app img').count(),0);
 await frame.getByRole('button',{name:'Check availability',...exact}).click();
 await frame.getByRole('radiogroup',{name:'Room type',...exact}).waitFor();
}
export async function chooseSelect(page:Page,name:string,last:boolean):Promise<void>{
 const field=page.getByRole('combobox',{name,...exact});await field.focus();await page.keyboard.press('ArrowDown');await page.keyboard.press(last?'End':'Home');await page.keyboard.press('Enter');
}
export async function fillGuest(page:Page):Promise<void>{
 for(const [name,value] of [['First name','Mira'],['Last name','Vale'],['Email','mira.vale@example.com'],['Phone','+351 000 000 000'],['Estimated arrival time','18:30']] as const)await page.getByRole('textbox',{name,...exact}).fill(value);
}
export default async function steps(page:Page):Promise<void>{
 const button=(name:string)=>page.getByRole('button',{name,...exact});
 const heading=(number:number)=>page.getByRole('heading',{name:new RegExp(`^Step ${number} of 5`)});
 const stepIs=async(number:number,focus=true)=>{await heading(number).waitFor();if(focus)await equal(()=>focused(heading(number)),true,`step ${number} receives focus`);};
 const orientation=async(want:'horizontal'|'vertical')=>{
  await equal(()=>page.evaluate(()=>{const host=document.querySelector('m-stepper') as HTMLElement&{getResolvedOrientation():string};return host?.getResolvedOrientation?.()??(document.querySelector('.mtrl-stepper')?.classList.contains('mtrl-stepper--vertical')?'vertical':'horizontal');}),want,'Stepper resolves its actual orientation');
  await page.waitForFunction(()=>{const host=document.querySelector('m-stepper') as HTMLElement&{getResolvedOrientation():string};const root=host?.shadowRoot?.querySelector('.mtrl-stepper')??document.querySelector('.mtrl-stepper');if(!root)return false;const vertical=root.classList.contains('mtrl-stepper--vertical');return vertical?!root.classList.contains('mtrl-stepper--label-bottom'):root.classList.contains('mtrl-stepper--label-bottom');});
 };
 await page.getByRole('heading',{name:'Hotel Lumen',...exact}).waitFor();assert.equal(await page.locator('#app img').count(),0,'No generated hotel or room illustrations');
 await page.setViewportSize({width:1440,height:1000});await orientation('horizontal');await stepIs(1,false);
 assert.equal(await page.locator('#price-summary').getByText('Room: choose in the next step',exact).isVisible(),true);
 assert.equal(await page.locator('#price-summary').getByText(/^Total /).count(),0,'No unchosen room total on Dates');
 await page.setViewportSize({width:390,height:844});await orientation('vertical');
 const stayToggle=button('Your stay · View details');await stayToggle.click();assert.equal(await stayToggle.getAttribute('aria-expanded'),'true');assert.equal(await page.locator('#price-summary').isVisible(),true);await stayToggle.click();
 assert.equal(await page.locator('#price-summary').isVisible(),false);
 await page.setViewportSize({width:1440,height:1000});await orientation('horizontal');
 const range=page.getByRole('textbox',{name:'Check-in → Check-out',...exact});
 const start=addDays(DEFAULTS.checkIn,2),end=addDays(DEFAULTS.checkIn,5);
 const dateName=(iso:string)=>{const d=new Date(`${iso}T00:00:00Z`);return new RegExp(`${new Intl.DateTimeFormat('en-GB',{weekday:'long',timeZone:'UTC'}).format(d)}.*${d.getUTCDate()}.*${new Intl.DateTimeFormat('en-GB',{month:'long',timeZone:'UTC'}).format(d)}.*${d.getUTCFullYear()}`);};
 const pickRange=async(first:string,last:string)=>{await page.getByRole('button',{name:/Change date/}).click();await page.getByRole('gridcell',{name:dateName(first)}).click();await page.getByRole('gridcell',{name:dateName(last)}).click();await button('OK').click();};
 await pickRange(start,start);await button('Check availability').click();await stepIs(1,false);await equal(()=>focused(range),true,'Invalid range focuses the stay field');
 await page.getByText('Choose future dates for at least 1 night',exact).waitFor();
 const errorMarked=()=>page.evaluate(()=>{const root=document.querySelector('m-stepper')?.shadowRoot??document;return !!root.querySelector('.mtrl-stepper__item--error');});
 await page.setViewportSize({width:390,height:844});await orientation('vertical');await equal(errorMarked,true,'Date error survives vertical orientation');
 await page.setViewportSize({width:1440,height:1000});await orientation('horizontal');await equal(errorMarked,true,'Date error survives horizontal orientation');
 await pickRange(start,end);assert.match(await range.inputValue(),/\d+ [A-Z][a-z]+ \d{4}/,'Dates are localized for display');
 await chooseSelect(page,'Rooms',true);await button('Check availability').click();await page.getByText('Each room needs at least one adult',exact).waitFor();await stepIs(1,false);await chooseSelect(page,'Rooms',false);
 const adults=page.getByRole('combobox',{name:'Adults',...exact});await adults.focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 const children=page.getByRole('combobox',{name:'Children',...exact});await children.focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 await button('Check availability').click();await stepIs(2);
 const group=page.getByRole('radiogroup',{name:'Room type',...exact});
 const rate=(room:string,plan:string)=>page.getByRole('radio',{name:`${room} — ${plan}`,...exact});
 assert.equal(await rate('Superior Double','Flexible').getAttribute('aria-disabled'),'true');await page.getByText('Maximum 2 guests for 1 room',exact).first().waitFor();
 await button('Next').click();await page.getByText('Choose an available room that fits your guests',exact).waitFor();
 const first=rate('Family Room','Non-refundable');await equal(()=>focused(first),true,'Invalid room selection focuses an available option');
 await page.keyboard.press('ArrowRight');await equal(()=>rate('Family Room','Flexible').getAttribute('aria-checked'),'true','Arrow keys select a room and rate');
 await page.keyboard.press('Home');await equal(()=>first.getAttribute('aria-checked'),'true','Home selects first available rate');await page.keyboard.press('End');
 const breakfastRate=rate('Family Room','Flexible + breakfast');await equal(()=>breakfastRate.getAttribute('aria-checked'),'true','End skips disabled rooms');await page.keyboard.press(' ');
 assert.equal(await group.getByRole('radio').evaluateAll(options=>options.filter(option=>(option as HTMLElement).tabIndex===0&&option.getAttribute('aria-disabled')!=='true').length),1,'One Tab stop for room + rate group');
 await page.keyboard.press('Tab');assert.equal(await focused(button('Back')),true,'Tab leaves the whole room/rate group once');
 await page.locator('#price-summary').getByText('Total €705',exact).waitFor();
 await button('Next').click();await stepIs(3);
 const breakfast=page.getByRole('checkbox',{name:/^Breakfast/});assert.equal(await breakfast.isChecked(),true);assert.equal(await breakfast.isDisabled(),true,'Included breakfast cannot be added twice');
 for(const label of [/^Parking/,/^Late check-out/,/^Airport transfer/])await page.getByRole('checkbox',{name:label}).check();
 await page.locator('#price-summary').getByText('Total €827',exact).waitFor();
 await button('Back').click();await stepIs(2);await button('Back').click();await stepIs(1);
 await chooseSelect(page,'Adults',true);assert.equal(await page.getByRole('button',{name:/Extras/}).isDisabled(),true,'Changing guests invalidates later completed steps');
 await adults.focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 await button('Check availability').click();await stepIs(2);await button('Next').click();await stepIs(3);await page.locator('#price-summary').getByText('Total €827',exact).waitFor();
 await button('Back').click();await stepIs(2);await rate('Family Room','Flexible').click();await button('Next').click();await stepIs(3);
 assert.equal(await breakfast.isChecked(),false,'Changing to room-only leaves breakfast opt-in');assert.equal(await breakfast.isDisabled(),false);
 await breakfast.check();await page.locator('#price-summary').getByText('Total €971',exact).waitFor();await breakfast.uncheck();await page.locator('#price-summary').getByText('Total €755',exact).waitFor();
 await button('Back').click();await rate('Family Room','Flexible + breakfast').click();await button('Next').click();await stepIs(3);await page.locator('#price-summary').getByText('Total €827',exact).waitFor();
 await page.setViewportSize({width:390,height:844});await orientation('vertical');const totalToggle=button('Total €827 · View details');await totalToggle.click();await page.locator('#price-summary').getByText('incl. VAT €45.28',exact).waitFor();await totalToggle.click();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'No phone overflow');await page.setViewportSize({width:1440,height:1000});await orientation('horizontal');await stepIs(3,false);
 await button('Next').click();await stepIs(4);await button('Back').click();await stepIs(3);await button('Next').click();await stepIs(4);assert.equal(await page.getByText('Enter your first name',exact).count(),0,'Back never validates empty details');
 await button('Book').click();await equal(()=>focused(page.getByRole('textbox',{name:'First name',...exact})),true,'Book focuses first invalid detail');
 await fillGuest(page);await page.getByRole('textbox',{name:'Email',...exact}).fill('invalid');await button('Book').click();await equal(()=>focused(page.getByRole('textbox',{name:'Email',...exact})),true,'Invalid email is focused');await page.getByRole('textbox',{name:'Email',...exact}).fill('mira.vale@example.com');
 await page.getByRole('checkbox',{name:"I'm booking for someone else",...exact}).check();await button('Book').click();await page.getByText('Enter the lead guest name',exact).waitFor();await page.getByRole('textbox',{name:'Lead guest name',...exact}).fill('Rowan Moss');await page.getByRole('textbox',{name:'Special requests',...exact}).fill('Quiet room, please.');
 await chooseSelect(page,'Payment',true);await page.getByText('Pay now would charge the full total when booking. This demo does not process payments or send information.',exact).waitFor();assert.equal(await page.getByRole('textbox',{name:/card number/i}).count(),0,'Payment demo has no card fields');
 await button('Book').click();await stepIs(5);await page.getByText('Booking reference LMN-4821',exact).waitFor();await page.getByText('Lead guest: Rowan Moss',exact).waitFor();await page.getByText('Check-in from 15:00 · Check-out until 11:00',exact).waitFor();await page.getByText('Payment: Pay now',exact).waitFor();
 const settled=()=>page.waitForFunction(()=>[...document.querySelectorAll('m-snackbar,.mtrl-snackbar')].every(host=>{const root=host.shadowRoot??host;const surface=root.querySelector('[popover]')??host;return Number.parseFloat(getComputedStyle(surface).opacity)<0.1;}));
 for(const [action,message] of [['Add to calendar','Calendar download is a demo action.'],['Manage booking','Manage booking is a demo action.']] as const){await button(action).click();await page.getByRole('status').filter({hasText:message}).waitFor();await settled();}
}
