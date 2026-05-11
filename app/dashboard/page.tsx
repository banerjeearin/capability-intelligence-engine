'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { DocumentRecord } from '@/types/document';

export default function DashboardPage() {
  const [userId, setUserId] = useState('');
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadDocuments() {
      if (!userId) {
        setDocuments([]);
        return;
      }

      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/documents?userId=${encodeURIComponent(userId)}`);
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
  }, [userId]);

  return (
    <PageShell title="Dashboard">
      <div className="mb-4 max-w-md">
        <label className="block">
          <span className="mb-2 block text-sm font-medium">User ID</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="Enter user UUID to view uploads"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
          />
        </label>
      </div>

      {isLoading ? <p className="text-slate-600">Loading documents...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

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
