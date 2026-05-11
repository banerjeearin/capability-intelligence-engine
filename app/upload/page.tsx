'use client';

import { FormEvent, useMemo, useState } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { UploadStatus } from '@/types/document';

const ACCEPTED_EXTENSIONS = '.pdf,.docx,.txt,.md,.markdown';

export default function UploadPage() {
  const [userId, setUserId] = useState('');
  const [orgId, setOrgId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [message, setMessage] = useState('');

  const isSubmitDisabled = useMemo(() => !file || !userId || !orgId || status === 'uploading', [file, userId, orgId, status]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !userId || !orgId) {
      setStatus('error');
      setMessage('Please provide user ID, organization ID, and a valid file.');
      return;
    }

    setStatus('uploading');
    setMessage('Uploading document...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'x-user-id': userId,
          'x-org-id': orgId
        },
        body: formData
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Upload failed.');
      }

      setStatus('success');
      setMessage(`Uploaded ${payload.document.file_name} successfully.`);
      setFile(null);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unexpected upload error.');
    }
  }

  return (
    <PageShell title="Upload Documents">
      <form onSubmit={onSubmit} className="app-section max-w-2xl space-y-5">
        <div>
          <p className="eyebrow mb-2">Evidence intake</p>
          <h2 className="text-xl font-semibold text-slate-950">Add source material</h2>
          <p className="mt-1 text-sm text-slate-600">Accepted file types: PDF, DOCX, TXT, Markdown. Maximum file size is 10MB.</p>
        </div>
        <label className="block">
          <span className="field-label">User ID</span>
          <input
            className="field-input"
            placeholder="Supabase auth user UUID"
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
        <label className="block">
          <span className="field-label">Select file</span>
          <input
            className="field-input py-2"
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <Button className="w-full sm:w-auto" type="submit" disabled={isSubmitDisabled}>
          {status === 'uploading' ? 'Uploading...' : 'Upload Document'}
        </Button>
        {message ? (
          <p className={status === 'error' ? 'status-error' : 'status-note'} role="status">
            {message}
          </p>
        ) : null}
      </form>
    </PageShell>
  );
}
