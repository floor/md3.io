// Fictional hotel inventory and demonstration prices, shared by every adapter.
export interface Booking {
  checkIn: string; checkOut: string; adults: string; children: string; rooms: string;
  room: string; rate: string; roomChosen: boolean; breakfast: boolean; parking: boolean; lateCheckout: boolean; transfer: boolean;
  firstName: string; lastName: string; email: string; phone: string; arrivalTime: string; requests: string;
  forSomeoneElse: boolean; guestName: string; payment: string;
}
const dayMs = 86_400_000;
export const TODAY = new Date().toISOString().slice(0, 10);
export const addDays = (iso: string, amount: number): string => {
  const stamp = Date.parse(`${iso}T00:00:00Z`);
  return Number.isFinite(stamp) ? new Date(stamp + amount * dayMs).toISOString().slice(0, 10) : '';
};
const isDay = (iso: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(iso) && addDays(iso, 0) === iso;
export const DEFAULTS: Booking = {
  checkIn: addDays(TODAY, 14), checkOut: addDays(TODAY, 16), adults: '2', children: '0', rooms: '1',
  room: 'superior', rate: 'flexible', roomChosen: false, breakfast: false, parking: false, lateCheckout: false, transfer: false,
  firstName: '', lastName: '', email: '', phone: '', arrivalTime: '15:00', requests: '', forSomeoneElse: false, guestName: '', payment: 'hotel',
};
export const HOTEL = { name: 'Hotel Lumen', city: 'Lisbon', address: '18 Rua da Aurora, Lisbon', stars: '★★★★ · 4-star city hotel', rating: '★ 4.6 · 1,284 reviews', reference: 'LMN-4821' } as const;
export const ROOMS = [
  { value: 'superior', label: 'Superior Double', beds: '1 queen bed', size: 24, capacity: 2, stock: 6, rate: 124 },
  { value: 'deluxe', label: 'Deluxe King with city view', beds: '1 king bed', size: 30, capacity: 2, stock: 4, rate: 154 },
  { value: 'family', label: 'Family Room', beds: '1 king bed + 2 single beds', size: 38, capacity: 4, stock: 3, rate: 184 },
  { value: 'suite', label: 'Junior Suite', beds: '1 king bed + sofa bed', size: 44, capacity: 3, stock: 2, rate: 224 },
] as const;
export type Room = typeof ROOMS[number];
export const RATES = [
  { value: 'saver', label: 'Non-refundable', supplement: 0, breakfast: false, refundable: false },
  { value: 'flexible', label: 'Flexible', supplement: 18, breakfast: false, refundable: true },
  { value: 'breakfast', label: 'Flexible + breakfast', supplement: 42, breakfast: true, refundable: true },
] as const;
export const AMENITIES = [
  { label: 'Wi-Fi', path: 'M1 9l2 2a13 13 0 0 1 18 0l2-2A16 16 0 0 0 1 9zm4 4l2 2a7 7 0 0 1 10 0l2-2a10 10 0 0 0-14 0zm4 4l3 3 3-3a4 4 0 0 0-6 0z' },
  { label: 'Air conditioning', path: 'M11 2h2v5l4-3 1 2-5 3v2h2l3-5 2 1-3 4h5v2h-5l3 4-2 1-3-5h-2v2l5 3-1 2-4-3v5h-2v-5l-4 3-1-2 5-3v-2H9l-3 5-2-1 3-4H2v-2h5L4 7l2-1 3 5h2V9L6 6l1-2 4 3z' },
  { label: 'Rain shower', path: 'M8 2a5 5 0 0 0-5 5v4h2V7a3 3 0 0 1 6 0v1H8v3h8V8h-3V7a5 5 0 0 0-5-5zm0 11v3h2v-3zm4 0v3h2v-3zm4 0v3h2v-3zM8 18v3h2v-3zm4 0v3h2v-3zm4 0v3h2v-3z' },
  { label: 'Coffee machine', path: 'M4 3h14v3h2a3 3 0 0 1 0 6h-2v1a7 7 0 0 1-14 0V3zm14 5v2h2a1 1 0 0 0 0-2h-2zM2 20h20v2H2z' },
] as const;
const VIEW = {label:'City view',path:'M3 3h18v18H3V3zm2 2v6h6V5H5zm8 0v6h6V5h-6zm-8 8v6h6v-6H5zm8 0v6h6v-6h-6z'};
const TUB = {label:'Bathtub',path:'M4 3h2v9h16v3a6 6 0 0 1-3 5v2h-2v-1H7v1H5v-2a6 6 0 0 1-3-5v-3h2V3zm2 11H4v1a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-1H6z'};
const SOFA = {label:'Sofa bed',path:'M4 5h16v7h2v8h-2v-2H4v2H2v-8h2V5zm2 2v5h12V7H6zm-2 7v2h16v-2H4z'};
export const amenitiesOf = (room: Room) => ({
  superior:[AMENITIES[0],AMENITIES[1],AMENITIES[2],{...VIEW,label:'Courtyard view'}],
  deluxe:[VIEW,AMENITIES[3],{label:'Minibar',path:'M5 2h14v20H5V2zm2 2v6h10V4H7zm0 8v8h10v-8H7zm1 1h2v3H8z'},AMENITIES[2]],
  family:[{label:'Connecting rooms',path:'M2 3h8v18H2V3zm12 0h8v18h-8V3zM4 5v14h4V5H4zm12 0v14h4V5h-4zM9 11h6v2H9z'},SOFA,TUB,AMENITIES[1]],
  suite:[{...VIEW,label:'Private balcony'},VIEW,SOFA,AMENITIES[3]],
}[room.value]);
export const GUEST_FIELDS = [
  { key: 'adults', label: 'Adults', options: ['1','2','3','4','5','6'] },
  { key: 'children', label: 'Children', options: ['0','1','2','3','4'] },
  { key: 'rooms', label: 'Rooms', options: ['1','2','3'] },
] as const;
export const EXTRAS = [
  { key: 'breakfast', label: 'Breakfast', price: 18, unit: 'per guest, per night' },
  { key: 'parking', label: 'Parking', price: 14, unit: 'per night' },
  { key: 'lateCheckout', label: 'Late check-out until 14:00', price: 35, unit: 'per room, once' },
  { key: 'transfer', label: 'Airport transfer', price: 45, unit: 'per booking, one-way' },
] as const;
export type ExtraKey = typeof EXTRAS[number]['key'];
export const DETAIL_FIELDS = [
  { key: 'firstName', label: 'First name', type: 'text', helper: 'Required' },
  { key: 'lastName', label: 'Last name', type: 'text', helper: 'Required' },
  { key: 'email', label: 'Email', type: 'email', helper: 'Required · Your confirmation address' },
  { key: 'phone', label: 'Phone', type: 'tel', helper: 'Required · Include country code' },
  { key: 'arrivalTime', label: 'Estimated arrival time', type: 'text', helper: 'Optional · 24-hour time, e.g. 15:00' },
] as const;
export const STEPS = [
  { value: 'dates', title: 'Dates and guests' }, { value: 'room', title: 'Room' }, { value: 'extras', title: 'Extras' },
  { value: 'details', title: 'Guest details' }, { value: 'confirmation', title: 'Confirmation' },
] as const;
export const stepHeading = (step: number): string => `Step ${step} of 5 · ${STEPS[step - 1]!.title}`;
export const stepNumberOf = (value: string): number => STEPS.findIndex(step => step.value === value) + 1;
export const nights = (s: Booking): number => Math.max(0, Math.round((Date.parse(s.checkOut) - Date.parse(s.checkIn)) / dayMs) || 0);
export const nightText = (s: Booking): string => `${nights(s)} ${nights(s) === 1 ? 'night' : 'nights'}`;
export const guests = (s: Booking): number => Number(s.adults) + Number(s.children);
export const guestText = (s: Booking): string => `${s.adults} ${s.adults === '1' ? 'adult' : 'adults'} · ${s.children} ${s.children === '1' ? 'child' : 'children'} · ${s.rooms} ${s.rooms === '1' ? 'room' : 'rooms'}`;
export const roomOf = (s: Booking): Room => ROOMS.find(room => room.value === s.room) ?? ROOMS[0];
export const rateOf = (s: Booking) => RATES.find(rate => rate.value === s.rate) ?? RATES[1];
export const money = (value: number): string => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
export const formatDay = (iso: string): string => /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`)) : 'Choose dates';
export const stayText = (s: Booking): string => `${formatDay(s.checkIn)} → ${formatDay(s.checkOut)} · ${nightText(s)}`;
export const unavailable = (s: Booking, room: Room): string => Number(s.rooms) > room.stock ? `Only ${room.stock} rooms available` : guests(s) > room.capacity * Number(s.rooms) ? `Maximum ${room.capacity * Number(s.rooms)} guests for ${s.rooms} ${s.rooms === '1' ? 'room' : 'rooms'}` : '';
export const roomAfter = (s: Booking, value: string, offset: number): string => {
  const available = ROOMS.filter(room => !unavailable(s, room));
  if (!available.length) return value;
  const index = available.findIndex(room => room.value === value);
  return available[(index + offset + available.length) % available.length]!.value;
};
export const nightlyRate = (s: Booking, room: Room = roomOf(s)): number => room.rate + rateOf(s).supplement;
export const roomTotal = (s: Booking, room: Room = roomOf(s)): number => nightlyRate(s, room) * nights(s) * Number(s.rooms);
export const cancellation = (s: Booking): string => rateOf(s).refundable ? `Free cancellation until ${formatDay(addDays(s.checkIn, -2))}, 18:00 (hotel local time).` : 'Non-refundable. The full stay is charged if you cancel.';
export const rateText = (s: Booking): string => `${rateOf(s).label} · ${rateOf(s).breakfast ? 'Breakfast included' : 'Room only'}`;
export const extraIncluded = (s: Booking, key: ExtraKey): boolean => key === 'breakfast' && rateOf(s).breakfast;
export const extraCost = (s: Booking, key: ExtraKey): number => {
  if (!s[key] || extraIncluded(s, key)) return 0;
  if (key === 'breakfast') return 18 * guests(s) * nights(s);
  if (key === 'parking') return 14 * nights(s);
  if (key === 'lateCheckout') return 35 * Number(s.rooms);
  return 45;
};
export const extraLabel = (s: Booking, extra: typeof EXTRAS[number]): string => `${extra.label} — ${extraIncluded(s, extra.key) ? 'Included in your rate' : `${money(extra.price)} ${extra.unit}`}`;
export const extrasTotal = (s: Booking): number => EXTRAS.reduce((sum, extra) => sum + extraCost(s, extra.key), 0);
export const cityTax = (s: Booking): number => 3 * Number(s.adults) * nights(s);
export const vatIncluded = (s: Booking): number => Math.round((roomTotal(s) + extrasTotal(s)) * 6 / 106 * 100) / 100;
export const total = (s: Booking): number => nights(s) ? roomTotal(s) + extrasTotal(s) + cityTax(s) : 0;
export const priceLines = (s: Booking): { label: string; amount: string }[] => [
  { label: `${money(nightlyRate(s))} × ${nightText(s)} × ${s.rooms} ${s.rooms === '1' ? 'room' : 'rooms'}`, amount: money(roomTotal(s)) },
  ...EXTRAS.filter(extra => extraCost(s, extra.key) > 0).map(extra => ({ label: extra.label, amount: money(extraCost(s, extra.key)) })),
  { label: 'City tax · €3 per adult, per night', amount: money(cityTax(s)) },
];
export const PAYMENT_OPTIONS = [{ value: 'hotel', label: 'Pay at the hotel' }, { value: 'now', label: 'Pay now' }] as const;
export const paymentNote = (s: Booking): string => s.payment === 'now' ? 'Pay now would charge the full total when booking. This demo does not process payments or send information.' : 'Pay at the hotel during your stay. Your selected cancellation policy still applies. This demo does not process payments or send information.';
export type BookingErrors = Partial<Record<keyof Booking | 'dates', string>>;
export const validateStep = (s: Booking, step: number): BookingErrors => {
  const errors: BookingErrors = {};
  if (step === 1) {
    if (!isDay(s.checkIn) || !isDay(s.checkOut) || s.checkIn < TODAY || nights(s) < 1) errors.dates = 'Choose future dates for at least 1 night';
    for (const field of GUEST_FIELDS) if (!(field.options as readonly string[]).includes(s[field.key])) errors[field.key] = `Choose ${field.label.toLowerCase()}`;
    if (Number(s.adults) < Number(s.rooms)) errors.adults = 'Each room needs at least one adult';
  }
  if (step === 2 && (!ROOMS.some(room => room.value === s.room) || unavailable(s, roomOf(s)))) errors.room = 'Choose an available room that fits your guests';
  if (step === 2 && !RATES.some(rate => rate.value === s.rate)) errors.rate = 'Choose a rate plan';
  if (step === 4) {
    if (!s.firstName.trim()) errors.firstName = 'Enter your first name';
    if (!s.lastName.trim()) errors.lastName = 'Enter your last name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email.trim())) errors.email = 'Enter a valid email address';
    if (!/^[+\d][\d ()+.-]{6,}$/.test(s.phone.trim())) errors.phone = 'Enter a valid phone number';
    if (s.arrivalTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(s.arrivalTime.trim())) errors.arrivalTime = 'Use 24-hour time, e.g. 15:00';
    if (s.forSomeoneElse && !s.guestName.trim()) errors.guestName = 'Enter the lead guest name';
  }
  return errors;
};
export const amend = (s: Booking, patch: Partial<Booking>): Booking => {
  const next = { ...s, ...patch };
  if (patch.roomChosen === undefined && ['checkIn','checkOut','adults','children','rooms','room','rate'].some(key => key in patch)) next.roomChosen = false;
  if (rateOf(next).breakfast) next.breakfast = false;
  return next;
};
export const rangeParts = (value: string): [string, string] | null => {
  const [start,end] = value.split('/'); return start && end ? [start,end] : null;
};

export const choices = (s: Booking): string[] => ROOMS.filter(room => !unavailable(s,room)).flatMap(room=>RATES.map(rate=>`${room.value}:${rate.value}`));
export const choiceOf = (s: Booking): string => `${s.room}:${s.rate}`;
export const choicePatch = (choice: string): Partial<Booking> => { const [room,rate]=choice.split(':');return {room,rate,roomChosen:true}; };
export const choiceAfter = (s: Booking, choice: string, offset: number): string => {
  const options=choices(s); if (!options.length) return choice;
  return options[(options.indexOf(choice)+offset+options.length)%options.length]!;
};
export const rateConditions = (s: Booking, rate: typeof RATES[number]): string => [rate.breakfast?'':'Room only',rate.refundable?`Free cancellation until ${formatDay(addDays(s.checkIn,-2))}`:''].filter(Boolean).join(' · ');
