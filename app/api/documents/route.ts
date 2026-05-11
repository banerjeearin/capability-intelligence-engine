import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireOrgRole } from '@/lib/auth/rbac';

function getSupabaseServerConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }

  return { url, serviceRoleKey };
}

export async function GET(request: NextRequest) {
  try {
    const { userId: authUserId, organizationId } = getAuthContext(request);
    await requireOrgRole(authUserId, organizationId, ['admin', 'reviewer', 'member']);

    const userId = request.nextUrl.searchParams.get('userId')?.trim();

    if (!userId || userId !== authUserId) {
      return NextResponse.json({ error: 'userId query param must match authenticated user.' }, { status: 400 });
    const userId = request.nextUrl.searchParams.get('userId')?.trim();

    if (!userId) {
      return NextResponse.json({ error: 'userId query param is required.' }, { status: 400 });
    }

    const { url, serviceRoleKey } = getSupabaseServerConfig();
    const query = new URLSearchParams({
      user_id: `eq.${userId}`,
      select: 'id,file_name,file_path,mime_type,file_size_bytes,status,created_at',
      order: 'created_at.desc',
      organization_id: `eq.${organizationId}`
      order: 'created_at.desc'
    });

    const response = await fetch(`${url}/rest/v1/documents?${query.toString()}`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`
      }
    });

    if (!response.ok) {
      const details = await response.text();
      return NextResponse.json({ error: 'Failed to load documents.', details }, { status: 500 });
    }

    const documents = await response.json();
    return NextResponse.json({ documents });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unexpected documents fetch error.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
