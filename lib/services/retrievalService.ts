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
  const { url, key } = getConfig();
  const [embedding] = await generateEmbeddings([query]);

  const semanticRes = await fetch(`${url}/rest/v1/rpc/match_document_chunks`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_user_id: userId, query_embedding: embedding, match_count: topK * 3 })
  });
  if (!semanticRes.ok) throw new Error(`Semantic retrieval failed: ${await semanticRes.text()}`);
  const semanticRows = (await semanticRes.json()) as Array<{ id: string; document_id: string; chunk_index: number; content: string; similarity: number }>;

  const keywordQuery = new URLSearchParams({
    user_id: `eq.${userId}`,
    content: `ilike.*${query.split(' ').slice(0, 4).join(' ')}*`,
    select: 'id,document_id,chunk_index,content,metadata',
    limit: String(topK * 3)
  });
  if (filters.documentId) keywordQuery.append('document_id', `eq.${filters.documentId}`);

  const keywordRes = await fetch(`${url}/rest/v1/document_chunks?${keywordQuery.toString()}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  if (!keywordRes.ok) throw new Error(`Keyword retrieval failed: ${await keywordRes.text()}`);
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
  console.log(`[retrieval] userId=${userId} topK=${topK} confidence=${confidence.toFixed(3)} results=${reranked.length}`);

  return { results: reranked, confidence };
}
