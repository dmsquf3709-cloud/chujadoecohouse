import { getInformations, getPolicyOptions, getReservationFields } from "@/lib/sheets";
import ReserveClient from "@/app/reserve/reserve-client";

export default async function ReservePage() {
  const [rooms, policy, fields] = await Promise.all([
    getInformations(),
    getPolicyOptions(),
    getReservationFields()
  ]);

  return (
    <main className="container py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">객실 예약</h1>
        <p className="text-sm text-muted-foreground">
          객실/날짜/옵션을 선택하면 총 금액이 실시간으로 합산됩니다.
        </p>
      </div>

      <div className="mt-6">
        <ReserveClient rooms={rooms} policy={policy} fields={fields} />
      </div>
    </main>
  );
}

