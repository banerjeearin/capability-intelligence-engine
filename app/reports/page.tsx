'use client';

import { FormEvent, useState } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { demoAssessmentId, demoReports, demoUserId } from '@/lib/demoData';

interface ReportRow {
  id: string;
  title: string;
  assessment_id: string;
  created_at: string;
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadReports() {
    if (!userId) {
      setError('Please provide user ID.');
      return;
    }

    setError('');
    const response = await fetch(`/api/reports?userId=${encodeURIComponent(userId)}`);
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? 'Failed to fetch reports.');
      return;
    }
    setReports(payload.reports);
  }

  async function generateReport(event: FormEvent) {
    event.preventDefault();
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

  function loadSyntheticReports() {
    setUserId(demoUserId);
    setAssessmentId(demoAssessmentId);
    setReports(demoReports);
    setError('');
  }

  return (
    <PageShell title="Reports">
      <form onSubmit={generateReport} className="app-section mb-6 grid gap-4">
        <div>
          <p className="eyebrow mb-2">Executive reporting</p>
          <h2 className="text-xl font-semibold text-slate-950">Generate and review board-ready reports</h2>
          <p className="mt-1 text-sm text-slate-600">Create a structured recommendation from a completed assessment.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            className="field-input"
            placeholder="User ID"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
          />
          <input
            className="field-input"
            placeholder="Assessment ID"
            value={assessmentId}
            onChange={(event) => setAssessmentId(event.target.value)}
          />
        </div>
        <div className="grid gap-2 sm:flex">
          <Button className="w-full sm:w-auto" type="submit" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
          <Button className="w-full sm:w-auto" type="button" variant="outline" onClick={loadReports}>
            Load Reports
          </Button>
          <Button className="w-full sm:w-auto" type="button" variant="outline" onClick={loadSyntheticReports}>
            Load Synthetic Reports
          </Button>
        </div>
      </form>

      {error ? <p className="status-error mb-4">{error}</p> : null}

      <div className="space-y-4">
        {reports.map((report) => (
          <article key={report.id} className="app-section">
            <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-lg font-semibold text-slate-950">{report.title}</p>
                <p className="text-xs text-slate-500">{new Date(report.created_at).toLocaleString()}</p>
              </div>
              <a className="text-sm font-semibold text-slate-700 underline" href={`/api/reports/${report.id}/export`}>
                Export PDF
              </a>
            </div>
            <p className="mb-2 text-sm">
              <strong>Executive Summary:</strong> {report.report_json?.executive_summary ?? 'N/A'}
            </p>
            <p className="mb-2 text-sm">
              <strong>Recommended Role Fit:</strong> {report.report_json?.recommended_role_fit ?? 'N/A'}
            </p>
            <p className="mb-2 text-sm">
              <strong>Final Recommendation:</strong> {report.report_json?.final_recommendation ?? 'N/A'}
            </p>
            <div className="text-sm">
              <p className="font-medium">Capability Scores</p>
              <ul className="ml-5 list-disc">
                {(report.report_json?.capability_scores ?? []).map((score) => (
                  <li key={score.dimension}>
                    {score.dimension}: {score.score}/10
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                <p className="font-medium">Strengths</p>
                <ul className="ml-5 list-disc">
                  {(report.report_json?.strengths ?? []).map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                <p className="font-medium">Risk Areas</p>
                <ul className="ml-5 list-disc">
                  {(report.report_json?.risk_areas ?? []).map((risk, index) => (
                    <li key={index}>{risk}</li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
        {!reports.length ? <p className="status-note">No reports yet.</p> : null}
      </div>
    </PageShell>
  );
}
