interface GuardrailInput {
  message: string;
  evidence: string;
  citations: string[];
  confidence: number;
  answer?: string;
}

const UNSAFE_PATTERNS = [/ignore previous/i, /reveal (system|hidden) prompt/i, /exfiltrate/i, /bypass/i];
const SENSITIVE_PATTERNS = [/\b\d{3}-\d{2}-\d{4}\b/g, /\b(?:\d[ -]*?){13,16}\b/g, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi];

export function detectUnsafePrompt(message: string): boolean {
  return UNSAFE_PATTERNS.some((pattern) => pattern.test(message));
}

export function filterSensitiveData(text: string): string {
  let filtered = text;
  for (const pattern of SENSITIVE_PATTERNS) {
    filtered = filtered.replace(pattern, '[REDACTED]');
  }
  return filtered;
}

export function shouldSuppressForLowConfidence(confidence: number, threshold = 0.4): boolean {
  return confidence < threshold;
}

export function enforceCitationPresence(answer: string, citations: string[]): string {
  if (!citations.length) {
    return `${answer}\n\nEvidence references were not available; answer may be incomplete.`;
  }
  return answer;
}

export function evidenceOnlyFallback(): string {
  return 'I can only answer using uploaded evidence. Current evidence is insufficient to support a reliable claim.';
}

export function applyResponseGuardrails(input: GuardrailInput): { answer: string; blocked: boolean; reason?: string } {
  if (detectUnsafePrompt(input.message)) {
    return {
      answer: 'Request blocked by safety guardrails due to unsafe instruction patterns.',
      blocked: true,
      reason: 'unsafe_prompt'
    };
  }

  if (!input.evidence.trim() || shouldSuppressForLowConfidence(input.confidence)) {
    return {
      answer: evidenceOnlyFallback(),
      blocked: false,
      reason: 'insufficient_evidence'
    };
  }

  const safeAnswer = enforceCitationPresence(filterSensitiveData(input.answer ?? ''), input.citations);
  return { answer: safeAnswer, blocked: false };
}
