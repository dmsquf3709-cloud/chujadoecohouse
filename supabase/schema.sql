-- 추자도 에코하우스 예약 시스템 (MVP) 스키마
-- Supabase SQL Editor에서 실행하세요.

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  room_id text not null,
  building text,
  room_name text,

  check_in date not null,
  check_out date not null,
  nights int not null,

  guest_count int not null,
  meal_people int not null default 0,

  pickup_needed boolean not null default false,
  arrival_time text,
  ferry_name text,

  customer_name text not null,
  customer_phone text not null,

  total_amount numeric not null,
  breakdown jsonb,
  form_data jsonb
);

create index if not exists reservations_room_idx on public.reservations(room_id);
create index if not exists reservations_created_at_idx on public.reservations(created_at desc);

-- 재고 관리: 날짜 × 객실 상태
-- status:
--  on   = 판매 가능
--  off  = 수동 마감
--  sold = 예약 완료(자동)
create table if not exists public.inventory (
  room_id text not null,
  date date not null,
  status text not null check (status in ('on','off','sold')),
  updated_at timestamptz not null default now(),
  primary key (room_id, date)
);

create index if not exists inventory_date_idx on public.inventory(date);

-- 최소 동작을 위한(데모) RLS: 프로젝트 상황에 맞게 강화 권장
alter table public.reservations enable row level security;
alter table public.inventory enable row level security;

-- 익명키 기반 insert/select 허용 (관리자 페이지도 anon 사용을 전제로 함)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='reservations' and policyname='anon_read_write_reservations'
  ) then
    create policy anon_read_write_reservations on public.reservations
      for all
      to anon
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='inventory' and policyname='anon_read_write_inventory'
  ) then
    create policy anon_read_write_inventory on public.inventory
      for all
      to anon
      using (true)
      with check (true);
  end if;
end $$;

