import { NextRequest } from 'next/server';

export type OrgRole = 'admin' | 'reviewer' | 'member';

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return { url, key };
}

export function getAuthContext(request: NextRequest): { userId: string; organizationId: string } {
  const userId = request.headers.get('x-user-id')?.trim() ?? '';
  const organizationId = request.headers.get('x-org-id')?.trim() ?? '';
  if (!userId || !organizationId) {
    throw new Error('Missing x-user-id or x-org-id auth headers.');
  }
  return { userId, organizationId };
}

export async function requireOrgRole(userId: string, organizationId: string, allowedRoles: OrgRole[]): Promise<OrgRole> {
  const { url, key } = getConfig();
  const query = new URLSearchParams({
    user_id: `eq.${userId}`,
    organization_id: `eq.${organizationId}`,
    select: 'role',
    limit: '1'
  });

  const res = await fetch(`${url}/rest/v1/organization_memberships?${query.toString()}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });

  if (!res.ok) throw new Error(`Role lookup failed: ${await res.text()}`);
  const [membership] = await res.json();
  const role = membership?.role as OrgRole | undefined;
  if (!role || !allowedRoles.includes(role)) {
    throw new Error('Insufficient permissions for this organization resource.');
  }
  return role;
}

export async function assertResourceInOrg(table: 'documents' | 'assessments' | 'reports', resourceId: string, organizationId: string) {
  const { url, key } = getConfig();
  const query = new URLSearchParams({ id: `eq.${resourceId}`, organization_id: `eq.${organizationId}`, select: 'id', limit: '1' });
  const res = await fetch(`${url}/rest/v1/${table}?${query.toString()}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  if (!res.ok) throw new Error(`Resource authorization check failed: ${await res.text()}`);
  const rows = await res.json();
  if (!rows.length) throw new Error('Resource not found in caller organization scope.');
}
