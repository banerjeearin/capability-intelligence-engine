'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { assessmentQuestions } from '@/lib/assessment/questions';

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

  return (
    <PageShell title="Dynamic Assessment">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">User ID</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Supabase user UUID"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Organization ID</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Organization UUID"
              value={orgId}
              onChange={(event) => setOrgId(event.target.value)}
            />
          </label>
        </div>

        {assessmentQuestions.map((question, index) => (
          <div key={question.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">{question.dimension.replace('_', ' ')}</p>
            <label className="block">
              <span className="mb-2 block font-medium">
                {index + 1}. {question.prompt}
              </span>
              <textarea
                className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2"
                value={answers[question.id] ?? ''}
                onChange={(event) => setAnswers((prev) => ({ ...prev, [question.id]: event.target.value }))}
              />
            </label>
          </div>
        ))}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Scoring...' : 'Submit Assessment'}
        </Button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    </PageShell>
  );
}
