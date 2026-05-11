import { NextRequest, NextResponse } from 'next/server';
import { retrieveEvidence } from '@/lib/services/retrievalService';
import { formatCitations } from '@/lib/services/citationFormatter';
import { loadPrompt } from '@/lib/prompts/promptLoader';
import { composePrompt } from '@/lib/prompts/promptComposer';
import { injectContext } from '@/lib/prompts/contextInjector';

function getServerConfig() {
  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) {
    throw new Error('Missing OPENAI_API_KEY for chat route.');
  }
  return { openAiKey };
import { NextRequest } from 'next/server';
import { generateEmbeddings } from '@/lib/services/embeddingService';

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';

function getServerConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !serviceRoleKey || !openAiKey) {
    throw new Error('Missing required env vars for chat route.');
  }

  return { supabaseUrl, serviceRoleKey, openAiKey };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { userId?: string; message?: string; topK?: number; documentId?: string };
    const body = (await request.json()) as { userId?: string; message?: string; topK?: number };
    const userId = body.userId?.trim();
    const message = body.message?.trim();
    const topK = Math.min(Math.max(body.topK ?? 5, 1), 10);

    if (!userId || !message) {
      return NextResponse.json({ error: 'userId and message are required.' }, { status: 400 });
    }

    const { openAiKey } = getServerConfig();
    const retrieval = await retrieveEvidence(userId, message, { documentId: body.documentId?.trim() }, topK);
    const citations = formatCitations(retrieval.results);

    if (retrieval.confidence < 0.35 || !retrieval.results.length) {
      return NextResponse.json({
        answer: 'I do not have enough high-confidence evidence to answer reliably. Please upload more relevant documentation or refine your question.',
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
    const finalSystem = injectContext(baseSystem, [{ title: 'Mode', content: 'Evidence-grounded answering' }]);

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      return new Response(JSON.stringify({ error: 'userId and message are required.' }), { status: 400 });
    }

    const { supabaseUrl, serviceRoleKey, openAiKey } = getServerConfig();
    const [queryEmbedding] = await generateEmbeddings([message]);

    const searchResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/match_document_chunks`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_user_id: userId,
        query_embedding: queryEmbedding,
        match_count: topK
      })
    });

    if (!searchResponse.ok) {
      const details = await searchResponse.text();
      return new Response(JSON.stringify({ error: 'Vector search failed.', details }), { status: 500 });
    }

    const chunks = (await searchResponse.json()) as Array<{ content: string; similarity: number }>;
    const evidence = chunks
      .filter((chunk) => typeof chunk.content === 'string' && chunk.content.length > 0)
      .map((chunk, idx) => `[Evidence ${idx + 1} | similarity=${chunk.similarity.toFixed(3)}]\n${chunk.content}`)
      .join('\n\n');

    const systemPrompt =
      'You are an evidence-grounded assistant. Use only the provided evidence when possible. ' +
      'If evidence is insufficient, clearly say so and ask for additional documents or clarification. ' +
      'Do not fabricate facts.';

    const userPrompt = evidence
      ? `User question:\n${message}\n\nRetrieved evidence:\n${evidence}`
      : `User question:\n${message}\n\nNo retrieved evidence was found for this user.`;

    const openAiResponse = await fetch(OPENAI_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        temperature: 0.1,
        messages: [
          { role: 'system', content: finalSystem },
          { role: 'user', content: userComposed }
          {
            role: 'system',
            content:
              'Answer strictly using retrieved evidence. If evidence is missing for a claim, explicitly say evidence is insufficient. End with concise references.'
          },
          {
            role: 'user',
            content: `Question:\n${message}\n\nEvidence:\n${evidenceText}\n\nReferences:\n${citations.join('\n')}`
          }
        ]
      })
    });

    if (!aiRes.ok) {
      return NextResponse.json({ error: 'OpenAI chat failed.', details: await aiRes.text() }, { status: 500 });
    }

    const aiPayload = await aiRes.json();
    const answer = aiPayload.choices?.[0]?.message?.content ?? 'No response generated.';

    return NextResponse.json({
      answer,
      citations,
      confidence: retrieval.confidence,
      lowConfidence: false
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Chat request failed.', details: error instanceof Error ? error.message : 'Unknown error' },
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!openAiResponse.ok || !openAiResponse.body) {
      const details = await openAiResponse.text();
      return new Response(JSON.stringify({ error: 'OpenAI chat failed.', details }), { status: 500 });
    }

    return new Response(openAiResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Chat request failed.', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500 }
    );
  }
}
