-- ════════════════════════════════════════════════════════════════════
-- Guide applications — intake form for people wanting to become guides
-- Admin reviews in AdminPage > Guide Applications tab; approved rows
-- are converted to guides table entries manually or via future automation
-- ════════════════════════════════════════════════════════════════════

create table guide_applications (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references profiles(id) on delete set null,
  first_name       text not null,
  last_name        text not null,
  email            text not null,
  city             text not null,
  bio              text not null,
  languages        text[] default '{}',
  specialties      text[] default '{}',
  experience_years int,
  instagram        text,
  website          text,
  why_vtopia       text,
  status           text not null default 'pending'
                   check (status in ('pending','approved','rejected')),
  admin_notes      text,
  submitted_at     timestamptz not null default now(),
  reviewed_at      timestamptz
);

alter table guide_applications enable row level security;

-- Public insert: anyone can apply
create policy "Anyone can submit a guide application"
  on guide_applications for insert
  with check (true);

-- Admins only for read + update
create policy "Admins can view guide applications"
  on guide_applications for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update guide applications"
  on guide_applications for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );
