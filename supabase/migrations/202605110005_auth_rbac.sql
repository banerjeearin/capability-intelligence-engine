-- Enterprise auth & RBAC foundations
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','reviewer','member')),
  created_at timestamptz not null default now(),
  unique(organization_id, user_id)
);

alter table public.documents add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.assessments add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.reports add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

create index if not exists idx_org_memberships_org_user on public.organization_memberships(organization_id, user_id);
create index if not exists idx_documents_org on public.documents(organization_id);
create index if not exists idx_assessments_org on public.assessments(organization_id);
create index if not exists idx_reports_org on public.reports(organization_id);
