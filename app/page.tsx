import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/layout/page-shell';

export default function LandingPage() {
  return (
    <PageShell title="AI Enterprise Transformation Fit Engine">
      <section className="app-card mb-6 overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="p-5 sm:p-8 lg:p-10">
            <p className="eyebrow mb-4">Executive capability intelligence</p>
            <h2 className="max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-4xl">
              Evidence-backed evaluation for transformation leadership decisions.
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">
              Assess strategic fit, AI maturity, enterprise architecture depth, and delivery readiness through structured evidence,
              dynamic assessments, and CEO-ready reporting.
            </p>
            <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
              <Link href="/dashboard" className="min-w-0">
                <Button className="w-full sm:w-auto">Open Dashboard</Button>
              </Link>
              <Link href="/assessment" className="min-w-0">
                <Button className="w-full sm:w-auto" variant="outline">Start Assessment</Button>
              </Link>
            </div>
          </div>
          <aside className="border-t border-slate-200 bg-slate-50 p-5 sm:p-8 lg:border-l lg:border-t-0">
            <p className="eyebrow mb-5">Executive outputs</p>
            <div className="space-y-4">
              {[
                ['Capability score', 'Dimension-level scoring with supporting rationale.'],
                ['Evidence trail', 'Uploaded documents and assessment answers stay connected.'],
                ['Board brief', 'Clear strengths, risk areas, role fit, and recommendation.']
              ].map(([title, body]) => (
                <div key={title} className="rounded-md border border-slate-200 bg-white p-4">
                  <p className="font-semibold text-slate-950">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['1', 'Upload evidence', 'Add resumes, project artifacts, strategy notes, and operating-model documents.'],
          ['2', 'Score capability', 'Run structured assessments across leadership and transformation dimensions.'],
          ['3', 'Generate reports', 'Produce concise executive recommendations for high-stakes decisions.']
        ].map(([step, title, body]) => (
          <section key={step} className="app-section">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-sm font-semibold text-white">{step}</span>
            <h3 className="mt-4 font-semibold text-slate-950">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
