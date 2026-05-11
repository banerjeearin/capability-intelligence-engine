import { NextRequest, NextResponse } from 'next/server';
import { assessmentQuestions, AssessmentDimension } from '@/lib/assessment/questions';
import { loadPrompt } from '@/lib/prompts/promptLoader';
import { composePrompt } from '@/lib/prompts/promptComposer';

interface AnswerInput {
  questionId: string;
  answer: string;
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      title?: string;
      answers?: AnswerInput[];
    };

    const userId = body.userId?.trim();
    const title = body.title?.trim() || 'Transformation Fit Assessment';
    const answers = body.answers ?? [];

    if (!userId || answers.length !== assessmentQuestions.length) {
      return NextResponse.json({ error: 'userId and all assessment answers are required.' }, { status: 400 });
    }

    const { supabaseUrl, serviceRoleKey, openAiKey } = getServerConfig();

    const assessmentRes = await fetch(`${supabaseUrl}/rest/v1/assessments`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({ user_id: userId, title, status: 'completed' })
    });

    if (!assessmentRes.ok) {
      return NextResponse.json({ error: 'Failed to create assessment.', details: await assessmentRes.text() }, { status: 500 });
    }

    const [assessment] = await assessmentRes.json();

    const answerMap = new Map(answers.map((a) => [a.questionId, a.answer.trim()]));
    const scoreRows: Array<{ dimension: AssessmentDimension; score: number; rationale: string }> = [];

    for (const question of assessmentQuestions) {
      const answer = answerMap.get(question.id) ?? '';
      if (!answer) {
        return NextResponse.json({ error: `Missing answer for ${question.id}` }, { status: 400 });
      }

      const scoringTemplate = loadPrompt('scoring', 'score_answer', 'v1');
      const prompt = composePrompt(scoringTemplate, {
        dimension: question.dimension,
        question: question.prompt,
        answer
      });
      const prompt = `Score this answer from 1 to 10 for dimension ${question.dimension}. Return JSON: {"score": number, "rationale": string}.\nQuestion: ${question.prompt}\nAnswer: ${answer}`;
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
        return NextResponse.json({ error: 'AI scoring failed.', details: await aiRes.text() }, { status: 500 });
      }

      const aiPayload = await aiRes.json();
      const content = aiPayload.choices?.[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(content) as { score?: number; rationale?: string };
      const score = Math.max(1, Math.min(10, Number(parsed.score) || 1));

      scoreRows.push({
        dimension: question.dimension,
        score,
        rationale: parsed.rationale ?? 'No rationale provided.'
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

    return NextResponse.json({ assessmentId: assessment.id, scores: scoreRows });
  } catch (error) {
    return NextResponse.json(
      { error: 'Assessment scoring failed.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


export async function GET(request: NextRequest) {
  try {
    const assessmentId = request.nextUrl.searchParams.get('assessmentId')?.trim();
    if (!assessmentId) {
      return NextResponse.json({ error: 'assessmentId is required.' }, { status: 400 });
    }

    const { supabaseUrl, serviceRoleKey } = getServerConfig();
    const query = new URLSearchParams({
      assessment_id: `eq.${assessmentId}`,
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
