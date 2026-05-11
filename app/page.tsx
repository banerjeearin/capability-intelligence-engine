import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/layout/page-shell';

export default function LandingPage() {
  return (
    <PageShell title="AI Enterprise Transformation Fit Engine">
      <section className="panel mb-6 p-8">
        <p className="max-w-3xl text-lg text-slate-200">
          Executive-grade intelligence terminal for evaluating transformation leadership fit across strategy, architecture, AI capability,
          and delivery execution.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/dashboard"><Button>Open Intelligence Dashboard</Button></Link>
          <Link href="/chat"><Button variant="outline">Launch Executive Copilot</Button></Link>
        </div>
      </section>
    </PageShell>
  );
}
