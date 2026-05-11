import { NextRequest, NextResponse } from 'next/server';
import { retrieveEvidence } from '@/lib/services/retrievalService';
import { formatCitations } from '@/lib/services/citationFormatter';
import { loadPrompt } from '@/lib/prompts/promptLoader';
import { composePrompt } from '@/lib/prompts/promptComposer';
import { injectContext } from '@/lib/prompts/contextInjector';
import { startTrace, startSpan, endSpan, langsmithHeaders, structuredLog } from '@/lib/observability/tracing';
import { applyResponseGuardrails, detectUnsafePrompt, filterSensitiveData } from '@/lib/services/guardrailService';
import {
  appendConversationMessage,
  createConversation,
  getConversationMemoryContext,
  summarizeConversation,
  upsertStrategicMemory
} from '@/lib/services/memoryService';

function getServerConfig() {
  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) {
    throw new Error('Missing OPENAI_API_KEY for chat route.');
  }
  return { openAiKey };
}

export async function POST(request: NextRequest) {
  try {
    const trace = startTrace('chat_request');
    const body = (await request.json()) as { userId?: string; message?: string; topK?: number; documentId?: string; conversationId?: string };
    const userId = body.userId?.trim();
    const message = filterSensitiveData(body.message?.trim() ?? '');
    const topK = Math.min(Math.max(body.topK ?? 5, 1), 10);

    if (!userId || !message) {
      structuredLog('chat_metrics', { traceId: trace.traceId, reason: 'missing_input' });
      endSpan(trace, { success: false, reason: 'missing_input' });
      return NextResponse.json({ error: 'userId and message are required.' }, { status: 400 });
    }


    if (detectUnsafePrompt(message)) {
      structuredLog('chat_guardrail', { traceId: trace.traceId, blocked: true, reason: 'unsafe_prompt' });
      endSpan(trace, { success: false, blocked: true, reason: 'unsafe_prompt' });
      return NextResponse.json({
        answer: 'Request blocked by safety guardrails due to unsafe instruction patterns.',
        citations: [],
        confidence: 0,
        lowConfidence: true,
        blocked: true
      }, { status: 400 });
    }

    const { openAiKey } = getServerConfig();
    const conversationId = body.conversationId?.trim() || (await createConversation(userId));

    await appendConversationMessage(conversationId, userId, 'user', message);

    const memoryContext = await getConversationMemoryContext(conversationId, userId, message);
    const retrievalSpan = startSpan(trace, 'retrieval_phase');
    const retrieval = await retrieveEvidence(userId, message, { documentId: body.documentId?.trim() }, topK);
    endSpan(retrievalSpan, { confidence: retrieval.confidence, results: retrieval.results.length });
    const citations = formatCitations(retrieval.results);

    if (retrieval.confidence < 0.35 || !retrieval.results.length) {
      const guarded = applyResponseGuardrails({
        message,
        evidence: retrieval.results.map((r) => r.content).join('\n'),
        citations,
        confidence: retrieval.confidence
      });
      structuredLog('chat_metrics', { traceId: trace.traceId, confidence: retrieval.confidence, citations: citations.length, lowConfidence: true, guardrail: guarded.reason });
      endSpan(trace, { success: true, lowConfidence: true, guardrail: guarded.reason });

      return NextResponse.json({
        answer: guarded.answer,
        citations,
        confidence: retrieval.confidence,
        lowConfidence: true
      });
    }

    const evidenceText = retrieval.results
      .map((item, idx) => `[Evidence ${idx + 1}] ${item.content}`)
      .join('\n\n');

    const baseSystem = loadPrompt('system', 'base', 'v1');
    const chatTemplate = loadPrompt('chat', 'answer_with_evidence', 'v1');
    const userComposed = composePrompt(chatTemplate, {
      question: message,
      evidence: evidenceText,
      citations: citations.join('\n'),
      confidence: retrieval.confidence.toFixed(3)
    });
    const shortTerm = memoryContext.shortTermMessages
      .slice()
      .reverse()
      .map((m) => `${m.role}: ${m.message}`)
      .join('\n');
    const longTerm = memoryContext.longTermMemories
      .map((m) => `[${m.memory_type}|${Number(m.similarity).toFixed(2)}] ${m.content}`)
      .join('\n');

    const finalSystem = injectContext(baseSystem, [
      { title: 'Mode', content: 'Evidence-grounded answering' },
      { title: 'Short-term memory', content: shortTerm },
      { title: 'Long-term strategic memory', content: longTerm }
    ]);

    const aiSpan = startSpan(trace, 'openai_chat_completion', { model: 'gpt-4.1-mini' });
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
        ...langsmithHeaders(aiSpan)
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        temperature: 0.1,
        messages: [
          { role: 'system', content: finalSystem },
          { role: 'user', content: userComposed }
        ]
      })
    });

    if (!aiRes.ok) {
      const details = await aiRes.text();
      endSpan(aiSpan, { ok: false, error: details });
      structuredLog('chat_metrics', { traceId: trace.traceId, confidence: retrieval.confidence, citations: citations.length, lowConfidence: true });
      endSpan(trace, { success: true, lowConfidence: true });

    return NextResponse.json({ error: 'OpenAI chat failed.', details }, { status: 500 });
    }

    const aiPayload = await aiRes.json();
    endSpan(aiSpan, { ok: true, usage: aiPayload.usage ?? null });
    const rawAnswer = aiPayload.choices?.[0]?.message?.content ?? 'No response generated.';
    const guarded = applyResponseGuardrails({
      message,
      evidence: evidenceText,
      citations,
      confidence: retrieval.confidence,
      answer: rawAnswer
    });
    const answer = guarded.answer;

    await appendConversationMessage(conversationId, userId, 'assistant', answer);

    const summary = await summarizeConversation(conversationId, userId);
    await upsertStrategicMemory(conversationId, userId, summary, 'summary');

    structuredLog('chat_metrics', { traceId: trace.traceId, confidence: retrieval.confidence, citations: citations.length });
    endSpan(trace, { success: true });

    return NextResponse.json({
      answer,
      citations,
      confidence: retrieval.confidence,
      lowConfidence: false,
      conversationId
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Chat request failed.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
