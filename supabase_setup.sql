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
