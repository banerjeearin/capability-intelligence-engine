-- Phase: conversation memory
create table if not exists public.conversation_memories (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  memory_type text not null check (memory_type in ('summary', 'strategic')),
  content text not null,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_conversation_memories_conversation_id on public.conversation_memories(conversation_id);
create index if not exists idx_conversation_memories_user_id on public.conversation_memories(user_id);
create index if not exists idx_conversation_memories_embedding_ivfflat
  on public.conversation_memories using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);

create or replace function public.match_conversation_memories(
  p_user_id uuid,
  p_conversation_id uuid,
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  id uuid,
  memory_type text,
  content text,
  similarity float
)
language sql
as $$
  select
    cm.id,
    cm.memory_type,
    cm.content,
    1 - (cm.embedding <=> query_embedding) as similarity
  from public.conversation_memories cm
  where cm.user_id = p_user_id
    and cm.conversation_id = p_conversation_id
    and cm.embedding is not null
  order by cm.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;
