import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/layout/page-shell';

export default function LandingPage() {
  return (
    <PageShell title="AI Enterprise Transformation Fit Engine">
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
