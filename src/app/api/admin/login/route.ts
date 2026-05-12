import { NextResponse } from "next/server";
import { z } from "zod";

const Schema = z.object({
  password: z.string().min(1)
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "비밀번호를 입력해주세요." }, { status: 400 });
  }

  const expected = process.env.ADMIN_PASSWORD || "5942";
  if (parsed.data.password !== expected) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("chujado_admin", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  return res;
}

