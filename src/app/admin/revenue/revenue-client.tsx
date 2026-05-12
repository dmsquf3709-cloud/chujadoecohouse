"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Row = {
  check_in: string;
  total_amount: number;
  status: string;
};

type ViewMode = "daily" | "weekly";

function currency(n: number) {
  return new Intl.NumberFormat("ko-KR").format(Math.round(Number(n || 0)));
}

function getMonday(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  date.setDate(date.getDate() + diff);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function weekLabel(mondayString: string) {
  const monday = new Date(`${mondayString}T00:00:00`);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return `${monday.getMonth() + 1}/${monday.getDate()}~${
    sunday.getMonth() + 1
  }/${sunday.getDate()}`;
}

export default function RevenueClient({ rows }: { rows: Row[] }) {
  const today = new Date().toISOString().slice(0, 10);

  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [selectedDate, setSelectedDate] = useState(today);

  const selectedDateRevenue = useMemo(() => {
    return rows
      .filter((row) => row.check_in === selectedDate)
      .reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
  }, [rows, selectedDate]);

  const totalRevenue = useMemo(() => {
    return rows.reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
  }, [rows]);

  const chartData = useMemo(() => {
    const map = new Map<string, number>();

    for (const row of rows) {
      const key =
        viewMode === "daily" ? row.check_in : getMonday(row.check_in);

      map.set(key, (map.get(key) ?? 0) + Number(row.total_amount || 0));
    }

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, revenue]) => ({
        date,
        label: viewMode === "daily" ? date.slice(5) : weekLabel(date),
        revenue,
      }));
  }, [rows, viewMode]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-100 p-6 shadow-sm">
          <p className="text-sm text-slate-400 font-bold mb-2">
            확정 예약 수
          </p>
          <p className="text-4xl font-black">{rows.length}</p>
        </div>

        <div className="bg-white border border-slate-100 p-6 shadow-sm">
          <p className="text-sm text-slate-400 font-bold mb-2">
            총 확정 매출
          </p>
          <p className="text-4xl font-black">
            {currency(totalRevenue)}원
          </p>
        </div>

        <div className="bg-white border border-slate-100 p-6 shadow-sm">
          <p className="text-sm text-slate-400 font-bold mb-4">
            일자별 매출 확인
          </p>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full h-11 px-4 border border-slate-200 text-sm mb-4"
          />

          <p className="text-3xl font-black">
            {currency(selectedDateRevenue)}원
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-100 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <p className="text-blue-700 tracking-[0.35em] uppercase text-xs font-bold font-mono mb-3">
              Revenue Chart
            </p>

            <h2 className="text-2xl md:text-3xl font-black tracking-tighter">
              {viewMode === "daily" ? "일별 매출" : "주차별 매출"}
            </h2>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode("daily")}
              className={`px-4 py-3 text-sm font-bold ${
                viewMode === "daily"
                  ? "bg-blue-700 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              일별
            </button>

            <button
              type="button"
              onClick={() => setViewMode("weekly")}
              className={`px-4 py-3 text-sm font-bold ${
                viewMode === "weekly"
                  ? "bg-blue-700 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              주차별
            </button>
          </div>
        </div>

        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ left: 8, right: 8, top: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${Math.round(Number(v) / 10000)}만`}
              />
              <Tooltip
                formatter={(v) => `${currency(Number(v))}원`}
                labelFormatter={(l) =>
                  viewMode === "daily" ? `날짜: ${String(l)}` : `주차: ${String(l)}`
                }
              />
              <Bar
                dataKey="revenue"
                fill="#2563eb"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}