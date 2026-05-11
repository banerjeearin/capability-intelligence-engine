import { Agent, AgentInput, AgentOutput, SharedMemory } from '@/lib/agents/types';
import { retrieveEvidence } from '@/lib/services/retrievalService';
import { generateEmbeddings } from '@/lib/services/embeddingService';

async function chatJson(system: string, user: string): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY missing for agent reasoning.');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
    })
  });
  if (!res.ok) throw new Error(`Agent model call failed: ${await res.text()}`);
  const payload = await res.json();
  return JSON.parse(payload.choices?.[0]?.message?.content ?? '{}');
}

export const RetrievalAgent: Agent = {
  name: 'retrieval_agent',
  async run(input: AgentInput): Promise<AgentOutput> {
    const joined = input.answers.map((a) => a.answer).join('\n');
    const retrieval = await retrieveEvidence(input.userId, joined, {}, 8);
    return { name: 'retrieval_agent', data: { evidence: retrieval.results, confidence: retrieval.confidence } };
  }
};

export const EvidenceAgent: Agent = {
  name: 'evidence_agent',
  async run(_: AgentInput, memory: SharedMemory): Promise<AgentOutput> {
    const evidence = ((memory.context.retrieval_agent as any)?.evidence ?? []) as Array<{ content: string }>;
    const snippets = evidence.map((e) => e.content).slice(0, 8);
    return { name: 'evidence_agent', data: { snippets, count: snippets.length } };
  }
};

export const AssessmentAgent: Agent = {
  name: 'assessment_agent',
  async run(input: AgentInput, memory: SharedMemory): Promise<AgentOutput> {
    const snippets = (memory.context.evidence_agent as any)?.snippets ?? [];
    const analysis = await chatJson(
      'You are an enterprise assessment analyst. Return JSON with per_dimension observations.',
      JSON.stringify({ answers: input.answers, evidence: snippets })
    );
    return { name: 'assessment_agent', data: analysis };
  }
};

export const ScoringAgent: Agent = {
  name: 'scoring_agent',
  async run(input: AgentInput, memory: SharedMemory): Promise<AgentOutput> {
    const assessment = memory.context.assessment_agent;
    const scoring = await chatJson(
      'You are a scoring engine. Return JSON array scores [{dimension,score,rationale}] from 1-10.',
      JSON.stringify({ answers: input.answers, assessment })
    );
    return { name: 'scoring_agent', data: scoring };
  }
};

export const ReportingAgent: Agent = {
  name: 'reporting_agent',
  async run(_: AgentInput, memory: SharedMemory): Promise<AgentOutput> {
    const report = await chatJson(
      'You are a report synthesizer. Return JSON with executive_summary, strengths, risks, recommendation.',
      JSON.stringify({
        retrieval: memory.context.retrieval_agent,
        assessment: memory.context.assessment_agent,
        scoring: memory.context.scoring_agent
      })
    );
    return { name: 'reporting_agent', data: report };
  }
};

export function buildAssessmentAgents(): Agent[] {
  return [RetrievalAgent, EvidenceAgent, AssessmentAgent, ScoringAgent, ReportingAgent];
}
