import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown'
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function getSupabaseServerConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }

  return { url, serviceRoleKey };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const userId = String(formData.get('userId') ?? '').trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type. Use PDF, DOCX, TXT, or Markdown.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit.' }, { status: 400 });
    }

    const { url, serviceRoleKey } = getSupabaseServerConfig();
    const bucket = 'documents';
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${userId}/${Date.now()}-${safeName}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const storageResponse = await fetch(`${url}/storage/v1/object/${bucket}/${filePath}`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': file.type,
        'x-upsert': 'false'
      },
      body: fileBuffer
    });

    if (!storageResponse.ok) {
      const details = await storageResponse.text();
      return NextResponse.json({ error: 'Storage upload failed.', details }, { status: 500 });
    }

    const insertResponse = await fetch(`${url}/rest/v1/documents`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        file_name: file.name,
        file_path: filePath,
        mime_type: file.type,
        file_size_bytes: file.size,
        status: 'uploaded'
      })
    });

    if (!insertResponse.ok) {
      const details = await insertResponse.text();
      return NextResponse.json({ error: 'Metadata insert failed.', details }, { status: 500 });
    }

    const [document] = await insertResponse.json();
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unexpected upload error.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
