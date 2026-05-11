'use client';

import { useMemo, useState } from 'react';
import { PageShell } from '@/components/layout/page-shell';

const heatmap = [
  ['Strategy', 86],
  ['Architecture', 78],
  ['AI Capability', 72],
  ['Execution', 81],
  ['Leadership', 88],
  ['Systems Thinking', 75]
];

const timeline = [
  { phase: 'Evidence Ingestion', status: 'Complete', date: '2026-05-10' },
  { phase: 'Capability Graph Build', status: 'Complete', date: '2026-05-11' },
  { phase: 'Executive Fit Scoring', status: 'In Progress', date: '2026-05-11' },
  { phase: 'Board-ready Briefing', status: 'Queued', date: '2026-05-12' }
];

export default function DashboardPage() {
  const [confidence] = useState(0.84);
  const fitClass = useMemo(() => (confidence > 0.75 ? 'text-emerald-300' : 'text-amber-300'), [confidence]);

  return (
    <PageShell title="Strategic Intelligence Overview">
      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="metric">
          <p className="text-xs uppercase text-slate-400">Overall Fit Confidence</p>
          <p className={`mt-2 text-3xl font-semibold ${fitClass}`}>{(confidence * 100).toFixed(1)}%</p>
        </div>
        <div className="metric">
          <p className="text-xs uppercase text-slate-400">Evidence Assets</p>
          <p className="mt-2 text-3xl font-semibold">42</p>
        </div>
        <div className="metric">
          <p className="text-xs uppercase text-slate-400">Active Risk Flags</p>
          <p className="mt-2 text-3xl font-semibold text-amber-300">3</p>
        </div>
        <div className="metric">
          <p className="text-xs uppercase text-slate-400">Org Alignment Index</p>
          <p className="mt-2 text-3xl font-semibold">8.6 / 10</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">Capability Heatmap</h2>
          <div className="space-y-3">
            {heatmap.map(([label, score]) => (
              <div key={label as string}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{label}</span>
                  <span>{score}%</span>
                </div>
                <div className="h-2 rounded bg-white/10">
                  <div className="h-2 rounded bg-gradient-to-r from-violet-400 to-cyan-400" style={{ width: `${score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">Assessment Timeline</h2>
          <div className="space-y-3">
            {timeline.map((item) => (
              <div key={item.phase} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{item.phase}</p>
                  <p className="text-xs text-slate-400">{item.date}</p>
                </div>
                <p className="text-sm text-slate-300">{item.status}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
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
import { PageShell } from '@/components/layout/page-shell';

export default function DashboardPage() {
  return (
    <PageShell title="Dashboard">
      <p className="text-slate-600">Track projects, assessments, and reporting progress in one place.</p>
    </PageShell>
  );
}
