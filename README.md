# AI Enterprise Transformation Fit Engine

Phase 1 foundation is built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui patterns.
Phase 2 adds Supabase database migration foundations, including pgvector.

## Local Setup

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


## Phase 6: Dynamic Assessment Engine

Added:
- Dynamic assessment flow on `/assessment` covering:
  - Strategic thinking
  - Enterprise architecture
  - AI capability
  - Execution maturity
  - Leadership
  - Systems thinking
- Answer capture and submission to `POST /api/assessment/score`
- AI scoring using OpenAI
- Score persistence into `assessments` and `assessment_scores` tables
- Results page at `/assessment/results/[assessmentId]` with per-dimension and overall score


## Phase 7: Fit Report Generation

Added report generation and display on `/reports`:
- Executive summary
- Capability scores
- Evidence-backed strengths
- Risk areas
- Recommended role fit
- Final recommendation

API routes:
- `POST /api/reports/generate`
- `GET /api/reports?userId=<uuid>`
- `GET /api/reports/[reportId]/export` (PDF download endpoint)

Reports are stored in `reports` table (`report_json`).


## Retrieval Quality Optimization

Implemented retrieval-quality upgrades for RAG chat:
- Hybrid retrieval (semantic + keyword)
- Metadata filtering support (`documentId`)
- Reranking pipeline
- Chunk overlap optimization for ingestion
- Citation formatting support
- Retrieval confidence scoring with low-confidence fallback

New services:
- `lib/services/retrievalService.ts`
- `lib/services/reranker.ts`
- `lib/services/citationFormatter.ts`

Chat now returns:
- grounded answer
- citations
- confidence score
- low-confidence fallback when evidence is weak


## AI Evaluation Framework

Evaluation assets are in `evals/`:
- `datasets/golden_tests.json` (golden test dataset)
- `scoringMetrics.mjs` (retrieval precision, grounding score, answer consistency, hallucination rate)
- `run-evals.mjs` (evaluation runner)
- `reports/*.json` (generated evaluation reports)

Run locally:
```bash
npm run evals
```

This enables prompt regression benchmarking and local quality checks before prompt/retrieval changes ship.


## Prompt Orchestration Framework

Prompts are now externalized and versioned under `prompts/`:
- `prompts/system/`
- `prompts/assessment/`
- `prompts/chat/`
- `prompts/scoring/`
- `prompts/reporting/`

Core orchestration modules:
- `lib/prompts/promptLoader.ts` (versioned prompt loading)
- `lib/prompts/promptComposer.ts` (dynamic variable injection)
- `lib/prompts/contextInjector.ts` (context block composition)

Chat, assessment scoring, and report generation now consume shared prompt orchestration so prompt updates can ship independently of business logic.


## Conversation Memory System

Implemented memory-backed chat continuity with short-term + long-term memory:
- `lib/services/memoryService.ts`
  - short-term memory retrieval from `conversation_messages`
  - long-term strategic memory retrieval from `conversation_memories` using vector similarity
  - conversation summarization pipeline
  - strategic memory persistence with embeddings
- Chat route now persists and reuses `conversationId` context across sessions.

Database additions:
- `supabase/migrations/202605110003_conversation_memory.sql`
  - `conversation_memories` table
  - `match_conversation_memories` RPC
  - vector index for memory embeddings

Run migrations after pulling:
```bash
supabase db push
```


## Observability and AI Tracing

Implemented tracing and observability for AI workflows:
- Lightweight OpenTelemetry bootstrap hook via `instrumentation.ts` + `lib/observability/otel.ts`
- Structured tracing utilities in `lib/observability/tracing.ts`
- Request/phase spans for chat and retrieval pipeline
- Retrieval metrics logs (semantic candidates, keyword candidates, final results, confidence)
- Token usage capture from OpenAI responses (`usage`)
- Latency tracking via span duration logs
- LangSmith-compatible tracing headers (`x-langsmith-trace-id`, `x-langsmith-span-id`)

Outcome:
- every AI request is traceable
- retrieval pipeline is observable
- token usage + latency metrics are visible in logs


## AI Guardrails and Safety Controls

Implemented guardrails to reduce hallucinations and protect uploaded data:
- `lib/services/guardrailService.ts`
  - unsafe prompt detection
  - sensitive data filtering (PII redaction)
  - evidence-only fallback behavior
  - confidence threshold suppression
  - citation enforcement checks
- Chat route integrates guardrails before and after model generation
- Responses now clearly state uncertainty when evidence is insufficient

Outcome:
- unsupported claims are minimized
- uncertainty is explicit
- evidence grounding is enforced
