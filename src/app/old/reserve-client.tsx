"use client";

import "swiper/css";
import "swiper/css/pagination";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calcTotal, diffNights } from "@/lib/pricing";
import type { PolicyOptions, ReservationField, RoomInfo } from "@/lib/sheets";

type Props = {
  rooms: RoomInfo[];
  policy: PolicyOptions;
  fields: ReservationField[];
};

type FormValues = {
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  mealPeople: number;
  pickupNeeded: boolean;
  arrivalTime?: string;
  ferryName?: string;
  name: string;
  phone: string;
};

function currency(n: number) {
  return new Intl.NumberFormat("ko-KR").format(Math.round(n));
}

export default function ReserveClient({ rooms, policy, fields }: Props) {
  const buildings = useMemo(() => {
    const set = new Set<string>();
    for (const r of rooms) set.add(r.building || "미분류");
    return Array.from(set);
  }, [rooms]);

  const [selectedBuilding, setSelectedBuilding] = useState(buildings[0] ?? "미분류");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting }
  } = useForm<FormValues & Record<string, unknown>>({
    defaultValues: {
      guests: 2,
      mealPeople: 0,
      pickupNeeded: false
    }
  });

  const roomId = watch("roomId");
  const checkIn = watch("checkIn");
  const checkOut = watch("checkOut");
  const guests = watch("guests");
  const mealPeople = watch("mealPeople");
  const pickupNeeded = watch("pickupNeeded");

  const room = useMemo(() => rooms.find((r) => r.id === roomId) ?? null, [rooms, roomId]);

  useEffect(() => {
    // auto-select first room per building
    const inBuilding = rooms.filter((r) => (r.building || "미분류") === selectedBuilding);
    if (inBuilding.length > 0 && !roomId) {
      setValue("roomId", inBuilding[0].id, { shouldDirty: true });
    }
  }, [selectedBuilding, rooms, roomId, setValue]);

  const totals = useMemo(() => {
    return calcTotal({
      room,
      policy,
      checkInYmd: checkIn ?? "",
      checkOutYmd: checkOut ?? "",
      guests: Number(guests ?? 0),
      mealPeople: Number(mealPeople ?? 0)
    });
  }, [room, policy, checkIn, checkOut, guests, mealPeople]);

  const onSubmit = async (values: FormValues & Record<string, unknown>) => {
    // basic client-side guardrails
    const nights = diffNights(values.checkIn, values.checkOut);
    if (nights <= 0) {
      alert("체크아웃 날짜는 체크인 이후여야 합니다.");
      return;
    }
    if (!values.roomId) {
      alert("객실을 선택해주세요.");
      return;
    }
    if (values.pickupNeeded && (!values.arrivalTime || !values.ferryName)) {
      alert("픽업 필요 시 입도 시간/여객선 이름을 입력해주세요.");
      return;
    }

    const builtinKeys = new Set([
      "roomId",
      "checkIn",
      "checkOut",
      "guests",
      "mealPeople",
      "pickupNeeded",
      "arrivalTime",
      "ferryName",
      "name",
      "phone"
    ]);
    const raw = getValues();
    const formData: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (builtinKeys.has(k)) continue;
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        formData[k] = v;
      }
    }

    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...values,
        guests: Number(values.guests),
        mealPeople: Number(values.mealPeople),
        formData
      })
    });

    const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
    if (!res.ok) {
      alert(data.error ?? "예약에 실패했습니다.");
      return;
    }
    alert("예약이 완료되었습니다.");
    window.location.href = "/";
  };

  const roomsInSelected = rooms.filter((r) => (r.building || "미분류") === selectedBuilding);
  const extraFields = useMemo(() => {
    const builtin = new Set([
      "roomId",
      "checkIn",
      "checkOut",
      "guests",
      "mealPeople",
      "pickupNeeded",
      "arrivalTime",
      "ferryName",
      "name",
      "phone"
    ]);
    return fields.filter((f) => !builtin.has(f.key)).slice(0, 12);
  }, [fields]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-4">
        <Tabs value={selectedBuilding} onValueChange={setSelectedBuilding}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList className="h-auto flex-wrap">
              {buildings.map((b) => (
                <TabsTrigger key={b} value={b}>
                  {b}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="text-sm text-muted-foreground">
              {rooms.length}개 객실
            </div>
          </div>

          {buildings.map((b) => (
            <TabsContent key={b} value={b}>
              <div className="grid gap-4 sm:grid-cols-2">
                {rooms
                  .filter((r) => (r.building || "미분류") === b)
                  .map((r) => {
                    const active = r.id === roomId;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setValue("roomId", r.id, { shouldDirty: true })}
                        className={[
                          "rounded-2xl border bg-card p-4 text-left shadow-sm transition",
                          active ? "border-primary ring-2 ring-primary/30" : "hover:bg-accent"
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-base font-semibold">{r.name}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              기준 {r.basePeople}명 · 최대 {r.maxPeople}명
                            </div>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            평일 {currency(r.weekdayPrice)}원
                            <br />
                            주말 {currency(r.weekendPrice)}원
                          </div>
                        </div>

                        {r.photos.length > 0 ? (
                          <div className="mt-3 overflow-hidden rounded-xl border">
                            <Swiper
                              modules={[Pagination]}
                              pagination={{ clickable: true }}
                              spaceBetween={8}
                            >
                              {r.photos.slice(0, 8).map((url) => (
                                <SwiperSlide key={url}>
                                  <div className="relative aspect-[16/10] w-full bg-muted">
                                    <Image
                                      src={url}
                                      alt={`${r.name} 사진`}
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 640px) 90vw, 40vw"
                                    />
                                  </div>
                                </SwiperSlide>
                              ))}
                            </Swiper>
                          </div>
                        ) : (
                          <div className="mt-3 rounded-xl border bg-muted p-4 text-xs text-muted-foreground">
                            사진이 등록되지 않았습니다.
                          </div>
                        )}

                        {r.description ? (
                          <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                            {r.description}
                          </p>
                        ) : null}
                      </button>
                    );
                  })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      <aside className="space-y-4">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="space-y-1">
            <div className="text-base font-semibold">예약 정보</div>
            <div className="text-xs text-muted-foreground">
              Sold Out 날짜는 자동 차단됩니다.
            </div>
          </div>

          <form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="checkIn">체크인</Label>
              <Input id="checkIn" type="date" {...register("checkIn", { required: true })} />
              {errors.checkIn ? (
                <p className="text-xs text-destructive">체크인 날짜를 선택해주세요.</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkOut">체크아웃</Label>
              <Input id="checkOut" type="date" {...register("checkOut", { required: true })} />
              {errors.checkOut ? (
                <p className="text-xs text-destructive">체크아웃 날짜를 선택해주세요.</p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="guests">인원</Label>
                <Input
                  id="guests"
                  type="number"
                  min={1}
                  max={room?.maxPeople || 20}
                  {...register("guests", { required: true, valueAsNumber: true, min: 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mealPeople">식사 인원</Label>
                <Input
                  id="mealPeople"
                  type="number"
                  min={0}
                  {...register("mealPeople", { valueAsNumber: true, min: 0 })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border bg-background px-3 py-3">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">픽업 필요</div>
                <div className="text-xs text-muted-foreground">
                  선택 시 입도 정보 입력란이 노출됩니다.
                </div>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 accent-black"
                {...register("pickupNeeded")}
              />
            </div>

            {pickupNeeded ? (
              <div className="space-y-3 rounded-2xl border bg-muted/30 p-3">
                <div className="space-y-2">
                  <Label htmlFor="arrivalTime">입도 시간</Label>
                  <Input id="arrivalTime" placeholder="예: 14:30" {...register("arrivalTime")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ferryName">여객선 이름</Label>
                  <Input id="ferryName" placeholder="예: ○○호" {...register("ferryName")} />
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="name">성함</Label>
              <Input id="name" {...register("name", { required: true })} />
              {errors.name ? (
                <p className="text-xs text-destructive">성함을 입력해주세요.</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">연락처</Label>
              <Input id="phone" type="tel" {...register("phone", { required: true })} />
              {errors.phone ? (
                <p className="text-xs text-destructive">연락처를 입력해주세요.</p>
              ) : null}
            </div>

            {extraFields.length > 0 ? (
              <div className="space-y-3 rounded-2xl border bg-muted/20 p-3">
                <div className="text-sm font-semibold">추가 정보</div>
                {extraFields.map((f) => (
                  <div key={f.key} className="space-y-2">
                    <Label htmlFor={f.key}>
                      {f.label}
                      {f.required ? <span className="ml-1 text-xs text-destructive">*</span> : null}
                    </Label>
                    {f.type === "select" ? (
                      <select
                        id={f.key}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        defaultValue=""
                        {...register(f.key, { required: f.required })}
                      >
                        <option value="" disabled>
                          선택
                        </option>
                        {(f.options ?? []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : f.type === "checkbox" ? (
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" {...register(f.key)} />
                        <span className="text-muted-foreground">{f.placeholder ?? "선택"}</span>
                      </label>
                    ) : (
                      <Input
                        id={f.key}
                        type={f.type === "tel" ? "tel" : f.type === "number" ? "number" : "text"}
                        placeholder={f.placeholder}
                        {...register(f.key, {
                          required: f.required,
                          min: typeof f.min === "number" ? f.min : undefined,
                          max: typeof f.max === "number" ? f.max : undefined,
                          pattern: f.pattern ? new RegExp(f.pattern) : undefined
                        })}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="rounded-2xl border bg-background p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">숙박(박수)</span>
                <span className="font-medium">{totals.nights}박</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">객실가 합계</span>
                <span className="font-medium">{currency(totals.roomTotal)}원</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">추가 인원</span>
                <span className="font-medium">{currency(totals.extraTotal)}원</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">식사</span>
                <span className="font-medium">{currency(totals.mealTotal)}원</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <span className="text-sm font-semibold">총 결제 금액</span>
                <span className="text-lg font-semibold">
                  {currency(totals.grandTotal)}원
                </span>
              </div>
            </div>

            <Button className="w-full" type="submit" disabled={isSubmitting || roomsInSelected.length === 0}>
              {isSubmitting ? "예약 처리 중..." : "예약 완료"}
            </Button>
          </form>
        </div>

        <div className="rounded-2xl border bg-card p-5 text-xs text-muted-foreground">
          {policy.refundPolicyText ? (
            <div className="space-y-1">
              <div className="font-medium text-foreground">환불 정책</div>
              <p className="whitespace-pre-wrap">{policy.refundPolicyText}</p>
            </div>
          ) : null}
          {policy.pickupPolicyText ? (
            <div className="mt-4 space-y-1">
              <div className="font-medium text-foreground">픽업 안내</div>
              <p className="whitespace-pre-wrap">{policy.pickupPolicyText}</p>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

