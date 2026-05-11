import { NextRequest, NextResponse } from 'next/server';

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  return { url, key };
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')?.trim();
    if (!userId) return NextResponse.json({ error: 'userId is required.' }, { status: 400 });

    const { url, key } = getConfig();
    const query = new URLSearchParams({
      user_id: `eq.${userId}`,
      select: 'id,title,assessment_id,report_json,created_at',
      order: 'created_at.desc'
    });

    const response = await fetch(`${url}/rest/v1/reports?${query.toString()}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch reports.', details: await response.text() }, { status: 500 });
    }

    return NextResponse.json({ reports: await response.json() });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected reports fetch error.', details: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
  }
}
