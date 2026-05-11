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
    </PageShell>
  );
}
