-- Supabase SQL Editor에서 실행하세요 (Project > SQL Editor > New query)

create table if not exists signups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text not null,
  message text,
  created_at timestamptz not null default now()
);

alter table signups enable row level security;

-- 익명 사용자가 새 신청서를 '추가'만 할 수 있도록 허용 (조회/수정/삭제는 불가)
create policy "Allow anonymous insert"
  on signups
  for insert
  to anon
  with check (true);

create table if not exists suggestions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  content text not null,
  author text not null,
  anonymous boolean not null default false,
  status text not null default '회의 예정',
  created_at timestamptz not null default now()
);

alter table suggestions enable row level security;

create policy "Allow anonymous insert suggestions"
  on suggestions
  for insert
  to anon
  with check (true);

create policy "Allow anonymous read suggestions"
  on suggestions
  for select
  to anon
  using (true);

-- 토스페이먼츠 회비 결제 기록 (Edge Function이 service role로만 기록)
create table if not exists payments (
  order_id text primary key,
  payment_key text not null unique,
  order_name text,
  amount integer not null,
  method text,
  status text not null,
  approved_at timestamptz,
  raw jsonb,
  created_at timestamptz not null default now()
);

alter table payments enable row level security;
-- anon 정책 없음: 결제 내역(개인정보)은 공개 페이지에서 조회/수정 불가.
-- 운영진은 Supabase 대시보드(Table Editor)에서 확인하세요.
