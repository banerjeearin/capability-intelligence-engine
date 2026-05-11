'use client';

import { FormEvent, useState } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';

interface ReportRow {
  id: string;
  title: string;
  assessment_id: string;
  created_at: string;
  report_json: any;
  report_json: {
    executive_summary?: string;
    capability_scores?: Array<{ dimension: string; score: number; rationale: string }>;
    strengths?: string[];
    risk_areas?: string[];
    recommended_role_fit?: string;
    final_recommendation?: string;
  };
}

export default function ReportsPage() {
  const [userId, setUserId] = useState('');
  const [assessmentId, setAssessmentId] = useState('');
  const [reports, setReports] = useState<ReportRow[]>([]);

  async function loadReports() {
    const response = await fetch(`/api/reports?userId=${encodeURIComponent(userId)}`);
    const payload = await response.json();
    if (response.ok) setReports(payload.reports);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadReports() {
    if (!userId) return;
    const response = await fetch(`/api/reports?userId=${encodeURIComponent(userId)}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? 'Failed to fetch reports.');
    setReports(payload.reports);
  }

  async function generateReport(event: FormEvent) {
    event.preventDefault();
    const response = await fetch('/api/reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, assessmentId })
    });
    const payload = await response.json();
    if (response.ok) setReports((prev) => [payload.report, ...prev]);
  }

  return (
    <PageShell title="Executive Briefing Viewer">
      <form onSubmit={generateReport} className="panel mb-6 grid gap-3 p-4">
        <input className="rounded-md border border-white/10 bg-black/30 px-3 py-2" placeholder="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
        <input className="rounded-md border border-white/10 bg-black/30 px-3 py-2" placeholder="Assessment ID" value={assessmentId} onChange={(e) => setAssessmentId(e.target.value)} />
        <div className="flex gap-2">
          <Button type="submit">Generate Briefing</Button>
          <Button type="button" variant="outline" onClick={loadReports}>Load Briefings</Button>
        </div>
      </form>

      <div className="space-y-4">
        {reports.map((report) => (
          <article key={report.id} className="panel p-5">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">{report.title}</h2>
                <p className="text-xs text-slate-400">{new Date(report.created_at).toLocaleString()}</p>
              </div>
              <a className="text-sm text-cyan-300 underline" href={`/api/reports/${report.id}/export`}>Export PDF</a>
            </div>
            <p className="mb-3 text-sm text-slate-200">{report.report_json?.executive_summary}</p>
            <div className="grid gap-4 lg:grid-cols-3">
              <section className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                <h3 className="mb-2 text-xs uppercase tracking-wider text-emerald-200">Strengths</h3>
                <ul className="list-disc pl-4 text-sm">{(report.report_json?.strengths ?? []).map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
              </section>
              <section className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <h3 className="mb-2 text-xs uppercase tracking-wider text-amber-200">Risk Areas</h3>
                <ul className="list-disc pl-4 text-sm">{(report.report_json?.risk_areas ?? []).map((r: string, i: number) => <li key={i}>{r}</li>)}</ul>
              </section>
              <section className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
                <h3 className="mb-2 text-xs uppercase tracking-wider text-violet-200">Role Fit</h3>
                <p className="text-sm">{report.report_json?.recommended_role_fit}</p>
                <p className="mt-2 text-sm text-slate-300">{report.report_json?.final_recommendation}</p>
              </section>
            </div>
          </article>
        ))}
      </div>
    if (!userId || !assessmentId) {
      setError('Please provide user ID and assessment ID.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, assessmentId })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Report generation failed.');
      setReports((prev) => [payload.report, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected report error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell title="Reports">
      <form onSubmit={generateReport} className="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <input className="rounded-md border px-3 py-2" placeholder="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
        <input className="rounded-md border px-3 py-2" placeholder="Assessment ID" value={assessmentId} onChange={(e) => setAssessmentId(e.target.value)} />
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>{loading ? 'Generating...' : 'Generate Report'}</Button>
          <Button type="button" variant="outline" onClick={loadReports}>Load Reports</Button>
        </div>
      </form>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      <div className="space-y-4">
        {reports.map((report) => (
          <div key={report.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="font-semibold">{report.title}</p>
                <p className="text-xs text-slate-500">{new Date(report.created_at).toLocaleString()}</p>
              </div>
              <a className="text-sm text-blue-600 underline" href={`/api/reports/${report.id}/export`}>
                Export PDF
              </a>
            </div>
            <p className="mb-2 text-sm"><strong>Executive Summary:</strong> {report.report_json?.executive_summary ?? 'N/A'}</p>
            <p className="mb-2 text-sm"><strong>Recommended Role Fit:</strong> {report.report_json?.recommended_role_fit ?? 'N/A'}</p>
            <p className="mb-2 text-sm"><strong>Final Recommendation:</strong> {report.report_json?.final_recommendation ?? 'N/A'}</p>
            <div className="text-sm">
              <p className="font-medium">Capability Scores</p>
              <ul className="ml-5 list-disc">
                {(report.report_json?.capability_scores ?? []).map((score) => (
                  <li key={score.dimension}>{score.dimension}: {score.score}/10</li>
                ))}
              </ul>
            </div>
            <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
              <div>
                <p className="font-medium">Strengths</p>
                <ul className="ml-5 list-disc">{(report.report_json?.strengths ?? []).map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
              <div>
                <p className="font-medium">Risk Areas</p>
                <ul className="ml-5 list-disc">{(report.report_json?.risk_areas ?? []).map((r, i) => <li key={i}>{r}</li>)}</ul>
              </div>
            </div>
          </div>
        ))}
        {!reports.length ? <p className="text-sm text-slate-500">No reports yet.</p> : null}
      </div>
import { PageShell } from '@/components/layout/page-shell';

export default function ReportsPage() {
  return (
    <PageShell title="Reports">
      <p className="text-slate-600">Generate and review transformation fit reports and recommendations.</p>
    </PageShell>
  );
}
