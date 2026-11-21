import { describe, expect, test } from 'bun:test';
import { DEFAULTS, amend, cityTax, extraCost, extrasTotal, nightlyRate, roomAfter, roomOf, roomTotal, total, unavailable, validateStep, vatIncluded } from '../examples/booking/hotel';
describe('hotel booking rules', () => {
  test('a stay totals rooms, priced extras and city tax; VAT is included', () => {
    const stay={...DEFAULTS, adults:'4', rooms:'2', breakfast:true, parking:true, lateCheckout:true, transfer:true};
    expect(nightlyRate(stay)).toBe(142);
    expect(roomTotal(stay)).toBe(568);
    expect(extraCost(stay,'breakfast')).toBe(144);
    expect(extraCost(stay,'parking')).toBe(28);
    expect(extraCost(stay,'lateCheckout')).toBe(70);
    expect(extraCost(stay,'transfer')).toBe(45);
    expect(cityTax(stay)).toBe(24);
    expect(total(stay)).toBe(879);
    expect(vatIncluded(stay)).toBe(48.4);
  });
  test('breakfast included in a rate is never charged again', () => {
    const stay=amend({...DEFAULTS,breakfast:true},{rate:'breakfast'});
    expect(stay.breakfast).toBe(false);
    expect(extraCost({...stay,breakfast:true},'breakfast')).toBe(0);
    expect(extrasTotal(stay)).toBe(0);
    expect(total(stay)).toBe(344);
  });
  test('room capacity and stock constrain selection and keyboard choices', () => {
    const stay={...DEFAULTS,adults:'3'};
    expect(unavailable(stay,roomOf(stay))).toContain('Maximum 2 guests');
    expect(validateStep(stay,2).room).toBeDefined();
    expect(roomAfter(stay,'family',1)).toBe('suite');
    expect(roomAfter(stay,'suite',1)).toBe('family');
    expect(unavailable({...DEFAULTS,room:'suite',rooms:'3'},roomOf({...DEFAULTS,room:'suite'}))).toBe('Only 2 rooms available');
  });
  test('date and occupancy validation block Next without pricing a same-day stay', () => {
    expect(validateStep({...DEFAULTS,checkOut:DEFAULTS.checkIn},1).dates).toBeDefined();
    expect(total({...DEFAULTS,checkOut:DEFAULTS.checkIn})).toBe(0);
    expect(validateStep({...DEFAULTS,checkIn:'2027-02-30'},1).dates).toBeDefined();
    expect(validateStep({...DEFAULTS,adults:'1',rooms:'2'},1).adults).toContain('one adult');
  });
  test('guest details and alternate lead guest are validated before booking', () => {
    const stay={...DEFAULTS,firstName:'Mira',lastName:'Vale',email:'mira@example.com',phone:'+351 210 555 019'};
    expect(validateStep(stay,4)).toEqual({});
    expect(validateStep({...stay,forSomeoneElse:true},4).guestName).toBeDefined();
    expect(validateStep({...stay,email:'invalid',phone:'123',arrivalTime:'25:00'},4)).toEqual({email:'Enter a valid email address',phone:'Enter a valid phone number',arrivalTime:'Use 24-hour time, e.g. 15:00'});
  });
});

test('the room summary is committed only when the room step completes', () => {
  expect(DEFAULTS.roomChosen).toBe(false);
  const chosen=amend(DEFAULTS,{roomChosen:true});
  expect(chosen.roomChosen).toBe(true);
  expect(amend(chosen,{adults:'3'}).roomChosen).toBe(false);
  expect(amend(chosen,{room:'family'}).roomChosen).toBe(false);
});
