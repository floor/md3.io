// The state every variant of this example shares, and how it is described.
export interface Booking {
  checkIn: string;
  checkOut: string;
  arrivalTime: string;
  adults: string;
  children: string;
  room: string;
  breakfast: boolean;
  parking: boolean;
  lateCheckout: boolean;
  name: string;
  email: string;
}

export const DEFAULTS: Booking = {
  checkIn: "2027-04-10",
  checkOut: "2027-04-12",
  arrivalTime: "15:00",
  adults: "2",
  children: "0",
  room: "double",
  breakfast: false,
  parking: false,
  lateCheckout: false,
  name: "",
  email: "",
};

/** A fictional place, invented for this showcase; the art is generated SVG below. */
export const PROPERTY = {
  name: "The Dune House",
  town: "Alder Cove",
  rating: "4.8 · 126 reviews",
  facts: "Sleeps 6 · 2 minutes to the beach · Free cancellation for 48 hours",
  lede: "A shingled house above the dunes, run by Mara and Jon. Breakfast is local, the bikes are free, and check-in is from 15:00.",
  policy: "Free cancellation until 48 hours before check-in. No parties; quiet after 22:00.",
} as const;

const svgImage = (sky: string, hill: string, accent: string): string =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="${sky}"/><g transform="translate(0,30)"><circle cx="520" cy="72" r="38" fill="${accent}"/><path d="M0 250 Q160 190 320 240 T640 230 V360 H0 Z" fill="${hill}"/><path d="M0 300 Q200 260 400 295 T640 290 V360 H0 Z" fill="${accent}" opacity=".45"/><rect x="250" y="150" width="140" height="92" rx="6" fill="#fff8ee"/><path d="M238 152 L320 104 L402 152 Z" fill="#5b4a3f"/><rect x="302" y="196" width="36" height="46" fill="#5b4a3f"/></g></svg>`,
  )}`;

/** The hero scene is drawn for the banner's own 7:3 frame, so cover never crops it. */
export const HERO_IMAGE = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 360"><rect width="840" height="360" fill="#bcd9ea"/><circle cx="712" cy="64" r="36" fill="#e9b44c"/><path d="M0 258 Q210 200 420 246 T840 238 V360 H0 Z" fill="#7fae7a"/><path d="M0 306 Q260 268 520 298 T840 296 V360 H0 Z" fill="#e9b44c" opacity=".45"/><rect x="350" y="158" width="140" height="92" rx="6" fill="#fff8ee"/><path d="M338 160 L420 112 L502 160 Z" fill="#5b4a3f"/><rect x="402" y="204" width="36" height="46" fill="#5b4a3f"/></svg>`,
)}`;

export const ROOMS = [
  { value: "standard", label: "Standard room", rate: 95, beds: "1 queen bed", size: "19 m²", features: "Garden view · Rain shower", image: svgImage("#cfe4ef", "#8db489", "#e9b44c") },
  { value: "double", label: "Double room", rate: 120, beds: "1 king bed", size: "24 m²", features: "Sea view · Balcony", image: svgImage("#bcd9ea", "#6f9f8a", "#ef8354") },
  { value: "family", label: "Family room", rate: 155, beds: "King + 2 single beds", size: "32 m²", features: "Sea view · Kitchenette", image: svgImage("#d7e6f5", "#7fae7a", "#7d8597") },
  { value: "suite", label: "Suite", rate: 210, beds: "1 king bed", size: "41 m²", features: "Private terrace · Soaking tub", image: svgImage("#f0dcc0", "#a3b18a", "#bc6c25") },
] as const;

export const EXTRAS = [
  { key: "breakfast", label: "Breakfast", price: 18, unit: "a night" },
  { key: "parking", label: "Parking", price: 12, unit: "a night" },
  { key: "lateCheckout", label: "Late checkout", price: 25, unit: "once" },
] as const;

export type ExtraKey = (typeof EXTRAS)[number]["key"];

export const ADULT_OPTIONS = ["1", "2", "3", "4"];
export const CHILD_OPTIONS = ["0", "1", "2", "3"];

export const CLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true"><path d="M520-496v-144q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640v159q0 8 3 15.5t9 13.5l132 132q11 11 28 11t28-11q11-11 11-28t-11-28L520-496ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0 320q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Z"/></svg>`;

const dayMs = 86_400_000;
const parseDay = (iso: string): number => Date.parse(`${iso}T00:00:00Z`);

/** Today, as an ISO day: the range picker offers no past dates. */
export const TODAY = new Date().toISOString().slice(0, 10);

/** Whole nights between the dates; a same-day range is 0, and step 1 blocks it. */
export const nights = (s: Booking): number => {
  const diff = Math.round((parseDay(s.checkOut) - parseDay(s.checkIn)) / dayMs);
  return Number.isFinite(diff) ? Math.max(0, diff) : 0;
};

/** Commit a picked range as-is: a range under one night is for validation to block. */
export const withRange = (s: Booking, checkIn: string, checkOut: string): Booking => ({ ...s, checkIn, checkOut });

/** Split a range picker's committed value ("YYYY-MM-DD/YYYY-MM-DD") into its days. */
export const rangeParts = (value: string): [string, string] | null => {
  const [start, end] = value.split("/");
  return start && end ? [start, end] : null;
};

