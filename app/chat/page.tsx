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
    if (!userId || !question.trim()) {
      setError('Please enter both user ID and a question.');
      return;
    }

    setError('');
    setIsLoading(true);
    const userMessage: ChatMessage = { role: 'user', content: question.trim() };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message: question, conversationId: conversationId || undefined })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Chat failed.');
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
      setQuestion('');
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : 'Unexpected chat error.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageShell title="Chat Over Evidence">
      <form onSubmit={onSubmit} className="app-section mb-6 grid gap-4">
        <div>
          <p className="eyebrow mb-2">Evidence copilot</p>
          <h2 className="text-xl font-semibold text-slate-950">Ask a grounded question</h2>
          <p className="mt-1 text-sm text-slate-600">Responses are intended to stay connected to uploaded evidence and citations.</p>
        </div>
        {conversationId ? <p className="status-note">Conversation: {conversationId}</p> : null}
        <input
          className="field-input"
          placeholder="User ID"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
        />
        <textarea
          className="field-textarea"
          placeholder="Ask a question about uploaded evidence..."
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <Button className="w-full sm:w-auto" type="submit" disabled={isLoading}>
          {isLoading ? 'Thinking...' : 'Ask'}
        </Button>
      </form>

      {error ? <p className="status-error mb-4">{error}</p> : null}

      <div className="space-y-3">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className="app-section">
            <p className="eyebrow mb-2">{message.role}</p>
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
    </PageShell>
  );
}
