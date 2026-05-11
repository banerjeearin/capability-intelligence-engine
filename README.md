# AI Enterprise Transformation Fit Engine

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

## Routes

- `/` Landing page
- `/dashboard` Dashboard
- `/upload` Upload workspace
- `/assessment` Assessment workspace
- `/chat` Chat workspace placeholder
- `/reports` Reports workspace

## Notes

- AI features are intentionally not implemented in Phase 1.
- Supabase client is initialized in `lib/supabase.ts` and validates required environment variables.
