# AI Enterprise Transformation Fit Engine

## Objective

Build an AI-native platform that assesses whether a person is a good fit for enterprise AI transformation, ERP modernization, procurement transformation, AI agent architecture, and digital operating model roles.

## Core Features

1. Landing page
2. User login
3. Document upload
4. Document ingestion
5. Embedding and vector search
6. AI chat over uploaded evidence
7. Dynamic assessment engine
8. Fit scoring
9. Evidence explorer
10. PDF report generation

## Tech Stack

- Frontend: Next.js + TypeScript
- Styling: Tailwind CSS + shadcn/ui
- Backend: Next.js API routes
- Database: Supabase Postgres
- Vector DB: pgvector
- Storage: Supabase Storage
- AI: OpenAI API
- Deployment: Vercel

## Main Pages

- `/` Landing page
- `/dashboard`
- `/upload`
- `/assessment`
- `/chat`
- `/reports`

## Main Database Tables

- users
- projects
- documents
- document_chunks
- assessments
- assessment_scores
- reports
- conversations
