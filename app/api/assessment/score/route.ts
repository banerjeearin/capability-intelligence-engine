import { NextRequest, NextResponse } from 'next/server';
import { assessmentQuestions, AssessmentDimension } from '@/lib/assessment/questions';
import { loadPrompt } from '@/lib/prompts/promptLoader';
import { composePrompt } from '@/lib/prompts/promptComposer';
import { OrchestrationManager } from '@/lib/agents/orchestrationManager';
import { getAuthContext, requireOrgRole, assertResourceInOrg } from '@/lib/auth/rbac';
import { buildAssessmentAgents } from '@/lib/agents/assessmentAgents';
import {
  inferStrategicFit,
  loadCapabilityGraph,
  mapAnswersToSeedNodes,
  scoreCapabilityAdjacency,
  traverseCapabilities
} from '@/lib/services/capabilityGraphService';

interface AnswerInput {
  questionId: string;
  answer: string;
}

interface AgentScore {
  dimension?: string;
  score?: number;
  rationale?: string;
}

function getServerConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !serviceRoleKey || !openAiKey) {
    throw new Error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY');
  }

  return { supabaseUrl, serviceRoleKey, openAiKey };
}

async function scoreWithModel(openAiKey: string, dimension: AssessmentDimension, question: string, answer: string) {
  const scoringTemplate = loadPrompt('scoring', 'score_answer', 'v1');
  const prompt = composePrompt(scoringTemplate, { dimension, question, answer });
  const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are an enterprise AI transformation assessor.' },
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!aiRes.ok) {
    throw new Error(`AI scoring failed: ${await aiRes.text()}`);
  }

  const aiPayload = await aiRes.json();
  const content = aiPayload.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content) as { score?: number; rationale?: string };
  return {
    score: Math.max(1, Math.min(10, Number(parsed.score) || 1)),
    rationale: parsed.rationale ?? 'No rationale provided.'
  };
}

export async function POST(request: NextRequest) {
  try {
    const { userId: authUserId, organizationId } = getAuthContext(request);
    await requireOrgRole(authUserId, organizationId, ['admin', 'reviewer', 'member']);

    const body = (await request.json()) as {
      userId?: string;
      title?: string;
      answers?: AnswerInput[];
    };

    const userId = body.userId?.trim();
    const title = body.title?.trim() || 'Transformation Fit Assessment';
    const answers = body.answers ?? [];

    if (!userId || userId !== authUserId || answers.length !== assessmentQuestions.length) {
      return NextResponse.json({ error: 'userId and all assessment answers are required.' }, { status: 400 });
    }

    const { supabaseUrl, serviceRoleKey, openAiKey } = getServerConfig();
    const graph = await loadCapabilityGraph(userId);
    const orchestrator = new OrchestrationManager(buildAssessmentAgents());
    const agentInput = {
      userId,
      answers: assessmentQuestions.map((q) => ({
        questionId: q.id,
        dimension: q.dimension,
        prompt: q.prompt,
        answer: (answers.find((a) => a.questionId === q.id)?.answer ?? '').trim()
      }))
    };
    const orchestration = await orchestrator.execute(agentInput);

    const assessmentRes = await fetch(`${supabaseUrl}/rest/v1/assessments`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({ user_id: userId, organization_id: organizationId, title, status: 'completed' })
    });

    if (!assessmentRes.ok) {
      return NextResponse.json({ error: 'Failed to create assessment.', details: await assessmentRes.text() }, { status: 500 });
    }

    const [assessment] = await assessmentRes.json();
    const answerMap = new Map(answers.map((a) => [a.questionId, a.answer.trim()]));
    const scoreRows: Array<{ dimension: AssessmentDimension; score: number; rationale: string }> = [];
    const scoringAgentOutput = (orchestration.outputs.find((o) => o.name === 'scoring_agent')?.data ?? {}) as {
      scores?: AgentScore[];
    };
    const agentScores = Array.isArray(scoringAgentOutput.scores) ? scoringAgentOutput.scores : [];
    const agentScoreMap = new Map(agentScores.map((s) => [s.dimension, s]));

    for (const question of assessmentQuestions) {
      const answer = answerMap.get(question.id) ?? '';
      if (!answer) {
        return NextResponse.json({ error: `Missing answer for ${question.id}` }, { status: 400 });
      }

      const agentScore = agentScoreMap.get(question.dimension);
      const base = agentScore
        ? {
            score: Math.max(1, Math.min(10, Number(agentScore.score) || 1)),
            rationale: agentScore.rationale ?? 'No rationale provided.'
          }
        : await scoreWithModel(openAiKey, question.dimension, question.prompt, answer);

      const seedNodes = mapAnswersToSeedNodes(answer, graph.nodes);
      const traversed = traverseCapabilities(seedNodes, graph.edges, 2);
      const adjacencyScore = scoreCapabilityAdjacency(seedNodes, traversed, graph.edges);
      const graphBoost = Math.min(1.5, adjacencyScore * 0.2);
      const score = Math.max(1, Math.min(10, Number((base.score + graphBoost).toFixed(2))));
      const inferences = inferStrategicFit(traversed, graph.nodes).slice(0, 3);

      scoreRows.push({
        dimension: question.dimension,
        score,
        rationale: `${base.rationale} Graph inference: ${inferences.join('; ') || 'none'}.`
      });
    }

    const insertRows = scoreRows.map((row) => ({
      assessment_id: assessment.id,
      user_id: userId,
      dimension: row.dimension,
      score: row.score,
      rationale: row.rationale,
      evidence: []
    }));

    const scoresRes = await fetch(`${supabaseUrl}/rest/v1/assessment_scores`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(insertRows)
    });

    if (!scoresRes.ok) {
      return NextResponse.json({ error: 'Failed to store assessment scores.', details: await scoresRes.text() }, { status: 500 });
    }

    return NextResponse.json({
      assessmentId: assessment.id,
      scores: scoreRows,
      orchestration: {
        agents: orchestration.outputs.map((o) => o.name),
        communication_events: orchestration.memory.messages.length
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Assessment scoring failed.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId: authUserId, organizationId } = getAuthContext(request);
    await requireOrgRole(authUserId, organizationId, ['admin', 'reviewer', 'member']);

    const assessmentId = request.nextUrl.searchParams.get('assessmentId')?.trim();
    if (!assessmentId) {
      return NextResponse.json({ error: 'assessmentId is required.' }, { status: 400 });
    }

    await assertResourceInOrg('assessments', assessmentId, organizationId);

    const { supabaseUrl, serviceRoleKey } = getServerConfig();
    const query = new URLSearchParams({
      assessment_id: `eq.${assessmentId}`,
      user_id: `eq.${authUserId}`,
      select: 'dimension,score,rationale',
      order: 'dimension.asc'
    });

    const response = await fetch(`${supabaseUrl}/rest/v1/assessment_scores?${query.toString()}`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch scores.', details: await response.text() }, { status: 500 });
    }

    const scores = await response.json();
    return NextResponse.json({ scores });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load assessment results.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
