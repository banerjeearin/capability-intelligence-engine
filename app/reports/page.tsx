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
}

export default function ReportsPage() {
  const [userId, setUserId] = useState('');
  const [assessmentId, setAssessmentId] = useState('');
  const [reports, setReports] = useState<ReportRow[]>([]);

  async function loadReports() {
    const response = await fetch(`/api/reports?userId=${encodeURIComponent(userId)}`);
    const payload = await response.json();
    if (response.ok) setReports(payload.reports);
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
    </PageShell>
  );
}
