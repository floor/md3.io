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

/** Rooms whose nightly rate sits inside the chosen price range. */
export const eligibleRooms = (s: Booking) => ROOMS.filter((room) => room.rate >= s.priceMin && room.rate <= s.priceMax);

export const roomOf = (s: Booking) => eligibleRooms(s).find((room) => room.value === s.room) ?? null;

/** A new price range keeps the choice inside it: an excluded room moves to the first eligible one, or to none. */
export const withPrice = (s: Booking, priceMin: number, priceMax: number): Booking => {
  const next = { ...s, priceMin, priceMax };
  if (!roomOf(next)) next.room = eligibleRooms(next)[0]?.value ?? "";
  return next;
};

export const total = (s: Booking): number => {
  const room = roomOf(s);
  if (!room) return 0;
  const count = nights(s);
  let sum = count * room.rate;
  if (s.breakfast) sum += count * 18;
  if (s.parking) sum += count * 12;
  if (s.lateCheckout) sum += 25;
  return sum;
};

export const money = (value: number): string => `$${value}`;

export const rangeText = (s: Booking): string => `${money(s.priceMin)}–${money(s.priceMax)} a night`;

export const totalText = (s: Booking): string =>
  roomOf(s)
    ? `Estimated total ${money(total(s))} for ${nights(s)} ${nights(s) === 1 ? "night" : "nights"}`
    : "No rooms in this price range";

export const summary = (s: Booking): string => {
  const room = roomOf(s);
  if (!room) return "No rooms in this price range";
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

export interface BookingErrors { name?: string; email?: string; arrivalTime?: string; room?: string }

/** The four steps, in order; the owner asked for three or four — this is four. */
export const STEPS = [
  { title: "Dates and arrival" },
  { title: "Guests and room" },
  { title: "Extras" },
  { title: "Your details and review" },
] as const;

export const stepHeading = (step: number): string => `Step ${step} of 4 · ${STEPS[step - 1]!.title}`;
export const stepLabel = (step: number): string => `Step ${step} of 4`;
export const stepProgress = (step: number): number => step;

/** Next validates the step it leaves; Book validates the details and requires a room. */
export const validateStep = (s: Booking, step: number): BookingErrors => {
  if (step === 1) return normalizeTime(s.arrivalTime) ? {} : { arrivalTime: "Enter a valid time" };
  if (step === 2) return roomOf(s) ? {} : { room: "No rooms in this price range" };
  if (step === 4) {
    const errors: BookingErrors = {};
    if (!s.name.trim()) errors.name = "Enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email.trim())) errors.email = "Enter a valid email address";
    return errors;
  }
  return {};
};

/** The fourth step reviews the first three; each line's Edit jumps back to its step. */
export const reviewLines = (s: Booking): { step: number; title: string; text: string }[] => [
  { step: 1, title: STEPS[0]!.title, text: `Check-in ${s.checkIn}, check-out ${s.checkOut} · Arrival ${s.arrivalTime}` },
  {
    step: 2,
    title: STEPS[1]!.title,
    text: `${s.adults} ${s.adults === "1" ? "adult" : "adults"}, ${s.children} ${s.children === "1" ? "child" : "children"} · ${roomOf(s)?.label ?? "No room"} · ${rangeText(s)}`,
  },
  { step: 3, title: STEPS[2]!.title, text: EXTRAS.filter((extra) => s[extra.key]).map((extra) => extra.label).join(", ") || "None" },
];
