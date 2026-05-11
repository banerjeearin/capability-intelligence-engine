'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageShell } from '@/components/layout/page-shell';

interface ScoreRow { dimension: string; score: number; rationale: string; }

export default function AssessmentResultPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const [scores, setScores] = useState<ScoreRow[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/assessment/score?assessmentId=${assessmentId}`);
      const payload = await res.json();
      if (res.ok) setScores(payload.scores);
    }
    if (assessmentId) load();
  }, [assessmentId]);

  const overall = scores.length ? (scores.reduce((s, r) => s + Number(r.score), 0) / scores.length).toFixed(2) : '0.00';

  return (
    <PageShell title="Strategic Fit Analysis">
      <div className="panel mb-6 p-4">
        <p className="text-xs uppercase text-slate-400">Assessment {assessmentId}</p>
        <p className="mt-2 text-3xl font-semibold">Overall Fit {overall}/10</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {scores.map((score) => (
          <div key={score.dimension} className="panel p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium capitalize">{score.dimension.replace('_', ' ')}</p>
              <p className="text-cyan-300">{score.score}/10</p>
            </div>
            <div className="mb-2 h-2 rounded bg-white/10">
              <div className="h-2 rounded bg-gradient-to-r from-cyan-400 to-violet-400" style={{ width: `${Number(score.score) * 10}%` }} />
            </div>
            <p className="text-sm text-slate-300">{score.rationale}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
