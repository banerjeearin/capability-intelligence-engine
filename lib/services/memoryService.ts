import { generateEmbeddings } from '@/lib/services/embeddingService';

interface MemoryContext {
  conversationId: string;
  userId: string;
  shortTermMessages: Array<{ role: string; message: string }>;
  longTermMemories: Array<{ content: string; similarity: number; memory_type: string }>;
}

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;
  if (!url || !key || !openAiKey) throw new Error('Missing required memory service env vars.');
  return { url, key, openAiKey };
}

export async function createConversation(userId: string, title = 'Strategic Conversation'): Promise<string> {
  const { url, key } = getConfig();
  const res = await fetch(`${url}/rest/v1/conversations`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ user_id: userId, title })
  });
  if (!res.ok) throw new Error(`Failed to create conversation: ${await res.text()}`);
  const [row] = await res.json();
  return row.id;
}

export async function appendConversationMessage(conversationId: string, userId: string, role: 'user' | 'assistant' | 'system', message: string) {
  const { url, key } = getConfig();
  const res = await fetch(`${url}/rest/v1/conversation_messages`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation_id: conversationId, user_id: userId, role, message })
  });
  if (!res.ok) throw new Error(`Failed to append message: ${await res.text()}`);
}

export async function summarizeConversation(conversationId: string, userId: string): Promise<string> {
  const { url, key, openAiKey } = getConfig();
  const query = new URLSearchParams({
    conversation_id: `eq.${conversationId}`,
    user_id: `eq.${userId}`,
    select: 'role,message,created_at',
    order: 'created_at.desc',
    limit: '20'
  });
  const res = await fetch(`${url}/rest/v1/conversation_messages?${query.toString()}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`Failed loading messages for summary: ${await res.text()}`);
  const msgs = await res.json();
  const transcript = msgs.reverse().map((m: any) => `${m.role}: ${m.message}`).join('\n');

  const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${openAiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      temperature: 0.1,
      messages: [
        { role: 'system', content: 'Summarize strategic context, constraints, decisions, and open risks in <= 180 words.' },
        { role: 'user', content: transcript }
      ]
    })
  });
  if (!aiRes.ok) throw new Error(`Failed generating summary: ${await aiRes.text()}`);
  const payload = await aiRes.json();
  return payload.choices?.[0]?.message?.content ?? 'No summary generated.';
}

export async function upsertStrategicMemory(conversationId: string, userId: string, content: string, memoryType: 'summary' | 'strategic' = 'summary') {
  const { url, key } = getConfig();
  const [embedding] = await generateEmbeddings([content]);
  const res = await fetch(`${url}/rest/v1/conversation_memories`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation_id: conversationId, user_id: userId, memory_type: memoryType, content, embedding })
  });
  if (!res.ok) throw new Error(`Failed storing memory: ${await res.text()}`);
}

export async function getConversationMemoryContext(conversationId: string, userId: string, queryText: string): Promise<MemoryContext> {
  const { url, key } = getConfig();
  const msgQuery = new URLSearchParams({
    conversation_id: `eq.${conversationId}`,
    user_id: `eq.${userId}`,
    select: 'role,message,created_at',
    order: 'created_at.desc',
    limit: '8'
  });
  const shortTermRes = await fetch(`${url}/rest/v1/conversation_messages?${msgQuery.toString()}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  if (!shortTermRes.ok) throw new Error(`Failed loading short-term memory: ${await shortTermRes.text()}`);
  const shortTermMessages = await shortTermRes.json();

  const [queryEmbedding] = await generateEmbeddings([queryText]);
  const longTermRes = await fetch(`${url}/rest/v1/rpc/match_conversation_memories`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      p_user_id: userId,
      p_conversation_id: conversationId,
      query_embedding: queryEmbedding,
      match_count: 5
    })
  });
  if (!longTermRes.ok) throw new Error(`Failed loading long-term memory: ${await longTermRes.text()}`);
  const longTermMemories = await longTermRes.json();

  return { conversationId, userId, shortTermMessages, longTermMemories };
}
