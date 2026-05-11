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
      <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-600">Accepted file types: PDF, DOCX, TXT, Markdown (max 10MB).</p>
        <label className="block">
          <span className="mb-2 block text-sm font-medium">User ID</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="Supabase auth user UUID"
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
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Select file</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <Button type="submit" disabled={isSubmitDisabled}>
          {status === 'uploading' ? 'Uploading...' : 'Upload Document'}
        </Button>
        {message ? (
          <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-slate-700'}`} role="status">
            {message}
          </p>
        ) : null}
      </form>
    </PageShell>
  );
}
