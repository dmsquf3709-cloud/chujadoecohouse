import { NextResponse } from "next/server";
import { z } from "zod";

import { enumerateStayDates } from "@/lib/dates";
import { calcTotal } from "@/lib/pricing";
import { getInformations, getPolicyOptions } from "@/lib/sheets";
import { supabaseAdminLike } from "@/lib/supabase";

const CreateReservationSchema = z.object({
  roomId: z.string().min(1),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(1),
  mealPeople: z.number().int().min(0).default(0),
  pickupNeeded: z.boolean().default(false),
  arrivalTime: z.string().optional(),
  ferryName: z.string().optional(),
  name: z.string().min(1),
  phone: z.string().min(6),
  formData: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = CreateReservationSchema.parse(body);

    if (input.pickupNeeded) {
      if (!input.arrivalTime || !input.ferryName) {
        return NextResponse.json(
          { error: "픽업 필요 시 입도 시간/여객선 이름이 필요합니다." },
          { status: 400 }
        );
      }
    }

    const [rooms, policy] = await Promise.all([
      getInformations(),
      getPolicyOptions()
    ]);
    const room = rooms.find((r) => r.id === input.roomId) ?? null;
    if (!room) {
      return NextResponse.json({ error: "객실 정보를 찾을 수 없습니다." }, { status: 400 });
    }

    const total = calcTotal({
      room,
      policy,
      checkInYmd: input.checkIn,
      checkOutYmd: input.checkOut,
      guests: input.guests,
      mealPeople: input.mealPeople
    });

    if (total.nights <= 0) {
      return NextResponse.json({ error: "체크인/체크아웃 날짜를 확인해주세요." }, { status: 400 });
    }

    const stayDates = enumerateStayDates(input.checkIn, input.checkOut);
    const sb = supabaseAdminLike();

    // Hard-block sold/out/off inventory
    const inv = await sb
      .from("inventory")
      .select("date,status")
      .eq("room_id", input.roomId)
      .in("date", stayDates);

    if (inv.error) {
      return NextResponse.json({ error: inv.error.message }, { status: 500 });
    }
    const blocked = (inv.data ?? []).find((x) => x.status !== "on");
    if (blocked) {
      return NextResponse.json(
        { error: `선택한 기간에 마감된 날짜가 있습니다: ${blocked.date}` },
        { status: 409 }
      );
    }

    // Also block overlaps with existing reservations (in case inventory not maintained)
    const overlap = await sb
      .from("reservations")
      .select("id,check_in,check_out")
      .eq("room_id", input.roomId)
      .lt("check_in", input.checkOut)
      .gt("check_out", input.checkIn);

    if (overlap.error) {
      return NextResponse.json({ error: overlap.error.message }, { status: 500 });
    }
    if ((overlap.data ?? []).length > 0) {
      return NextResponse.json({ error: "이미 예약된 기간입니다." }, { status: 409 });
    }

    const inserted = await sb
      .from("reservations")
      .insert({
        room_id: input.roomId,
        room_name: room.name,
        building: room.building,
        check_in: input.checkIn,
        check_out: input.checkOut,
        nights: total.nights,
        guest_count: input.guests,
        meal_people: input.mealPeople,
        pickup_needed: input.pickupNeeded,
        arrival_time: input.pickupNeeded ? input.arrivalTime : null,
        ferry_name: input.pickupNeeded ? input.ferryName : null,
        customer_name: input.name,
        customer_phone: input.phone,
        total_amount: total.grandTotal,
        breakdown: total,
        form_data: input.formData ?? null
      })
      .select("id")
      .single();

    if (inserted.error) {
      return NextResponse.json({ error: inserted.error.message }, { status: 500 });
    }

    // mark inventory as sold for stay dates
    const upserts = stayDates.map((d) => ({
      room_id: input.roomId,
      date: d,
      status: "sold"
    }));
    const invUpsert = await sb
      .from("inventory")
      .upsert(upserts, { onConflict: "room_id,date" });
    if (invUpsert.error) {
      // non-fatal, but keep consistent response
      return NextResponse.json(
        { error: `예약은 저장됐으나 재고 반영에 실패했습니다: ${invUpsert.error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: inserted.data.id, total: total.grandTotal });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

