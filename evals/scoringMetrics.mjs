export function retrievalPrecision(expectedKeywords, chunks) {
  const text = chunks.join(' ').toLowerCase();
  const hits = expectedKeywords.filter((keyword) => text.includes(keyword.toLowerCase())).length;
  return expectedKeywords.length ? hits / expectedKeywords.length : 0;
}

export function groundingScore(answer, evidence) {
  const answerTokens = new Set(answer.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  const evidenceTokens = new Set(evidence.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  let overlap = 0;
  answerTokens.forEach((token) => {
    if (evidenceTokens.has(token)) overlap += 1;
  });
  return answerTokens.size ? overlap / answerTokens.size : 0;
}

export function answerConsistency(answers) {
  if (answers.length < 2) return 1;
  const tokens = answers.map((a) => new Set(a.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)));
  const [first, second] = tokens;
  let overlap = 0;
  first.forEach((t) => {
    if (second.has(t)) overlap += 1;
  });
  return first.size ? overlap / first.size : 0;
}

export function hallucinationDetected(answer, evidence) {
  const insufficientSignals = ['insufficient', 'not enough evidence', 'cannot determine', 'no evidence', 'do not provide enough evidence'];
  const lowered = answer.toLowerCase();
  const evidenceEmpty = !evidence || evidence.trim().length === 0 || /no .*mentioned/i.test(evidence);
  if (!evidenceEmpty) return false;
  return !insufficientSignals.some((signal) => lowered.includes(signal));
}
