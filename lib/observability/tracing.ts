import crypto from 'crypto';

export interface SpanContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  attributes: Record<string, unknown>;
}

function randomId(bytes: number): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function startTrace(name: string, attributes: Record<string, unknown> = {}): SpanContext {
  const ctx: SpanContext = {
    traceId: randomId(16),
    spanId: randomId(8),
    name,
    startTime: Date.now(),
    attributes
  };
  structuredLog('trace_start', { ...ctx, timestamp: new Date().toISOString() });
  return ctx;
}

export function startSpan(parent: SpanContext, name: string, attributes: Record<string, unknown> = {}): SpanContext {
  const ctx: SpanContext = {
    traceId: parent.traceId,
    spanId: randomId(8),
    parentSpanId: parent.spanId,
    name,
    startTime: Date.now(),
    attributes
  };
  structuredLog('span_start', { ...ctx, timestamp: new Date().toISOString() });
  return ctx;
}

export function endSpan(ctx: SpanContext, extra: Record<string, unknown> = {}) {
  const durationMs = Date.now() - ctx.startTime;
  structuredLog('span_end', {
    traceId: ctx.traceId,
    spanId: ctx.spanId,
    parentSpanId: ctx.parentSpanId,
    name: ctx.name,
    durationMs,
    attributes: { ...ctx.attributes, ...extra },
    timestamp: new Date().toISOString()
  });
}

export function structuredLog(event: string, payload: Record<string, unknown>) {
  console.log(JSON.stringify({ event, ...payload }));
}

export function langsmithHeaders(trace: SpanContext): Record<string, string> {
  return {
    'x-langsmith-trace-id': trace.traceId,
    'x-langsmith-span-id': trace.spanId
  };
}
