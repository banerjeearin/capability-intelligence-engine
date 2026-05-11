'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { assessmentQuestions } from '@/lib/assessment/questions';
import { buildDemoAnswers, demoOrgId, demoUserId } from '@/lib/demoData';

export default function AssessmentPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [orgId, setOrgId] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const allAnswered = assessmentQuestions.every((q) => (answers[q.id] ?? '').trim().length > 0);
    if (!userId || !orgId || !allAnswered) {
      setError('Please enter user ID, organization ID, and answer every question.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/assessment/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-org-id': orgId
        },
        body: JSON.stringify({
          userId,
          answers: assessmentQuestions.map((q) => ({ questionId: q.id, answer: answers[q.id] ?? '' }))
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Assessment submission failed.');
      }

      const params = new URLSearchParams({ userId, orgId });
      router.push(`/assessment/results/${payload.assessmentId}?${params.toString()}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unexpected assessment error.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function loadSyntheticAssessment() {
    setUserId(demoUserId);
    setOrgId(demoOrgId);
    setAnswers(buildDemoAnswers(assessmentQuestions.map((question) => question.id)));
    setError('');
  }

  return (
    <PageShell title="Dynamic Assessment">
      <form onSubmit={onSubmit} className="space-y-5">
        <section className="app-section">
          <p className="eyebrow mb-2">Assessment setup</p>
          <h2 className="text-xl font-semibold text-slate-950">Transformation leadership profile</h2>
          <p className="mt-1 text-sm text-slate-600">Complete each dimension to generate a capability score and executive recommendation.</p>
          <Button className="mt-5 w-full sm:w-auto" type="button" variant="outline" onClick={loadSyntheticAssessment}>
            Fill Synthetic Assessment
          </Button>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="field-label">User ID</span>
              <input
                className="field-input"
                placeholder="Supabase user UUID"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="field-label">Organization ID</span>
              <input
                className="field-input"
                placeholder="Organization UUID"
                value={orgId}
                onChange={(event) => setOrgId(event.target.value)}
              />
            </label>
          </div>
        </section>

        <div className="grid gap-4">
          {assessmentQuestions.map((question, index) => (
            <section key={question.id} className="app-section">
              <p className="eyebrow mb-2">{question.dimension.replace('_', ' ')}</p>
              <label className="block">
                <span className="mb-3 block text-base font-semibold text-slate-950">
                  {index + 1}. {question.prompt}
                </span>
                <textarea
                  className="field-textarea"
                  value={answers[question.id] ?? ''}
                  onChange={(event) => setAnswers((prev) => ({ ...prev, [question.id]: event.target.value }))}
                />
              </label>
            </section>
          ))}
        </div>

        <Button className="w-full sm:w-auto" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Scoring...' : 'Submit Assessment'}
        </Button>
        {error ? <p className="status-error">{error}</p> : null}
      </form>
    </PageShell>
  );
}
