"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { RoomInfo } from "@/lib/sheets";

type Status = "on" | "off";
type ViewMode = "week" | "month";

const statusCycle: Status[] = ["on", "off"];
const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

function nextStatus(s: Status): Status {
  const idx = statusCycle.indexOf(s);
  return statusCycle[(idx + 1) % statusCycle.length]!;
}

function pillClass(s: Status) {
  if (s === "on") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  return "bg-slate-100 text-slate-700 border-slate-200";
}

function label(s: Status) {
  if (s === "on") return "On";
  return "Off";
}

function formatYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateLabel(ymd: string) {
  const d = new Date(`${ymd}T00:00:00`);
  return `${d.getMonth() + 1}/${d.getDate()}(${dayLabels[d.getDay()]})`;
}

function getMonday(d: Date) {
  const copied = new Date(d);
  const day = copied.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copied.setDate(copied.getDate() + diff);
  return copied;
}

function getWeekDates(base: Date) {
  const monday = getMonday(base);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return formatYmd(d);
  });
}

function getMonthDates(month: string) {
  const [year, monthNum] = month.split("-").map(Number);
  const first = new Date(year, monthNum - 1, 1);
  const dates: string[] = [];

  const current = new Date(first);

  while (current.getMonth() === monthNum - 1) {
    dates.push(formatYmd(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function getMonthOptions() {
  const today = new Date();

  return Array.from({ length: 18 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);

    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;

    const label = `${String(d.getFullYear()).slice(2)}년 ${d.getMonth() + 1}월`;

    return { value, label };
  });
}

export default function InventoryClient({ rooms }: { rooms: RoomInfo[] }) {
  const today = new Date();

  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedMonth, setSelectedMonth] = useState(
    formatYmd(today).slice(0, 7)
  );
  const [weekBase, setWeekBase] = useState(today);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [map, setMap] = useState<Map<string, Status>>(new Map());

  const monthOptions = getMonthOptions();

  const dates = useMemo(() => {
    if (viewMode === "week") return getWeekDates(weekBase);
    return getMonthDates(selectedMonth);
  }, [viewMode, weekBase, selectedMonth]);

  const groupedRooms = useMemo(() => {
    const byBuilding = new Map<string, RoomInfo[]>();

    for (const room of rooms) {
      const building = room.building || "미분류";
      byBuilding.set(building, [...(byBuilding.get(building) ?? []), room]);
    }

    return Array.from(byBuilding.entries());
  }, [rooms]);

  async function loadInventory() {
    setLoading(true);

    const { data, error } = await supabase
      .from("inventory")
      .select("room_id,date,status")
      .in(
        "room_id",
        rooms.map((room) => room.id)
      )
      .in("date", dates);

    if (error) {
      console.error(error);
      alert("재고 정보를 불러오는 중 오류가 발생했습니다.");
      setLoading(false);
      return;
    }

    const nextMap = new Map<string, Status>();

    for (const item of data || []) {
      nextMap.set(`${item.room_id}__${item.date}`, item.status === "off" ? "off" : "on");
    }

    setMap(nextMap);
    setLoading(false);
  }

  useEffect(() => {
    loadInventory();
  }, [dates.join(","), rooms.length]);

  const getStatus = (roomId: string, date: string): Status => {
    return map.get(`${roomId}__${date}`) ?? "on";
  };

  async function saveStatus(roomId: string, date: string, status: Status) {
    const key = `${roomId}__${date}`;
    const current = getStatus(roomId, date);

    setMap((prev) => {
      const next = new Map(prev);
      next.set(key, status);
      return next;
    });

    setSavingKey(key);

    const { error } = await supabase.from("inventory").upsert(
      {
        room_id: roomId,
        date,
        status,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "room_id,date",
      }
    );

    if (error) {
      console.error(error);

      setMap((prev) => {
        const next = new Map(prev);
        next.set(key, current);
        return next;
      });

      alert("저장 실패");
    }

    setSavingKey(null);
  }

  async function toggleRoom(roomId: string, date: string) {
    const current = getStatus(roomId, date);
    await saveStatus(roomId, date, nextStatus(current));
  }

  async function toggleWholeDay(date: string) {
    const shouldClose = rooms.some((room) => getStatus(room.id, date) !== "off");

    const nextStatusForDay: Status = shouldClose ? "off" : "on";

    const ok = confirm(
      shouldClose
        ? `${dateLabel(date)} 전체 객실을 Off로 변경할까요?`
        : `${dateLabel(date)} 전체 객실을 On으로 변경할까요?`
    );

    if (!ok) return;

    const rows = rooms.map((room) => ({
      room_id: room.id,
      date,
      status: nextStatusForDay,
      updated_at: new Date().toISOString(),
    }));

    setMap((prev) => {
      const next = new Map(prev);

      for (const row of rows) {
        next.set(`${row.room_id}__${row.date}`, row.status);
      }

      return next;
    });

    const { error } = await supabase.from("inventory").upsert(rows, {
      onConflict: "room_id,date",
    });

    if (error) {
      console.error(error);
      alert("전체 변경 중 오류가 발생했습니다.");
      loadInventory();
    }
  }

  function moveWeek(direction: "prev" | "next") {
    setWeekBase((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + (direction === "next" ? 7 : -7));
      setSelectedMonth(formatYmd(next).slice(0, 7));
      return next;
    });
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-blue-700 tracking-[0.35em] uppercase text-xs font-bold font-mono mb-3">
            Admin
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter">
            객실 관리
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
            className="h-11 px-4 bg-white border border-slate-200 text-sm font-bold"
          >
            <option value="week">주차별로 보기</option>
            <option value="month">월별로 보기</option>
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setWeekBase(new Date(`${e.target.value}-01T00:00:00`));
            }}
            className="h-11 px-4 bg-white border border-slate-200 text-sm font-bold"
          >
            {monthOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          {viewMode === "week" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => moveWeek("prev")}
                className="h-11 px-4 bg-white border border-slate-200 text-sm font-bold"
              >
                ← 이전주
              </button>

              <button
                type="button"
                onClick={() => moveWeek("next")}
                className="h-11 px-4 bg-white border border-slate-200 text-sm font-bold"
              >
                다음주 →
              </button>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="mb-4 text-sm text-slate-400">
          재고 정보를 불러오는 중...
        </div>
      )}

      <div className="overflow-auto bg-white border border-slate-100 shadow-sm">
        <table className="min-w-[900px] w-full border-separate border-spacing-0">
          <thead className="sticky top-0 bg-white z-20">
            <tr>
              <th className="sticky left-0 z-30 border-b bg-white p-3 text-left text-sm font-bold">
                객실
              </th>

              {dates.map((date) => (
                <th
                  key={date}
                  className="border-b p-3 text-xs font-bold text-slate-600 whitespace-nowrap"
                >
                  {dateLabel(date)}
                </th>
              ))}
            </tr>

            <tr>
              <th className="sticky left-0 z-30 border-b bg-slate-50 p-3 text-left text-xs font-bold text-slate-500">
                전체 객실
              </th>

              {dates.map((date) => (
                <th key={date} className="border-b bg-slate-50 p-2">
                  <button
                    type="button"
                    onClick={() => toggleWholeDay(date)}
                    className="px-3 py-2 text-xs font-bold bg-slate-950 text-white hover:bg-blue-700"
                  >
                    전체 Off
                  </button>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {groupedRooms.map(([building, roomList]) => (
              <FragmentRooms
                key={building}
                building={building}
                rooms={roomList}
                dates={dates}
                getStatus={getStatus}
                toggleRoom={toggleRoom}
                savingKey={savingKey}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FragmentRooms(props: {
  building: string;
  rooms: RoomInfo[];
  dates: string[];
  getStatus: (roomId: string, date: string) => Status;
  toggleRoom: (roomId: string, date: string) => void;
  savingKey: string | null;
}) {
  return (
    <>
      <tr>
        <td
          colSpan={props.dates.length + 1}
          className="sticky left-0 z-10 border-b bg-slate-50 p-3 text-xs font-bold text-slate-500"
        >
          {props.building}
        </td>
      </tr>

      {props.rooms.map((room) => (
        <tr key={room.id}>
          <td className="sticky left-0 z-10 border-b bg-white p-3 text-sm font-medium whitespace-nowrap">
            {room.name}
          </td>

          {props.dates.map((date) => {
            const key = `${room.id}__${date}`;
            const status = props.getStatus(room.id, date);

            return (
              <td key={date} className="border-b p-2 text-center">
                <button
                  type="button"
                  onClick={() => props.toggleRoom(room.id, date)}
                  disabled={props.savingKey === key}
                  className={[
                    "mx-auto inline-flex w-[56px] items-center justify-center border px-2 py-1.5 text-xs font-bold",
                    pillClass(status),
                    props.savingKey === key ? "opacity-60" : "hover:opacity-90",
                  ].join(" ")}
                >
                  {label(status)}
                </button>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}