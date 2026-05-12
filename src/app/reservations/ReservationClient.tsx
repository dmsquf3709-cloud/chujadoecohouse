"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { RoomInfo } from "@/lib/sheets";

type Props = {
  rooms: RoomInfo[];
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

export default function ReservationClient({ rooms }: Props) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestCount, setGuestCount] = useState(2);
  const [closedRoomIds, setClosedRoomIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const nights = getNights(checkIn, checkOut);

  const groupedRooms = useMemo(() => {
    const filtered = rooms.filter((room) => {
      const capacity = parseCapacity(room.capacity);

      if (!room.id) return false;
      if (!room.building) return false;
      if (!room.name) return false;
      if (guestCount > capacity.max) return false;
      if (closedRoomIds.includes(room.id)) return false;

      return true;
    });

    return filtered.reduce<Record<string, RoomInfo[]>>((acc, room) => {
      const building = room.building || "기타";
      if (!acc[building]) acc[building] = [];
      acc[building].push(room);
      return acc;
    }, {});
  }, [rooms, guestCount, closedRoomIds]);

  async function checkAvailableRooms() {
    if (!checkIn || !checkOut) {
      alert("체크인/체크아웃 날짜를 먼저 선택해주세요.");
      return;
    }

    if (nights <= 0) {
      alert("체크아웃 날짜는 체크인 날짜보다 뒤여야 합니다.");
      return;
    }

    setLoading(true);
    setSearched(true);

    const dates = getDatesBetween(checkIn, checkOut);

    const { data, error } = await supabase
      .from("inventory")
      .select("room_id, date, status")
      .in("date", dates)
      .in("status", ["off", "sold"]);

    if (error) {
      console.error(error);
      alert("객실 재고를 확인하는 중 오류가 발생했습니다.");
      setLoading(false);
      return;
    }

    const blockedIds = Array.from(
      new Set((data || []).map((item) => item.room_id))
    );

    setClosedRoomIds(blockedIds);
    setLoading(false);
  }

  return (
    <main className="bg-white text-slate-900 font-sans antialiased">
      <section className="py-24 md:py-32 text-center px-6">
        <p className="text-blue-700 tracking-[0.42em] uppercase text-sm md:text-base font-bold font-mono mb-6">
          Reservation
        </p>

        <h1 className="text-5xl md:text-7xl font-black leading-[1.1]">
          객실 예약
        </h1>

        <p className="mt-8 text-lg md:text-xl text-slate-500 leading-[2] break-keep">
          머무는 날짜와 인원을 선택하면,
          <br />
          예약 가능한 객실만 보여드립니다.
        </p>
      </section>

      <section className="max-w-[1180px] mx-auto px-6 md:px-10 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 border border-slate-100 p-5 md:p-6">
          <div>
            <label className="block text-xs font-bold tracking-[0.25em] text-slate-400 uppercase mb-3">
              Check In
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full h-12 px-4 bg-white border border-slate-200 text-sm outline-none"
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
              className="w-full h-12 px-4 bg-white border border-slate-200 text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold tracking-[0.25em] text-slate-400 uppercase mb-3">
              Guests
            </label>
            <input
              type="number"
              min={1}
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              className="w-full h-12 px-4 bg-white border border-slate-200 text-sm outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={checkAvailableRooms}
              className="w-full h-12 bg-slate-950 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
            >
              {loading ? "확인 중..." : "가능 객실 보기"}
            </button>
          </div>
        </div>

        {nights > 0 && (
          <p className="mt-5 text-center text-sm text-slate-500">
            선택하신 일정은 총{" "}
            <b className="text-slate-900">{nights}박</b>입니다.
          </p>
        )}

        {!searched && (
          <p className="mt-4 text-center text-xs text-slate-400">
            날짜를 선택하지 않아도 객실 목록은 확인할 수 있습니다.
          </p>
        )}
      </section>

      <section className="max-w-[1280px] mx-auto px-6 md:px-10 pb-28 md:pb-36">
        {Object.keys(groupedRooms).length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            조건에 맞는 객실이 없습니다.
          </div>
        ) : (
          <div className="space-y-20">
            {Object.entries(groupedRooms).map(([building, roomItems]) => (
              <div key={building}>
                <div className="mb-8">
                  <p className="text-blue-700 tracking-[0.42em] uppercase text-sm md:text-base font-bold font-mono mb-3">
                    Rooms
                  </p>
                  <h2 className="text-3xl md:text-5xl font-black tracking-tighter">
                    {building}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                  {roomItems.map((room) => {
                    const firstImage = room.photos[0]
                      ? convertDriveUrl(room.photos[0])
                      : "";

                    const capacity = parseCapacity(room.capacity);

                    return (
                      <article
                        key={room.id}
                        className="group border border-slate-100 bg-white hover:shadow-xl transition-shadow"
                      >
                        <Link
                          href={`/rooms/${encodeURIComponent(
                            room.id
                          )}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guestCount}`}
                        >
                          <div className="relative aspect-[1.25/1] overflow-hidden bg-slate-100">
                            {firstImage && (
                              <img
                                src={firstImage}
                                alt={room.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                            )}
                          </div>

                          <div className="p-6">
                            <h3 className="text-2xl font-black tracking-tighter mb-4">
                              {room.name}
                            </h3>

                            <div className="space-y-2 text-sm text-slate-500 leading-[1.8]">
                              <p>
                                기준 {capacity.base}인 / 최대 {capacity.max}인
                              </p>
                              <p>
                                주중 {formatPrice(room.weekdayPrice)}원 · 주말{" "}
                                {formatPrice(room.weekendPrice)}원
                              </p>
                            </div>

                            <div className="mt-6 text-sm font-bold text-slate-900">
                              상세보기 / 예약하기 →
                            </div>
                          </div>
                        </Link>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}