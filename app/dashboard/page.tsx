'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { DocumentRecord } from '@/types/document';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function DashboardPage() {
  const [userId, setUserId] = useState('');
  const [orgId, setOrgId] = useState('');
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadDocuments() {
      if (!userId || !orgId) {
        setDocuments([]);
        setError('');
        return;
      }

      if (!UUID_PATTERN.test(userId) || !UUID_PATTERN.test(orgId)) {
        setDocuments([]);
        setError('');
        return;
      }

      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/documents?userId=${encodeURIComponent(userId)}`, {
          headers: {
            'x-user-id': userId,
            'x-org-id': orgId
          }
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? 'Failed to load documents.');
        }
        setDocuments(payload.documents);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unexpected documents error.');
      } finally {
        setIsLoading(false);
      }
    }

    loadDocuments();
  }, [userId, orgId]);

  return (
    <PageShell title="Dashboard">
      <div className="mb-4 grid max-w-2xl gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium">User ID</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="Enter user UUID"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Organization ID</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="Enter organization UUID"
            value={orgId}
            onChange={(event) => setOrgId(event.target.value)}
          />
        </label>
      </div>

      {isLoading ? <p className="text-slate-600">Loading documents...</p> : null}
      {error ? <p className="mb-3 text-sm font-medium text-red-700">{error}</p> : null}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-100">
            <tr>
              <th className="px-4 py-3">File Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Size (bytes)</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-b last:border-0">
                <td className="px-4 py-3">{doc.file_name}</td>
                <td className="px-4 py-3">{doc.mime_type ?? 'unknown'}</td>
                <td className="px-4 py-3">{doc.file_size_bytes ?? 0}</td>
                <td className="px-4 py-3">{doc.status}</td>
                <td className="px-4 py-3">{new Date(doc.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {!documents.length && !isLoading ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={5}>
                  No documents found for this user.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
