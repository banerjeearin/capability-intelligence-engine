'use client';

import { FormEvent, useState } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';

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

  return (
    <PageShell title="Reports">
      <form onSubmit={generateReport} className="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <input
          className="rounded-md border px-3 py-2"
          placeholder="User ID"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
        />
        <input
          className="rounded-md border px-3 py-2"
          placeholder="Assessment ID"
          value={assessmentId}
          onChange={(event) => setAssessmentId(event.target.value)}
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
          <Button type="button" variant="outline" onClick={loadReports}>
            Load Reports
          </Button>
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
              <div>
                <p className="font-medium">Strengths</p>
                <ul className="ml-5 list-disc">
                  {(report.report_json?.strengths ?? []).map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium">Risk Areas</p>
                <ul className="ml-5 list-disc">
                  {(report.report_json?.risk_areas ?? []).map((risk, index) => (
                    <li key={index}>{risk}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
        {!reports.length ? <p className="text-sm text-slate-500">No reports yet.</p> : null}
      </div>
    </PageShell>
  );
}
