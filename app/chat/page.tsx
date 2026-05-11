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

export default function ChatPage() {
  const [userId, setUserId] = useState('');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [conversationId, setConversationId] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || !question.trim()) return;
    setIsLoading(true);
    setError('');

    setMessages((prev) => [...prev, { role: 'user', content: question.trim() }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message: question, conversationId: conversationId || undefined })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Chat failed.');
      if (payload.conversationId) setConversationId(payload.conversationId);
      setMessages((prev) => [...prev, { role: 'assistant', content: payload.answer, citations: payload.citations, confidence: payload.confidence }]);
      setQuestion('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageShell title="Executive Copilot">
      <form onSubmit={onSubmit} className="panel mb-6 grid gap-3 p-4">
        {conversationId ? <p className="text-xs text-slate-400">Session: {conversationId}</p> : null}
        <input className="rounded-md border border-white/10 bg-black/30 px-3 py-2" placeholder="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
        <textarea className="min-h-24 rounded-md border border-white/10 bg-black/30 px-3 py-2" placeholder="Ask strategic intelligence question..." value={question} onChange={(e) => setQuestion(e.target.value)} />
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Reasoning…' : 'Query Intelligence'}</Button>
      </form>

      {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}

      <div className="space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className="panel p-4">
            <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wider text-slate-400">
              <span>{msg.role}</span>
              {msg.role === 'assistant' ? <span>Confidence {(100 * (msg.confidence ?? 0)).toFixed(1)}%</span> : null}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-100">{msg.content}</p>
            {msg.citations?.length ? (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {msg.citations.map((c) => (
                  <div key={c} className="rounded-md border border-cyan-400/20 bg-cyan-500/5 p-2 text-xs text-cyan-100">{c}</div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </PageShell>
  );
}
