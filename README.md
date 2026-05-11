# AI Enterprise Transformation Fit Engine

Phase 1 foundation is built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui patterns.
Phase 2 adds Supabase database migration foundations, including pgvector.

## Local Setup
Phase 1 foundation built with Next.js, TypeScript, Tailwind CSS, shadcn/ui patterns, and Supabase client setup.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create environment file:
   ```bash
   cp .env.example .env.local
   ```
3. Fill in Supabase values in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Start the app:
   ```bash
   npm run dev
   ```

## Supabase Setup (Phase 2)

1. Create a Supabase project.
2. Install Supabase CLI and login:
   ```bash
   npm install -g supabase
   supabase login
   ```
3. Link your local repo to your Supabase project:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```
4. Apply migrations:
   ```bash
   supabase db push
   ```

Migration file added:
- `supabase/migrations/202605110001_phase2_database_foundation.sql`

This migration creates:
- `profiles`
- `documents`
- `document_chunks` (with `embedding vector(1536)`)
- `assessments`
- `assessment_scores`
- `reports`
- `conversations`
- `conversation_messages`

It also enables `pgvector` and adds indexes for:
- `user_id`
- `document_id`
- `assessment_id`
- vector similarity search on `document_chunks.embedding`

## Routes

- `/` Landing page
- `/dashboard` Dashboard
- `/upload` Upload workspace
- `/assessment` Assessment workspace
- `/chat` Chat workspace placeholder
- `/reports` Reports workspace

## Notes

- AI features are intentionally not implemented yet.


## Phase 3: Document Upload

- Upload page supports PDF, DOCX, TXT, and Markdown file selection.
- Server route `POST /api/upload` uploads files to Supabase Storage bucket `documents` and inserts metadata into `documents` table.
- Dashboard fetches uploaded documents via `GET /api/documents?userId=<uuid>` and displays status/metadata.
- Required server env var: `SUPABASE_SERVICE_ROLE_KEY`.


## Phase 4: RAG Ingestion

Added backend document processing route:
- `POST /api/process-document` with payload `{ userId, documentId }`

Processing flow:
1. Loads document metadata from `documents` table
2. Downloads uploaded file from Supabase Storage
3. Extracts text (`lib/services/textExtractor.ts`)
4. Chunks text (`lib/services/chunker.ts`)
5. Generates embeddings via OpenAI (`lib/services/embeddingService.ts`)
6. Stores chunks + embeddings in `document_chunks` (`lib/services/documentIngestionService.ts`)

Environment variables required for ingestion:
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`


## Phase 5: AI Chat Over Evidence

Added:
- Chat UI on `/chat` with streaming assistant responses
- `POST /api/chat` route
- Vector search via Supabase RPC `match_document_chunks`
- Evidence-grounded prompt policy (assistant should state when evidence is insufficient)

Additional migration:
- `supabase/migrations/202605110002_phase5_match_chunks_function.sql`

Run migrations again after pulling latest changes:
```bash
supabase db push
```
- AI features are intentionally not implemented in Phase 1.
- Supabase client is initialized in `lib/supabase.ts` and validates required environment variables.
