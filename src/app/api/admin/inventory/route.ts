import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";

import { supabaseAdminLike } from "@/lib/supabase";

const Schema = z.object({
  roomId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["on", "off", "sold"])
});

function requireAdmin() {
  const authed = cookies().get("chujado_admin")?.value === "1";
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function POST(req: Request) {
  const guard = requireAdmin();
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const sb = supabaseAdminLike();
  const up = await sb
    .from("inventory")
    .upsert(
      { room_id: parsed.data.roomId, date: parsed.data.date, status: parsed.data.status },
      { onConflict: "room_id,date" }
    )
    .select("room_id,date,status")
    .single();

  if (up.error) {
    return NextResponse.json({ error: up.error.message }, { status: 500 });
  }
  return NextResponse.json({ item: up.data });
}

