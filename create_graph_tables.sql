-- Nodes table
create table chantier_nodes (
  id uuid default gen_random_uuid() primary key,
  chantier_id uuid references chantiers(id) on delete cascade not null,
  type text default 'step', -- start, step, end
  label text default 'Nouvelle étape',
  status text default 'pending', -- pending, done
  position_x float default 100.0,
  position_y float default 100.0,
  created_at timestamp with time zone default now()
);

-- Edges table
create table chantier_edges (
  id uuid default gen_random_uuid() primary key,
  chantier_id uuid references chantiers(id) on delete cascade not null,
  source uuid references chantier_nodes(id) on delete cascade not null,
  target uuid references chantier_nodes(id) on delete cascade not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table chantier_nodes enable row level security;
alter table chantier_edges enable row level security;

-- Policies (Simplified: if you can see the chantier, you can see/edit nodes)
create policy "Manage nodes" on chantier_nodes
  for all using (
    exists (select 1 from chantiers where id = chantier_nodes.chantier_id)
  ) with check (
    exists (select 1 from chantiers where id = chantier_nodes.chantier_id)
  );

create policy "Manage edges" on chantier_edges
  for all using (
    exists (select 1 from chantiers where id = chantier_edges.chantier_id)
  ) with check (
    exists (select 1 from chantiers where id = chantier_edges.chantier_id)
  );
