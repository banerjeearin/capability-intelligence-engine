'use client';

import { FormEvent, useState } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];
  confidence?: number;
}

function parseSseChunk(chunk: string): string {
  const lines = chunk.split('\n').filter((line) => line.startsWith('data: '));
  let out = '';

  for (const line of lines) {
    const data = line.replace(/^data: /, '').trim();
    if (!data || data === '[DONE]') continue;
    try {
      const payload = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
      out += payload.choices?.[0]?.delta?.content ?? '';
    } catch {
      // ignore non-json chunks
    }
  }

  return out;
}

export default function ChatPage() {
  const [userId, setUserId] = useState('');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || !question.trim()) {
      setError('Please enter both user ID and a question.');
      return;
    }

    setError('');
    setIsLoading(true);
    const userMessage: ChatMessage = { role: 'user', content: question.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setMessages((prev) => [...prev, userMessage, { role: 'assistant', content: '' }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message: question, conversationId: conversationId || undefined })
        body: JSON.stringify({ userId, message: question })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Chat request failed.');
      }

      if (payload.conversationId) setConversationId(payload.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: payload.answer,
          citations: payload.citations,
          confidence: payload.confidence
        }
      ]);
      if (!response.ok || !response.body) {
        const payload = await response.json();
        throw new Error(payload.error ?? 'Chat request failed.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const result = await reader.read();
        done = result.done;
        const chunkText = decoder.decode(result.value ?? new Uint8Array(), { stream: true });
        const delta = parseSseChunk(chunkText);
        if (delta) {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === 'assistant') {
              last.content += delta;
            }
            return next;
          });
        }
      }
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : 'Unexpected chat error.');
    } finally {
      setIsLoading(false);
      setQuestion('');
    }
  }

  return (
    <PageShell title="Chat Over Evidence">
      <form onSubmit={onSubmit} className="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
        {conversationId ? <p className="text-xs text-slate-500">Conversation: {conversationId}</p> : null}
        <input
          className="rounded-md border border-slate-300 px-3 py-2"
          placeholder="User ID"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
        />
        <textarea
          className="min-h-24 rounded-md border border-slate-300 px-3 py-2"
          placeholder="Ask a question about uploaded evidence..."
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Thinking...' : 'Ask'}</Button>
      </form>

      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      <div className="space-y-3">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className="rounded-md border border-slate-200 bg-white p-4">
            <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">{message.role}</p>
            <p className="whitespace-pre-wrap text-sm text-slate-800">{message.content}</p>
            {message.role === 'assistant' ? (
              <>
                <p className="mt-2 text-xs text-slate-500">Confidence: {((message.confidence ?? 0) * 100).toFixed(1)}%</p>
                <ul className="mt-1 list-disc pl-5 text-xs text-slate-600">
                  {(message.citations ?? []).map((citation) => (
                    <li key={citation}>{citation}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        ))}
      </div>
            <p className="whitespace-pre-wrap text-sm text-slate-800">{message.content || (message.role === 'assistant' ? '...' : '')}</p>
          </div>
        ))}
      </div>
import { PageShell } from '@/components/layout/page-shell';

export default function ChatPage() {
  return (
    <PageShell title="Chat">
      <p className="text-slate-600">Interact with evidence-aware assistant workflows (AI integration in later phases).</p>
    </PageShell>
  );
}
