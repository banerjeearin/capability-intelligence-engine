# Codex Task Plan

## Phase 1: Foundation
- Create Next.js app structure
- Add Tailwind CSS
- Add shadcn/ui
- Add Supabase client
- Add environment variable template

## Phase 2: Database
- Create SQL schema for users, documents, chunks, assessments, scores, reports
- Enable pgvector
- Add Supabase migration file

## Phase 3: Document Upload
- Build upload UI
- Upload files to Supabase Storage
- Store metadata in documents table

## Phase 4: RAG Pipeline
- Extract text from uploaded documents
- Chunk documents
- Generate embeddings
- Store embeddings in document_chunks

## Phase 5: AI Chat
- Build chat interface
- Retrieve relevant document chunks
- Send context to OpenAI
- Stream AI response

## Phase 6: Assessment Engine
- Build dynamic assessment flow
- Ask strategic questions
- Score answers across capability dimensions

## Phase 7: Fit Report
- Generate structured report
- Include scores, evidence, risks, recommendations
- Export as PDF
