export const dynamic = "force-dynamic";
export const revalidate = 0;

import { supabaseAdminLike } from "@/lib/supabase";
import RevenueClient from "@/app/admin/revenue/revenue-client";

type Row = {
  check_in: string;
  total_amount: number;
  status: string;
};

export default async function AdminRevenuePage() {
  const sb = supabaseAdminLike();

  const res = await sb
    .from("reservations")
    .select("check_in,total_amount,status")
    .eq("status", "confirmed")
    .order("check_in", { ascending: true });

  const rows = (res.data ?? []) as Row[];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="max-w-[1300px] mx-auto px-6 md:px-10 py-10">
        <div className="mb-8">
          <p className="text-blue-700 tracking-[0.35em] uppercase text-xs font-bold font-mono mb-3">
            Admin
          </p>

          <h1 className="text-3xl md:text-4xl font-black tracking-tighter">
            매출 통계
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            승인 완료된 예약 기준 매출을 확인합니다.
          </p>
        </div>

        <RevenueClient rows={rows} />
      </div>
    </main>
  );
}