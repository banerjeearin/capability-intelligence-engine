-- Capability graph engine schema
create table if not exists public.capability_nodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  node_type text not null check (node_type in ('skill','project','industry','outcome','technology','leadership_trait','architecture_pattern')),
  name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.capability_edges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  from_node_id uuid not null references public.capability_nodes(id) on delete cascade,
  to_node_id uuid not null references public.capability_nodes(id) on delete cascade,
  relation_type text not null,
  weight numeric(5,2) not null default 1.0,
  created_at timestamptz not null default now(),
  unique(from_node_id, to_node_id, relation_type)
);

create index if not exists idx_capability_nodes_user on public.capability_nodes(user_id);
create index if not exists idx_capability_nodes_type on public.capability_nodes(node_type);
create index if not exists idx_capability_edges_user on public.capability_edges(user_id);
create index if not exists idx_capability_edges_from on public.capability_edges(from_node_id);
create index if not exists idx_capability_edges_to on public.capability_edges(to_node_id);
