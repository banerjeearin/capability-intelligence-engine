-- Phase 2: Database foundation for AI Enterprise Transformation Fit Engine
-- Enable pgvector for semantic search on document chunks.
create extension if not exists vector;

-- Profiles map to authenticated users.
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  role_title text,
  organization text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_name text,
  file_name text not null,
  file_path text not null,
  mime_type text,
  file_size_bytes bigint,
  status text not null default 'uploaded',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  unique(document_id, chunk_index)
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  status text not null default 'draft',
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assessment_scores (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  dimension text not null,
  score numeric(5,2) not null,
  rationale text,
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  report_json jsonb not null default '{}'::jsonb,
  pdf_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  assessment_id uuid references public.assessments(id) on delete set null,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant')),
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Indexes for common query paths.
create index if not exists idx_profiles_user_id on public.profiles(user_id);
create index if not exists idx_documents_user_id on public.documents(user_id);
create index if not exists idx_document_chunks_user_id on public.document_chunks(user_id);
create index if not exists idx_document_chunks_document_id on public.document_chunks(document_id);
create index if not exists idx_assessments_user_id on public.assessments(user_id);
create index if not exists idx_assessment_scores_assessment_id on public.assessment_scores(assessment_id);
create index if not exists idx_assessment_scores_user_id on public.assessment_scores(user_id);
create index if not exists idx_reports_assessment_id on public.reports(assessment_id);
create index if not exists idx_reports_user_id on public.reports(user_id);
create index if not exists idx_conversations_user_id on public.conversations(user_id);
create index if not exists idx_conversations_document_id on public.conversations(document_id);
create index if not exists idx_conversations_assessment_id on public.conversations(assessment_id);
create index if not exists idx_conversation_messages_conversation_id on public.conversation_messages(conversation_id);
create index if not exists idx_conversation_messages_user_id on public.conversation_messages(user_id);

-- Vector similarity index (ivfflat) for semantic retrieval.
create index if not exists idx_document_chunks_embedding_ivfflat
  on public.document_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
