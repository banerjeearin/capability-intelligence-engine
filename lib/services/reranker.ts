export interface RetrievalCandidate {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  semantic_score: number;
  keyword_score: number;
  combinedScore?: number;
  metadata?: Record<string, unknown>;
}

function tokenSet(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
}

export function rerankCandidates(query: string, candidates: RetrievalCandidate[]): RetrievalCandidate[] {
  const queryTokens = tokenSet(query);

  return [...candidates]
    .map((candidate) => {
      const candidateTokens = tokenSet(candidate.content);
      let overlap = 0;
      queryTokens.forEach((token) => {
        if (candidateTokens.has(token)) overlap += 1;
      });
      const lexicalScore = queryTokens.size ? overlap / queryTokens.size : 0;
      const combinedScore = candidate.semantic_score * 0.6 + candidate.keyword_score * 0.2 + lexicalScore * 0.2;
      return { ...candidate, combinedScore };
    })
    .sort((a, b) => (b.combinedScore ?? 0) - (a.combinedScore ?? 0));
}
