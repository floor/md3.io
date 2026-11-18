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
  priceMin: number;
  priceMax: number;
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
  priceMin: 80,
  priceMax: 240,
  name: "",
  email: "",
};

export const ROOMS = [
  { value: "standard", label: "Standard room", rate: 95 },
  { value: "double", label: "Double room", rate: 120 },
  { value: "family", label: "Family room", rate: 155 },
  { value: "suite", label: "Suite", rate: 210 },
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

/** Whole nights between the dates, at least one: check-out is never before check-in. */
export const nights = (s: Booking): number => {
  const diff = Math.round((parseDay(s.checkOut) - parseDay(s.checkIn)) / dayMs);
  return Number.isFinite(diff) ? Math.max(1, diff) : 1;
};

/** Check-out cannot be before check-in: an earlier date moves to check-in. */
export const withDates = (s: Booking, checkIn: string, checkOut: string): Booking => ({
  ...s,
  checkIn,
  checkOut: parseDay(checkOut) < parseDay(checkIn) ? checkIn : checkOut,
});

export const roomOf = (s: Booking) => ROOMS.find((room) => room.value === s.room) ?? ROOMS[1];

export const total = (s: Booking): number => {
  const count = nights(s);
  let sum = count * roomOf(s).rate;
  if (s.breakfast) sum += count * 18;
  if (s.parking) sum += count * 12;
  if (s.lateCheckout) sum += 25;
  return sum;
};

export const money = (value: number): string => `$${value}`;

export const totalText = (s: Booking): string =>
  `Estimated total ${money(total(s))} for ${nights(s)} ${nights(s) === 1 ? "night" : "nights"} · Nightly price ${money(s.priceMin)}–${money(s.priceMax)}`;

export const summary = (s: Booking): string => {
  const extras = EXTRAS.filter((extra) => s[extra.key]).map((extra) => extra.label);
  return (
    `${roomOf(s).label}, ${nights(s)} ${nights(s) === 1 ? "night" : "nights"} · Check-in ${s.checkIn}, check-out ${s.checkOut} · ` +
    `Arrival ${s.arrivalTime} · ${s.adults} ${s.adults === "1" ? "adult" : "adults"}, ${s.children} ${s.children === "1" ? "child" : "children"}` +
    `${extras.length ? ` · ${extras.join(", ")}` : ""} · ${totalText(s)}`
  );
};

export interface BookingErrors { name?: string; email?: string }

export const validate = (s: Booking): BookingErrors => {
  const errors: BookingErrors = {};
  if (!s.name.trim()) errors.name = "Enter your name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email.trim())) errors.email = "Enter a valid email address";
  return errors;
};
