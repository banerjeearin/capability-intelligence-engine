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


## Phase 8 :Retrieval Quality Optimization

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


## Phase 9: AI Evaluation Framework

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


## Phase 10 :Prompt Orchestration Framework

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


## Phase 11 :Conversation Memory System

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
## Phase 12 : Implement observability and AI tracing.

Goals:
- trace AI workflows
- debug retrieval
- monitor latency
- monitor token usage

Implement:
1. OpenTelemetry support
2. request tracing
3. retrieval logs
4. token usage tracking
5. latency tracking
6. AI workflow spans

Integrate:
- LangSmith-compatible tracing
- structured logs

Done when:
- every AI request is traceable
- retrieval pipeline is observable
- token usage metrics are visible

 ## Phase 13 — AI Guardrails & Safety
Implement AI guardrails and safety controls.

Goals:
- prevent hallucinations
- protect uploaded data
- enforce evidence grounding

Implement:
1. evidence-only response mode
2. unsafe prompt detection
3. hallucination suppression
4. confidence thresholds
5. citation enforcement
6. sensitive data filtering

Done when:
- unsupported claims are minimized
- responses clearly state uncertainty
- evidence grounding is enforced

### Phase 14 — Capability Graph Engine 
Implement capability graph engine.

Goals:
- model strategic capability relationships
- improve fit reasoning
- support advanced scoring

Create graph entities:
- skills
- projects
- industries
- outcomes
- technologies
- leadership traits
- architecture patterns

Implement:
1. graph schema
2. relationship engine
3. graph traversal
4. capability adjacency scoring
5. strategic inference layer

Done when:
- the system can reason across connected capabilities
- fit scoring uses graph relationships

### Phase 15 — Multi-Agent Orchestration
Implement multi-agent orchestration layer.

Agents:
1. Retrieval Agent
2. Assessment Agent
3. Evidence Agent
4. Scoring Agent
5. Reporting Agent

Goals:
- modular reasoning
- task specialization
- improved assessment quality

Implement:
- orchestration manager
- shared memory
- agent communication
- task routing

Done when:
- assessment workflow uses multiple agents
- outputs are aggregated coherently

### Phase 16 — Enterprise Authentication & RBAC
Implement enterprise-grade authentication and RBAC.

Goals:
- secure multi-user platform
- support organizations
- enforce access control

Implement:
1. organization support
2. role-based access control
3. admin roles
4. reviewer roles
5. assessment ownership
6. secure document access

Done when:
- organizations are isolated
- permissions are enforced
- document access is secured

### Phase 17 — Deployment Infrastructure
Implement production deployment infrastructure.

Goals:
- production readiness
- scalability
- observability
- CI/CD

Implement:
1. Docker setup
2. docker-compose
3. GitHub Actions CI/CD
4. Vercel deployment config
5. environment validation
6. production logging
7. health checks

Done when:
- application deploys cleanly
- CI/CD pipeline passes
- health endpoints are working

### Phase 18 — Executive Intelligence UI
Redesign the UI into an executive intelligence terminal.

Design goals:
- premium enterprise feel
- AI-native interaction
- strategic intelligence visualization

Implement:
1. dark minimalist UI
2. evidence cards
3. strategic fit dashboards
4. capability heatmaps
5. assessment timelines
6. confidence indicators
7. executive report viewer

Inspirations:
- Linear
- Vercel
- Perplexity
- Arc Browser

Done when:
- UI feels premium and executive-grade
- intelligence outputs are visually understandable

## README Update (May 11, 2026)

This README has been refreshed to make setup and operations clearer.

### Complete Environment Variables

Create `.env.local` from `.env.example` and set the following:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

### Recommended Local Dev Workflow

1. Install dependencies
   ```bash
   npm install
   ```
2. Start Supabase (if running local stack)
   ```bash
   supabase start
   ```
3. Apply database migrations
   ```bash
   supabase db push
   ```
4. Run Next.js app
   ```bash
   npm run dev
   ```
5. (Optional) Run eval suite before shipping prompt/retrieval changes
   ```bash
   npm run evals
   ```

### Production Readiness Checklist

- Verify all required env vars are set in deployment.
- Confirm `documents` storage bucket exists in Supabase.
- Run latest migrations before deploying API changes.
- Validate RAG chat returns citations and confidence metadata.
- Generate at least one report via `/reports` to verify end-to-end health.
