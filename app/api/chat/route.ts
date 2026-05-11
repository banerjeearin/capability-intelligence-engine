import { NextRequest, NextResponse } from 'next/server';
import { retrieveEvidence } from '@/lib/services/retrievalService';
import { formatCitations } from '@/lib/services/citationFormatter';

function getServerConfig() {
  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) {
    throw new Error('Missing OPENAI_API_KEY for chat route.');
  }
  return { openAiKey };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { userId?: string; message?: string; topK?: number; documentId?: string };
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

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        temperature: 0.1,
        messages: [
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
      { status: 500 }
    );
  }
}