export const roomOf = (s: Booking) => ROOMS.find((room) => room.value === s.room) ?? ROOMS[1];

/** Move the room choice, wrapping at either end (the card group's arrow keys). */
export const roomAtOffset = (s: Booking, offset: number): string => roomAfter(s.room, offset);

/** The room after `value` by `offset` places, wrapping at either end. */
export const roomAfter = (value: string, offset: number): string => {
  const index = ROOMS.findIndex((room) => room.value === value);
  return ROOMS[(index + offset + ROOMS.length) % ROOMS.length]!.value;
};

export const extrasTotal = (s: Booking): number => {
  const count = nights(s);
  let sum = 0;
  if (s.breakfast) sum += count * 18;
  if (s.parking) sum += count * 12;
  if (s.lateCheckout) sum += 25;
  return sum;
};

export const roomTotal = (s: Booking): number => roomOf(s).rate * nights(s);
export const subtotal = (s: Booking): number => roomTotal(s) + extrasTotal(s);
/** 10% taxes on the stay, plus a flat $20 cleaning fee per stay. */
export const taxes = (s: Booking): number => Math.round(subtotal(s) * 0.1);
export const CLEANING_FEE = 20;
export const total = (s: Booking): number => (nights(s) >= 1 ? subtotal(s) + taxes(s) + CLEANING_FEE : 0);

export const money = (value: number): string => `$${value}`;

export const totalText = (s: Booking): string =>
  nights(s) >= 1
    ? `Estimated total ${money(total(s))} for ${nights(s)} ${nights(s) === 1 ? "night" : "nights"}`
    : "Choose at least 1 night";

/** The price summary panel's lines: rate × nights, extras, taxes and fees, then the total. */
export const priceLines = (s: Booking): { label: string; amount: string }[] => {
  const room = roomOf(s);
  const count = nights(s);
  return [
    { label: `${room.label} · ${money(room.rate)} × ${count} ${count === 1 ? "night" : "nights"}`, amount: money(roomTotal(s)) },
    { label: "Extras", amount: money(extrasTotal(s)) },
    { label: "Taxes (10%)", amount: money(taxes(s)) },
    { label: "Cleaning fee", amount: money(CLEANING_FEE) },
  ];
};

export const stayText = (s: Booking): string =>
  `Check-in ${s.checkIn} → Check-out ${s.checkOut} · ${nights(s)} ${nights(s) === 1 ? "night" : "nights"}`;

export const summary = (s: Booking): string => {
  const room = roomOf(s);
  const extras = EXTRAS.filter((extra) => s[extra.key]).map((extra) => extra.label);
  return (
    `${room.label}, ${nights(s)} ${nights(s) === 1 ? "night" : "nights"} · Check-in ${s.checkIn}, check-out ${s.checkOut} · ` +
    `Arrival ${s.arrivalTime} · ${s.adults} ${s.adults === "1" ? "adult" : "adults"}, ${s.children} ${s.children === "1" ? "child" : "children"}` +
    `${extras.length ? ` · ${extras.join(", ")}` : ""} · ${totalText(s)}`
  );
};

/** A typed time, normalized to HH:MM, or null when it is not a 24-hour time. */
export const normalizeTime = (text: string): string | null => {
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(text.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  return hour <= 23 ? `${String(hour).padStart(2, "0")}:${match[2]}` : null;
};

export interface BookingErrors { name?: string; email?: string; arrivalTime?: string; dates?: string }

/** The four steps, in order. The value is the stepper's step id. */
export const STEPS = [
  { value: "dates", title: "Dates and arrival" },
  { value: "guests", title: "Guests and room" },
  { value: "extras", title: "Extras" },
  { value: "details", title: "Your details and review" },
] as const;

export const stepHeading = (step: number): string => `Step ${step} of 4 · ${STEPS[step - 1]!.title}`;
export const stepValue = (step: number): string => STEPS[step - 1]!.value;
export const stepNumberOf = (value: string): number => STEPS.findIndex((entry) => entry.value === value) + 1;

/** Next validates the step it leaves; Book validates the details. */
export const validateStep = (s: Booking, step: number): BookingErrors => {
  if (step === 1) {
    const errors: BookingErrors = {};
    if (nights(s) < 1) errors.dates = "Choose at least 1 night";
    if (!normalizeTime(s.arrivalTime)) errors.arrivalTime = "Enter a valid time";
    return errors;
  }
  if (step === 4) {
    const errors: BookingErrors = {};
    if (!s.name.trim()) errors.name = "Enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email.trim())) errors.email = "Enter a valid email address";
    return errors;
  }
  return {};
};

/** The fourth step reviews the first three: a labelled line each, whose Edit jumps back to its step. */
export const reviewLines = (s: Booking): { step: number; label: string; text: string }[] => [
  { step: 1, label: "Dates", text: `Check-in ${s.checkIn}, check-out ${s.checkOut} · Arrival ${s.arrivalTime}` },
  {
    step: 2,
    label: "Guests and room",
    text: `${s.adults} ${s.adults === "1" ? "adult" : "adults"}, ${s.children} ${s.children === "1" ? "child" : "children"} · ${roomOf(s).label} · ${money(roomOf(s).rate)} a night`,
  },
  { step: 3, label: "Extras", text: EXTRAS.filter((extra) => s[extra.key]).map((extra) => extra.label).join(", ") || "None" },
];
