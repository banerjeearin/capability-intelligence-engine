'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { demoDocuments, demoOrgId, demoUserId } from '@/lib/demoData';
import { DocumentRecord } from '@/types/document';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function DashboardPage() {
  const [userId, setUserId] = useState('');
  const [orgId, setOrgId] = useState('');
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    async function loadDocuments() {
      if (isDemoMode) {
        return;
      }

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
  }, [userId, orgId, isDemoMode]);

  function loadSyntheticData() {
    setUserId(demoUserId);
    setOrgId(demoOrgId);
    setDocuments(demoDocuments);
    setError('');
    setIsDemoMode(true);
  }

  return (
    <PageShell title="Dashboard">
      <section className="app-section mb-6">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="eyebrow mb-2">Document intelligence</p>
            <h2 className="text-xl font-semibold text-slate-950">Evidence library</h2>
            <p className="mt-1 text-sm text-slate-600">Review uploaded artifacts for a specific user and organization scope.</p>
          </div>
          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {documents.length} documents{isDemoMode ? ' · synthetic' : ''}
            </div>
            <Button className="w-full md:w-auto" type="button" variant="outline" onClick={loadSyntheticData}>
              Load Synthetic Data
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="field-label">User ID</span>
            <input
              className="field-input"
              placeholder="Enter user UUID"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="field-label">Organization ID</span>
            <input
              className="field-input"
              placeholder="Enter organization UUID"
              value={orgId}
              onChange={(event) => setOrgId(event.target.value)}
            />
          </label>
        </div>
      </section>

      {isLoading ? <p className="status-note mb-4">Loading documents...</p> : null}
      {error ? <p className="status-error mb-4">{error}</p> : null}

      <div className="app-card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Type</th>
              <th>Size (bytes)</th>
              <th>Status</th>
              <th>Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td className="font-medium text-slate-950">{doc.file_name}</td>
                <td>{doc.mime_type ?? 'unknown'}</td>
                <td>{doc.file_size_bytes ?? 0}</td>
                <td>{doc.status}</td>
                <td>{new Date(doc.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {!documents.length && !isLoading ? (
              <tr>
                <td className="px-4 py-8 text-slate-500" colSpan={5}>
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
