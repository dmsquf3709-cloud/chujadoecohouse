import { PolicyOption, RoomInfo } from "@/lib/sheets";

export function isWeekend(date: Date) {
  // Treat Fri/Sat as weekend (common for Korean lodging pricing)
  const day = date.getDay(); // 0 Sun .. 6 Sat
  return day === 5 || day === 6;
}

export function parseYmd(ymd: string): Date | null {
  // expect YYYY-MM-DD
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function diffNights(checkInYmd: string, checkOutYmd: string) {
  const a = parseYmd(checkInYmd);
  const b = parseYmd(checkOutYmd);
  if (!a || !b) return 0;
  const ms = b.getTime() - a.getTime();
  const nights = Math.floor(ms / (1000 * 60 * 60 * 24));
  return Math.max(0, nights);
}

export function calcRoomPriceTotal(params: {
  room: RoomInfo;
  checkInYmd: string;
  nights: number;
}) {
  const start = parseYmd(params.checkInYmd);
  if (!start || params.nights <= 0) return 0;
  let total = 0;
  for (let i = 0; i < params.nights; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    total += isWeekend(d) ? params.room.weekendPrice : params.room.weekdayPrice;
  }
  return total;
}

export function calcTotal(params: {
  room: RoomInfo | null;
  policy: PolicyOption[] | null;
  checkInYmd: string;
  checkOutYmd: string;
  guests: number;
  mealPeople: number;
}) {
  if (!params.room || !params.policy) {
    return { nights: 0, roomTotal: 0, extraTotal: 0, mealTotal: 0, grandTotal: 0 };
  }

  const nights = diffNights(params.checkInYmd, params.checkOutYmd);
  const roomTotal = calcRoomPriceTotal({
    room: params.room,
    checkInYmd: params.checkInYmd,
    nights
  });

  const extraPeople = Math.max(0, params.guests - params.room.basePeople);
  const extraTotal = extraPeople * params.policy.extraPersonPricePerNight * nights;
  const mealTotal = Math.max(0, params.mealPeople) * params.policy.mealPricePerPerson;
  const grandTotal = roomTotal + extraTotal + mealTotal;

  return { nights, roomTotal, extraTotal, mealTotal, grandTotal };
}

