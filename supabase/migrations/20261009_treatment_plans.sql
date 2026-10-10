-- OnyxCeph treatment plans + passwordless patient links
-- Additive only: no existing table or column is changed or dropped.

create table if not exists public.treatment_plans (
  id                    uuid primary key default gen_random_uuid(),
  patient_id            uuid not null references public.patients(id) on delete cascade,
  viewer_url            text not null check (char_length(viewer_url) <= 2048),
  case_ref              text check (char_length(case_ref) <= 120),
  start_date            date,
  duration_months       numeric(4,1) check (duration_months is null or (duration_months > 0 and duration_months <= 60)),
  total_aligners        int check (total_aligners is null or (total_aligners between 1 and 200)),
  change_interval_days  int check (change_interval_days is null or (change_interval_days between 1 and 60)),
  est_completion_date   date,
  notes                 text check (char_length(notes) <= 4000),
  status                text not null default 'draft' check (status in ('draft','published','updated','revoked')),
  published_snapshot    jsonb,
  version               int not null default 0,
  created_by            uuid references auth.users(id),
  published_by          uuid references auth.users(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  published_at          timestamptz,
  revoked_at            timestamptz,
  constraint plan_dates_ok check (start_date is null or est_completion_date is null or est_completion_date > start_date)
);
-- one plan per patient (republish updates it; history lives in plan_versions)
create unique index if not exists treatment_plans_patient_key on public.treatment_plans(patient_id);

create table if not exists public.plan_access (
  id              uuid primary key default gen_random_uuid(),
  plan_id         uuid not null references public.treatment_plans(id) on delete cascade,
  token_hash      text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  expires_at      timestamptz,
  revoked_at      timestamptz,
  last_access_at  timestamptz
);
-- at most one active link per plan
create unique index if not exists plan_access_one_active on public.plan_access(plan_id) where revoked_at is null;

create table if not exists public.plan_versions (
  id            uuid primary key default gen_random_uuid(),
  plan_id       uuid not null references public.treatment_plans(id) on delete cascade,
  version       int not null,
  snapshot      jsonb not null,
  published_by  uuid references auth.users(id),
  published_at  timestamptz not null default now(),
  unique (plan_id, version)
);

create table if not exists public.plan_audit (
  id          bigserial primary key,
  plan_id     uuid references public.treatment_plans(id) on delete set null,
  action      text not null,
  actor       uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

-- Admins can read these from the admin portal; all writes and all patient
-- access go through server functions using the service role.
alter table public.treatment_plans enable row level security;
alter table public.plan_access     enable row level security;
alter table public.plan_versions   enable row level security;
alter table public.plan_audit      enable row level security;

drop policy if exists tp_admin_read on public.treatment_plans;
drop policy if exists pa_admin_read on public.plan_access;
drop policy if exists pv_admin_read on public.plan_versions;
drop policy if exists au_admin_read on public.plan_audit;
create policy tp_admin_read on public.treatment_plans for select using (public.is_admin());
create policy pa_admin_read on public.plan_access     for select using (public.is_admin());
create policy pv_admin_read on public.plan_versions   for select using (public.is_admin());
create policy au_admin_read on public.plan_audit      for select using (public.is_admin());

-- Before/After images taken from the lab's plan PDF (added same day)
alter table public.treatment_plans add column if not exists before_image text check (before_image is null or char_length(before_image) <= 200);
alter table public.treatment_plans add column if not exists after_image  text check (after_image  is null or char_length(after_image)  <= 200);
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('plan-images','plan-images',false,5242880,array['image/jpeg'])
on conflict (id) do nothing;
drop policy if exists plan_images_admin_insert on storage.objects;
drop policy if exists plan_images_admin_read on storage.objects;
create policy plan_images_admin_insert on storage.objects for insert to authenticated with check (bucket_id = 'plan-images' and public.is_admin());
create policy plan_images_admin_read on storage.objects for select to authenticated using (bucket_id = 'plan-images' and public.is_admin());

-- patient acceptance
alter table public.treatment_plans add column if not exists accepted_at timestamptz;
alter table public.treatment_plans add column if not exists accepted_version int;
