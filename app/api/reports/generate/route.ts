import { NextRequest, NextResponse } from 'next/server';

function getServerConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;
  if (!supabaseUrl || !serviceRoleKey || !openAiKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or OPENAI_API_KEY.');
  }
  return { supabaseUrl, serviceRoleKey, openAiKey };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { userId?: string; assessmentId?: string; title?: string };
    const userId = body.userId?.trim();
    const assessmentId = body.assessmentId?.trim();
    const title = body.title?.trim() || 'Transformation Fit Report';

    if (!userId || !assessmentId) {
      return NextResponse.json({ error: 'userId and assessmentId are required.' }, { status: 400 });
    }

    const { supabaseUrl, serviceRoleKey, openAiKey } = getServerConfig();

    const scoreQuery = new URLSearchParams({
      assessment_id: `eq.${assessmentId}`,
      user_id: `eq.${userId}`,
      select: 'dimension,score,rationale',
      order: 'score.desc'
    });

    const scoreRes = await fetch(`${supabaseUrl}/rest/v1/assessment_scores?${scoreQuery.toString()}`, {
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` }
    });

    if (!scoreRes.ok) {
      return NextResponse.json({ error: 'Failed to load scores.', details: await scoreRes.text() }, { status: 500 });
    }

    const scores = await scoreRes.json();
    if (!scores.length) {
      return NextResponse.json({ error: 'No assessment scores found.' }, { status: 404 });
    }

    const prompt = `Generate a JSON report with keys: executive_summary, capability_scores, strengths, risk_areas, recommended_role_fit, final_recommendation.\nScores: ${JSON.stringify(scores)}`;
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You generate enterprise transformation fit reports grounded in score evidence. Include strengths, risk areas, and clear recommendation.'
          },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!aiRes.ok) {
      return NextResponse.json({ error: 'Report generation failed.', details: await aiRes.text() }, { status: 500 });
    }

    const aiPayload = await aiRes.json();
    const reportJson = JSON.parse(aiPayload.choices?.[0]?.message?.content ?? '{}');
    const reportInsert = {
      assessment_id: assessmentId,
      user_id: userId,
      title,
      report_json: {
        ...reportJson,
        capability_scores: scores
      }
    };

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/reports`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(reportInsert)
    });

    if (!insertRes.ok) {
      return NextResponse.json({ error: 'Failed to store report.', details: await insertRes.text() }, { status: 500 });
    }

    const [report] = await insertRes.json();
    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unexpected report generation error.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
