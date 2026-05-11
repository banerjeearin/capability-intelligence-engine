import { langsmithHeaders, startSpan, startTrace, endSpan } from '@/lib/observability/tracing';

export async function generateEmbeddings(texts: string[], parentTraceId?: string): Promise<number[][]> {
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required for embeddings.');
  }

  if (!texts.length) return [];

  const trace = parentTraceId ? { traceId: parentTraceId, spanId: 'parent', name: 'external', startTime: Date.now(), attributes: {} } as any : startTrace('embedding_request', { inputs: texts.length });
  const span = startSpan(trace, 'openai_embeddings', { model: 'text-embedding-3-small', input_count: texts.length });

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...langsmithHeaders(span)
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: texts
    })
  });

  if (!response.ok) {
    const details = await response.text();
    endSpan(span, { ok: false, error: details });
    throw new Error(`OpenAI embeddings request failed: ${details}`);
  }

  const payload = (await response.json()) as { data: Array<{ embedding: number[] }>; usage?: { prompt_tokens?: number; total_tokens?: number } };
  endSpan(span, { ok: true, usage: payload.usage ?? null });
    throw new Error(`OpenAI embeddings request failed: ${details}`);
  }

  const payload = (await response.json()) as { data: Array<{ embedding: number[] }> };
  return payload.data.map((item) => item.embedding);
}
