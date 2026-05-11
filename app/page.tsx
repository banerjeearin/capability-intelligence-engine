import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/layout/page-shell';

export default function LandingPage() {
  return (
    <PageShell title="AI Enterprise Transformation Fit Engine">
      <section className="panel mb-6 p-8">
        <p className="max-w-3xl text-lg leading-8 text-slate-700">
          Executive-grade intelligence terminal for evaluating transformation leadership fit across strategy, architecture, AI capability,
          and delivery execution.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/dashboard"><Button>Open Intelligence Dashboard</Button></Link>
          <Link href="/chat"><Button variant="outline">Launch Executive Copilot</Button></Link>
        </div>
      </section>
      <p className="mb-6 max-w-2xl text-slate-600">
        Evaluate enterprise AI transformation readiness with structured assessments, evidence-based workflows, and actionable reporting.
      </p>
      <div className="flex gap-3">
        <Link href="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
        <Link href="/upload">
          <Button variant="outline">Start Upload</Button>
        </Link>
      </div>
    </PageShell>
  );
}
