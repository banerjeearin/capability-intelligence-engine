'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageShell } from '@/components/layout/page-shell';

interface ScoreRow {
  dimension: string;
  score: number;
  rationale: string;
}

export default function AssessmentResultPage() {
  const params = useParams<{ assessmentId: string }>();
  const assessmentId = params.assessmentId;

  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadScores() {
      const response = await fetch(`/api/assessment/score?assessmentId=${assessmentId}`);
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? 'Failed to load assessment results.');
        return;
      }
      setScores(payload.scores);
    }

    if (assessmentId) {
      loadScores();
    }
  }, [assessmentId]);

  const overall = scores.length ? (scores.reduce((sum, item) => sum + Number(item.score), 0) / scores.length).toFixed(2) : '0.00';

  return (
    <PageShell title="Assessment Results">
      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-600">Assessment ID</p>
        <p className="font-mono text-sm">{assessmentId}</p>
        <p className="mt-2 text-lg font-semibold">Overall Score: {overall} / 10</p>
      </div>

      <div className="space-y-3">
        {scores.map((score) => (
          <div key={score.dimension} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium capitalize">{score.dimension.replace('_', ' ')}</p>
              <p className="font-semibold">{score.score}/10</p>
            </div>
            <p className="text-sm text-slate-700">{score.rationale}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
