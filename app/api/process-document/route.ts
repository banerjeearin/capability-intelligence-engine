import { NextRequest, NextResponse } from 'next/server';
import { ingestDocument } from '@/lib/services/documentIngestionService';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { userId?: string; documentId?: string };
    const userId = body.userId?.trim();
    const documentId = body.documentId?.trim();

    if (!userId || !documentId) {
      return NextResponse.json({ error: 'userId and documentId are required.' }, { status: 400 });
    }

    const result = await ingestDocument({ userId, documentId });
    return NextResponse.json({ status: 'processed', ...result });
  } catch (error) {
    return NextResponse.json(
      { error: 'Document processing failed.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
