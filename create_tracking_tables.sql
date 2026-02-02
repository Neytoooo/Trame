-- Create table for tracking updates
create type update_type as enum ('note', 'etape', 'incident', 'photo');

create table chantier_updates (
  id uuid default gen_random_uuid() primary key,
  chantier_id uuid references chantiers(id) on delete cascade not null,
  type text not null default 'note', -- using text for flexibility or enum above
  title text,
  description text,
  image_url text, -- optional for photo updates
  date timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  created_by uuid references auth.users(id)
);

-- RLS Policies
alter table chantier_updates enable row level security;

create policy "Users can view updates for their chantiers"
  on chantier_updates for select
  using (
    exists (
      select 1 from chantiers
      where chantiers.id = chantier_updates.chantier_id
    )
  );

create policy "Users can insert updates for their chantiers"
  on chantier_updates for insert
  with check (
    exists (
      select 1 from chantiers
      where chantiers.id = chantier_updates.chantier_id
    )
  );
