import { PolicyOption, RoomInfo } from "@/lib/sheets";

export function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 5 || day === 6;
}

export function getNights(checkInYmd: string, checkOutYmd: string) {
  if (!checkInYmd || !checkOutYmd) return 0;

  const start = new Date(`${checkInYmd}T00:00:00`);
  const end = new Date(`${checkOutYmd}T00:00:00`);
  const diff = end.getTime() - start.getTime();

  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
}

function parseCapacity(capacity: string) {
  const nums = capacity.match(/\d+/g)?.map(Number) || [];

  return {
    basePeople: nums[0] || 2,
    maxPeople: nums[1] || nums[0] || 4,
  };
}

function getPolicyPrice(
  policy: PolicyOption[] | null,
  keyword: string,
  fallback: number
) {
  const found = policy?.find((item) => {
    return (
      item.category?.includes(keyword) ||
      item.item?.includes(keyword) ||
      item.note?.includes(keyword) ||
      item.info?.includes(keyword)
    );
  });

  return found?.price || fallback;
}

export function calcTotal(params: {
  room: RoomInfo | null;
  policy: PolicyOption[] | null;
  checkInYmd: string;
  checkOutYmd: string;
  guests: number;
  mealPeople: number;
}) {
  const nights = getNights(params.checkInYmd, params.checkOutYmd);

  if (!params.room || nights <= 0) {
    return {
      nights,
      roomTotal: 0,
      extraPeople: 0,
      extraTotal: 0,
      mealTotal: 0,
      grandTotal: 0,
    };
  }

  const capacity = parseCapacity(params.room.capacity);

  const extraPersonPricePerNight = getPolicyPrice(
    params.policy,
    "추가",
    20000
  );

  const mealPricePerPerson = getPolicyPrice(
    params.policy,
    "식사",
    10000
  );

  let roomTotal = 0;

  const current = new Date(`${params.checkInYmd}T00:00:00`);

  for (let i = 0; i < nights; i++) {
    roomTotal += isWeekend(current)
      ? params.room.weekendPrice
      : params.room.weekdayPrice;

    current.setDate(current.getDate() + 1);
  }

  const extraPeople = Math.max(0, params.guests - capacity.basePeople);
  const extraTotal = extraPeople * extraPersonPricePerNight * nights;
  const mealTotal = Math.max(0, params.mealPeople) * mealPricePerPerson;
  const grandTotal = roomTotal + extraTotal + mealTotal;

  return {
    nights,
    roomTotal,
    extraPeople,
    extraTotal,
    mealTotal,
    grandTotal,
  };
}