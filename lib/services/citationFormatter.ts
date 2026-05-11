import { RetrievalCandidate } from '@/lib/services/reranker';

export function formatCitations(items: RetrievalCandidate[]): string[] {
  return items.map((item, idx) => `[#${idx + 1}] doc=${item.document_id} chunk=${item.chunk_index} score=${(item.semantic_score).toFixed(3)}`);
}
