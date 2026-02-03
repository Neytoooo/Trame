create table if not exists chantier_logs (
  id uuid default gen_random_uuid() primary key,
  chantier_id uuid references chantiers(id) on delete cascade not null,
  node_id uuid references chantier_nodes(id) on delete set null,
  level text check (level in ('info', 'error', 'warning')) default 'info',
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table chantier_logs enable row level security;

create policy "Users can view logs for their chantiers"
  on chantier_logs for select
  using (
    exists (
      select 1 from chantiers
      where chantiers.id = chantier_logs.chantier_id
    )
  );

create policy "Users can insert logs for their chantiers"
  on chantier_logs for insert
  with check (
    exists (
      select 1 from chantiers
      where chantiers.id = chantier_logs.chantier_id
    )
  );
