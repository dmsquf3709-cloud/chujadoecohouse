"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PolicyOption, RoomInfo } from "@/lib/sheets";

type Props = {
  room: RoomInfo;
  policies: PolicyOption[];
  initialCheckIn: string;
  initialCheckOut: string;
  initialGuests: number;
};

function convertDriveUrl(url: string) {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return "";

  const match =
    trimmedUrl.match(/\/d\/(.+?)\//) ||
    trimmedUrl.match(/id=(.+?)(?:&|$)/);

  if (match?.[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}=s1600`;
  }

  return trimmedUrl;
}

function getNights(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;

  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();

  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
}

function parseCapacity(capacity: string) {
  const nums = capacity.match(/\d+/g)?.map(Number) || [];

  return {
    base: nums[0] || 2,
    max: nums[1] || nums[0] || 4,
  };
}

function formatPrice(price: number) {
  return Number(price || 0).toLocaleString("ko-KR");
}

function getPolicyPrice(
  policies: PolicyOption[],
  keyword: string,
  fallback: number
) {
  const found = policies.find((item) => {
    return (
      item.item?.includes(keyword) ||
      item.category?.includes(keyword) ||
      item.note?.includes(keyword)
    );
  });

  return found?.price || fallback;
}

function getDatesBetween(start: string, end: string) {
  if (!start || !end) return [];

  const result: string[] = [];
  const current = new Date(start);
  const last = new Date(end);

  while (current < last) {
    result.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }

  return result;
}

export default function RoomDetailClient({
  room,
  policies,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
}: Props) {
  const [selectedImage, setSelectedImage] = useState(
    room.photos[0] ? convertDriveUrl(room.photos[0]) : ""
  );

  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guestCount, setGuestCount] = useState(initialGuests || 2);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [pickupNeeded, setPickupNeeded] = useState(false);
  const [arrivalTime, setArrivalTime] = useState("");
  const [ferryName, setFerryName] = useState("");

  const [breakfastCount, setBreakfastCount] = useState(0);
  const [dinnerCount, setDinnerCount] = useState(0);

  const [submitting, setSubmitting] = useState(false);

  const nights = getNights(checkIn, checkOut);
  const capacity = parseCapacity(room.capacity);

  const extraGuestPrice = getPolicyPrice(policies, "추가", 20000);
  const breakfastPrice = getPolicyPrice(policies, "조식", 10000);
  const dinnerPrice = getPolicyPrice(policies, "석식", 20000);

  const total = useMemo(() => {
    const roomPrice = room.weekdayPrice * nights;
    const extraPeople = Math.max(guestCount - capacity.base, 0);
    const extraFee = extraPeople * extraGuestPrice * nights;
    const mealFee =
      breakfastCount * breakfastPrice * nights +
      dinnerCount * dinnerPrice * nights;

    return roomPrice + extraFee + mealFee;
  }, [
    room.weekdayPrice,
    nights,
    guestCount,
    capacity.base,
    extraGuestPrice,
    breakfastCount,
    breakfastPrice,
    dinnerCount,
    dinnerPrice,
  ]);

  async function submitReservation() {
    if (!checkIn || !checkOut) {
      alert("체크인/체크아웃 날짜를 선택해주세요.");
      return;
    }

    if (nights <= 0) {
      alert("체크아웃 날짜는 체크인 날짜보다 뒤여야 합니다.");
      return;
    }

    if (!customerName.trim()) {
      alert("예약자 이름을 입력해주세요.");
      return;
    }

    if (!customerPhone.trim()) {
      alert("연락처를 입력해주세요.");
      return;
    }

    if (guestCount > capacity.max) {
      alert(`해당 객실은 최대 ${capacity.max}인까지 예약 가능합니다.`);
      return;
    }

    if (pickupNeeded && (!arrivalTime.trim() || !ferryName.trim())) {
      alert("픽업 필요 시 입도 시간과 여객선 이름을 입력해주세요.");
      return;
    }

    setSubmitting(true);

    const dates = getDatesBetween(checkIn, checkOut);

    const { data: blockedData, error: blockedError } = await supabase
      .from("inventory")
      .select("room_id, date, status")
      .eq("room_id", room.id)
      .in("date", dates)
      .in("status", ["off", "sold"]);

    if (blockedError) {
      console.error(blockedError);
      alert("재고 확인 중 오류가 발생했습니다.");
      setSubmitting(false);
      return;
    }

    if (blockedData && blockedData.length > 0) {
      alert("선택하신 날짜에 이미 마감된 객실입니다.");
      setSubmitting(false);
      return;
    }

    const extraPeople = Math.max(guestCount - capacity.base, 0);
    const extraFee = extraPeople * extraGuestPrice * nights;

    const { error } = await supabase.from("reservations").insert({
      room_id: room.id,
      building: room.building,
      room_name: room.name,
      check_in: checkIn,
      check_out: checkOut,
      nights,
      guest_count: guestCount,
      meal_people: breakfastCount + dinnerCount,
      pickup_needed: pickupNeeded,
      arrival_time: pickupNeeded ? arrivalTime : "",
      ferry_name: pickupNeeded ? ferryName : "",
      customer_name: customerName,
      customer_phone: customerPhone,
      total_amount: total,
      status: "pending",
      breakfast_count: breakfastCount,
      dinner_count: dinnerCount,
      extra_guest_fee: extraFee,
    });

    setSubmitting(false);

    if (error) {
      console.error(error);
      alert("예약 신청 중 오류가 발생했습니다.");
      return;
    }

    alert("예약 신청이 완료되었습니다. 사장님 확인 후 연락드릴 예정입니다.");
  }

  return (
    <main className="bg-white text-slate-900 font-sans antialiased">
      <section className="max-w-[1320px] mx-auto px-6 md:px-10 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr] gap-12 lg:gap-16">
          <div>
            <div className="aspect-[1.25/1] bg-slate-100 overflow-hidden">
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt={room.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {room.photos.length > 1 && (
              <div className="grid grid-cols-4 gap-3 mt-4">
                {room.photos.slice(0, 4).map((photo, index) => {
                  const imageUrl = convertDriveUrl(photo);

                  return (
                    <button
                      key={`${photo}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(imageUrl)}
                      className="aspect-square bg-slate-100 overflow-hidden"
                    >
                      <img
                        src={imageUrl}
                        alt={`${room.name} 사진 ${index + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <p className="text-blue-700 tracking-[0.42em] uppercase text-sm md:text-base font-bold font-mono mb-5">
              Room Detail
            </p>

            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.1] mb-6">
              {room.name}
            </h1>

            <p className="text-slate-400 text-sm font-bold mb-8">
              {room.building}
            </p>

            <div className="border-y border-slate-100 py-8 space-y-3 text-[0.98rem] text-slate-600 leading-[1.9]">
              <p>
                기준 {capacity.base}인 / 최대 {capacity.max}인
              </p>
              <p>
                주중 {formatPrice(room.weekdayPrice)}원 · 주말{" "}
                {formatPrice(room.weekendPrice)}원
              </p>
            </div>

            {room.description && (
              <div className="mt-8">
                <p className="whitespace-pre-wrap text-[1rem] leading-[2.05] text-slate-600 break-keep">
                  {room.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20 md:py-28">
        <div className="max-w-[1180px] mx-auto px-6 md:px-10">
          <div className="mb-10 text-center">
            <p className="text-blue-700 tracking-[0.42em] uppercase text-sm md:text-base font-bold font-mono mb-4">
              Reservation Form
            </p>

            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">
              예약 신청
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
            <div className="bg-white border border-slate-100 p-7 md:p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold tracking-[0.25em] text-slate-400 uppercase mb-3">
                    Check In
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full h-12 px-4 border border-slate-200 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold tracking-[0.25em] text-slate-400 uppercase mb-3">
                    Check Out
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full h-12 px-4 border border-slate-200 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold tracking-[0.25em] text-slate-400 uppercase mb-3">
                    Guests
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={capacity.max}
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full h-12 px-4 border border-slate-200 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold tracking-[0.25em] text-slate-400 uppercase mb-3">
                    Name
                  </label>
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="예약자 이름"
                    className="w-full h-12 px-4 border border-slate-200 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold tracking-[0.25em] text-slate-400 uppercase mb-3">
                    Phone
                  </label>
                  <input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="연락처"
                    className="w-full h-12 px-4 border border-slate-200 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold tracking-[0.25em] text-slate-400 uppercase mb-3">
                    Breakfast
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={breakfastCount}
                    onChange={(e) => setBreakfastCount(Number(e.target.value))}
                    className="w-full h-12 px-4 border border-slate-200 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold tracking-[0.25em] text-slate-400 uppercase mb-3">
                    Dinner
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={dinnerCount}
                    onChange={(e) => setDinnerCount(Number(e.target.value))}
                    className="w-full h-12 px-4 border border-slate-200 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-8">
                <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={pickupNeeded}
                    onChange={(e) => setPickupNeeded(e.target.checked)}
                  />
                  픽업이 필요합니다
                </label>

                {pickupNeeded && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                    <div>
                      <label className="block text-xs font-bold tracking-[0.25em] text-slate-400 uppercase mb-3">
                        Arrival Time
                      </label>
                      <input
                        value={arrivalTime}
                        onChange={(e) => setArrivalTime(e.target.value)}
                        placeholder="입도 시간"
                        className="w-full h-12 px-4 border border-slate-200 text-sm outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold tracking-[0.25em] text-slate-400 uppercase mb-3">
                        Ferry
                      </label>
                      <input
                        value={ferryName}
                        onChange={(e) => setFerryName(e.target.value)}
                        placeholder="여객선 이름"
                        className="w-full h-12 px-4 border border-slate-200 text-sm outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <aside className="bg-white border border-slate-100 p-7 md:p-8 h-fit sticky top-8">
              <p className="text-blue-700 tracking-[0.35em] uppercase text-sm font-bold font-mono mb-5">
                Price
              </p>

              <h3 className="text-2xl font-black tracking-tighter mb-8">
                입금 금액
              </h3>

              <div className="space-y-4 text-sm text-slate-500">
                <div className="flex justify-between">
                  <span>숙박</span>
                  <span>{formatPrice(room.weekdayPrice * nights)}원</span>
                </div>

                <div className="flex justify-between">
                  <span>추가 인원</span>
                  <span>
                    {formatPrice(
                      Math.max(guestCount - capacity.base, 0) *
                        extraGuestPrice *
                        nights
                    )}
                    원
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>식사</span>
                  <span>
                    {formatPrice(
                      breakfastCount * breakfastPrice * nights +
                        dinnerCount * dinnerPrice * nights
                    )}
                    원
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 mt-8 pt-8">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-slate-400">
                    Total
                  </span>
                  <span className="text-3xl font-black tracking-tighter">
                    {formatPrice(total)}원
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 mt-8 pt-8">
                <p className="text-xs tracking-[0.28em] text-slate-400 uppercase font-bold font-mono mb-4">
                  Account
                </p>

                <div className="space-y-2">
                  <p className="text-sm text-slate-500">예금주</p>
                  <p className="text-lg font-bold tracking-tight text-slate-900">
                    OOO
                  </p>

                  <p className="text-sm text-slate-500 mt-5">계좌번호</p>
                  <p className="text-xl font-black tracking-tight text-slate-900">
                    1234-1234-1234
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={submitReservation}
                disabled={submitting}
                className="mt-8 w-full py-4 bg-slate-950 text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "신청 중..." : "예약 신청하기"}
              </button>

              <p className="mt-5 text-xs leading-[1.8] text-slate-400 break-keep">
                예약 신청 후 바로 확정되는 것이 아니며, 사장님 확인 후 예약 확정 안내를 드립니다.
              </p>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}