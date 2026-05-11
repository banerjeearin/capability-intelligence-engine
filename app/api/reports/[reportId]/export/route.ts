import { NextRequest, NextResponse } from 'next/server';

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  return { url, key };
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const { url, key } = getConfig();
    const { reportId } = await params;

    const query = new URLSearchParams({ id: `eq.${reportId}`, select: 'title,report_json', limit: '1' });
    const response = await fetch(`${url}/rest/v1/reports?${query.toString()}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to load report export.', details: await response.text() }, { status: 500 });
    }

    const [report] = await response.json();
    if (!report) return NextResponse.json({ error: 'Report not found.' }, { status: 404 });

    const text = `# ${report.title}\n\n${JSON.stringify(report.report_json, null, 2)}`;
    return new NextResponse(text, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="report-${reportId}.pdf"`
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Export failed.', details: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
  }
}
