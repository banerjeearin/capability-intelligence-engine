import { startTrace, startSpan, endSpan, structuredLog } from '@/lib/observability/tracing';
import { generateEmbeddings } from '@/lib/services/embeddingService';
import { rerankCandidates, RetrievalCandidate } from '@/lib/services/reranker';

interface RetrievalFilters {
  documentId?: string;
}

interface RetrievalResult {
  results: RetrievalCandidate[];
  confidence: number;
}

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  return { url, key };
}

export async function retrieveEvidence(userId: string, query: string, filters: RetrievalFilters = {}, topK = 5): Promise<RetrievalResult> {
  const trace = startTrace('retrieval_pipeline', { userId, topK });
  const root = startSpan(trace, 'retrieve_evidence', { query_length: query.length });
  const { url, key } = getConfig();
  const [embedding] = await generateEmbeddings([query]);

  const semanticSpan = startSpan(trace, 'semantic_search');
  const semanticRes = await fetch(`${url}/rest/v1/rpc/match_document_chunks`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_user_id: userId, query_embedding: embedding, match_count: topK * 3 })
  });
  if (!semanticRes.ok) {
    const err = await semanticRes.text();
    endSpan(semanticSpan, { ok: false, error: err });
    throw new Error(`Semantic retrieval failed: ${err}`);
  }
  endSpan(semanticSpan, { ok: true });
  const semanticRows = (await semanticRes.json()) as Array<{ id: string; document_id: string; chunk_index: number; content: string; similarity: number }>;

  const keywordQuery = new URLSearchParams({
    user_id: `eq.${userId}`,
    content: `ilike.*${query.split(' ').slice(0, 4).join(' ')}*`,
    select: 'id,document_id,chunk_index,content,metadata',
    limit: String(topK * 3)
  });
  if (filters.documentId) keywordQuery.append('document_id', `eq.${filters.documentId}`);

  const keywordSpan = startSpan(trace, 'keyword_search');
  const keywordRes = await fetch(`${url}/rest/v1/document_chunks?${keywordQuery.toString()}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  if (!keywordRes.ok) {
    const err = await keywordRes.text();
    endSpan(keywordSpan, { ok: false, error: err });
    throw new Error(`Keyword retrieval failed: ${err}`);
  }
  endSpan(keywordSpan, { ok: true });
  const keywordRows = (await keywordRes.json()) as Array<{ id: string; document_id: string; chunk_index: number; content: string; metadata: Record<string, unknown> }>;

  const byId = new Map<string, RetrievalCandidate>();
  for (const row of semanticRows) {
    byId.set(row.id, {
      id: row.id,
      document_id: row.document_id,
      chunk_index: row.chunk_index,
      content: row.content,
      semantic_score: row.similarity,
      keyword_score: 0
    });
  }
  for (const row of keywordRows) {
    const existing = byId.get(row.id);
    if (existing) {
      existing.keyword_score = 1;
      existing.metadata = row.metadata;
    } else {
      byId.set(row.id, {
        id: row.id,
        document_id: row.document_id,
        chunk_index: row.chunk_index,
        content: row.content,
        semantic_score: 0.3,
        keyword_score: 1,
        metadata: row.metadata
      });
    }
  }

  const filtered = [...byId.values()].filter((row) => (!filters.documentId || row.document_id === filters.documentId));
  const reranked = rerankCandidates(query, filtered).slice(0, topK);
  const confidence = reranked.length ? reranked.reduce((sum, row: any) => sum + row.combinedScore, 0) / reranked.length : 0;
  structuredLog('retrieval_metrics', { userId, topK, confidence, semantic_candidates: semanticRows.length, keyword_candidates: keywordRows.length, final_results: reranked.length });
  endSpan(root, { confidence, results: reranked.length });

  return { results: reranked, confidence };
}
