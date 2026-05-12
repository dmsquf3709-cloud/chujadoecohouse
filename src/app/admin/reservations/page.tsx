export const dynamic = "force-dynamic";
export const revalidate = 0;
import { revalidatePath } from "next/cache";
import { supabaseAdminLike } from "@/lib/supabase";

type Status = "pending" | "confirmed" | "rejected";

function currency(n: number) {
  return new Intl.NumberFormat("ko-KR").format(Math.round(Number(n || 0)));
}

function getDatesBetween(start: string, end: string) {
  const result: string[] = [];
  const current = new Date(start);
  const last = new Date(end);

  while (current < last) {
    result.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }

  return result;
}

async function confirmReservation(formData: FormData) {
  "use server";

  const id = String(formData.get("id"));
  const roomId = String(formData.get("room_id"));
  const checkIn = String(formData.get("check_in"));
  const checkOut = String(formData.get("check_out"));

  const sb = supabaseAdminLike();

  const dates = getDatesBetween(checkIn, checkOut);

  const inventoryRows = dates.map((date) => ({
    room_id: roomId,
    date,
    status: "off",
    updated_at: new Date().toISOString(),
  }));

  await sb.from("inventory").upsert(inventoryRows, {
    onConflict: "room_id,date",
  });

  await sb
    .from("reservations")
    .update({ status: "confirmed" })
    .eq("id", id);

  revalidatePath("/admin/reservations");
  revalidatePath("/admin/inventory");
}

async function rejectReservation(formData: FormData) {
  "use server";

  const id = String(formData.get("id"));

  const sb = supabaseAdminLike();

  await sb
    .from("reservations")
    .update({ status: "rejected" })
    .eq("id", id);

  revalidatePath("/admin/reservations");
}

function statusBadge(status: Status) {
  if (status === "confirmed") {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  if (status === "rejected") {
    return "bg-rose-50 text-rose-700 border-rose-100";
  }

  return "bg-amber-50 text-amber-700 border-amber-100";
}

function statusLabel(status: Status) {
  if (status === "confirmed") return "승인 완료";
  if (status === "rejected") return "반려";
  return "예약 대기";
}

export default async function AdminReservationsPage() {
  const sb = supabaseAdminLike();

  const res = await sb
    .from("reservations")
    .select(
      "id,created_at,room_id,building,room_name,check_in,check_out,nights,guest_count,meal_people,pickup_needed,arrival_time,ferry_name,customer_name,customer_phone,total_amount,status,breakfast_count,dinner_count"
    )
    .order("created_at", { ascending: false })
    .limit(200);
    if (res.error) {
      return (
        <main className="min-h-screen bg-slate-50 text-slate-900 font-sans">
          <div className="max-w-[1200px] mx-auto px-6 py-20">
            <h1 className="text-3xl font-black mb-4">예약 관리 오류</h1>
    
            <pre className="bg-white border p-6 text-sm whitespace-pre-wrap">
              {JSON.stringify(res.error, null, 2)}
            </pre>
          </div>
        </main>
      );
    }
    
 
  const items = res.data ?? [];

  const pendingCount = items.filter((it) => it.status === "pending").length;
  const confirmedCount = items.filter((it) => it.status === "confirmed").length;
  const rejectedCount = items.filter((it) => it.status === "rejected").length;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="max-w-[1500px] mx-auto px-6 md:px-10 py-10">
        <div className="mb-8">
          <p className="text-blue-700 tracking-[0.35em] uppercase text-xs font-bold font-mono mb-3">
            Admin
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter">
            예약 관리
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            예약 신청 확인 · 승인 · 반려 처리
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-slate-100 p-6 shadow-sm">
            <p className="text-sm text-slate-400 font-bold mb-2">예약 대기</p>
            <p className="text-4xl font-black">{pendingCount}</p>
          </div>

          <div className="bg-white border border-slate-100 p-6 shadow-sm">
            <p className="text-sm text-slate-400 font-bold mb-2">승인 완료</p>
            <p className="text-4xl font-black">{confirmedCount}</p>
          </div>

          <div className="bg-white border border-slate-100 p-6 shadow-sm">
            <p className="text-sm text-slate-400 font-bold mb-2">반려</p>
            <p className="text-4xl font-black">{rejectedCount}</p>
          </div>
        </div>

        <div className="overflow-auto bg-white border border-slate-100 shadow-sm">
          <table className="min-w-[1300px] w-full">
            <thead className="bg-slate-950 text-white">
              <tr className="text-left text-xs">
                <th className="p-4">상태</th>
                <th className="p-4">예약자</th>
                <th className="p-4">연락처</th>
                <th className="p-4">객실</th>
                <th className="p-4">기간</th>
                <th className="p-4">인원</th>
                <th className="p-4">식사</th>
                <th className="p-4">픽업</th>
                <th className="p-4">입금 금액</th>
                <th className="p-4">신청일</th>
                <th className="p-4">처리</th>
              </tr>
            </thead>

            <tbody>
              {items.map((it: any) => (
                <tr key={it.id} className="border-t border-slate-100 text-sm">
                  <td className="p-4">
                    <span
                      className={`inline-flex border px-3 py-1 text-xs font-bold ${statusBadge(
                        it.status
                      )}`}
                    >
                      {statusLabel(it.status)}
                    </span>
                  </td>

                  <td className="p-4 font-bold">{it.customer_name}</td>

                  <td className="p-4 text-slate-600">{it.customer_phone}</td>

                  <td className="p-4">
                    <div className="text-xs text-slate-400">{it.building}</div>
                    <div className="font-bold">{it.room_name}</div>
                  </td>

                  <td className="p-4 text-slate-600">
                    {it.check_in} → {it.check_out}
                    <br />
                    <span className="text-xs text-slate-400">{it.nights}박</span>
                  </td>

                  <td className="p-4 text-slate-600">{it.guest_count}명</td>

                  <td className="p-4 text-slate-600">
                    조식 {it.breakfast_count || 0}명
                    <br />
                    석식 {it.dinner_count || 0}명
                  </td>

                  <td className="p-4 text-slate-600">
                    {it.pickup_needed ? (
                      <>
                        필요
                        <br />
                        <span className="text-xs text-slate-400">
                          {it.arrival_time || "-"} · {it.ferry_name || "-"}
                        </span>
                      </>
                    ) : (
                      "필요 없음"
                    )}
                  </td>

                  <td className="p-4 font-black">
                    {currency(it.total_amount)}원
                  </td>

                  <td className="p-4 text-xs text-slate-400">
                    {String(it.created_at).slice(0, 19).replace("T", " ")}
                  </td>

                  <td className="p-4">
                    {it.status === "pending" ? (
                      <div className="flex gap-2">
                        <form action={confirmReservation}>
                          <input type="hidden" name="id" value={it.id} />
                          <input type="hidden" name="room_id" value={it.room_id} />
                          <input type="hidden" name="check_in" value={it.check_in} />
                          <input type="hidden" name="check_out" value={it.check_out} />

                          <button
                            type="submit"
                            className="px-4 py-2 bg-blue-700 text-white text-xs font-bold"
                          >
                            승인
                          </button>
                        </form>

                        <form action={rejectReservation}>
                          <input type="hidden" name="id" value={it.id} />

                          <button
                            type="submit"
                            className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold"
                          >
                            반려
                          </button>
                        </form>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">처리 완료</span>
                    )}
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    className="p-12 text-center text-sm text-slate-400"
                  >
                    예약 데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}