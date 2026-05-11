import { chunkText } from '@/lib/services/chunker';
import { generateEmbeddings } from '@/lib/services/embeddingService';
import { extractTextFromDocument } from '@/lib/services/textExtractor';

interface IngestDocumentInput {
  userId: string;
  documentId: string;
}

function getServerConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }

  return { url, key };
}

export async function ingestDocument(input: IngestDocumentInput) {
  const { url, key } = getServerConfig();

  const docQuery = new URLSearchParams({
    id: `eq.${input.documentId}`,
    user_id: `eq.${input.userId}`,
    select: 'id,file_name,file_path,mime_type,user_id',
    limit: '1'
  });

  const docRes = await fetch(`${url}/rest/v1/documents?${docQuery.toString()}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });

  if (!docRes.ok) {
    throw new Error(`Unable to load document metadata: ${await docRes.text()}`);
  }

  const [document] = await docRes.json();
  if (!document) {
    throw new Error('Document not found for provided userId/documentId.');
  }

  const fileRes = await fetch(`${url}/storage/v1/object/documents/${document.file_path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });

  if (!fileRes.ok) {
    throw new Error(`Unable to download document: ${await fileRes.text()}`);
  }

  const fileBytes = await fileRes.arrayBuffer();
  const extractedText = await extractTextFromDocument({ fileName: document.file_name, mimeType: document.mime_type, fileBytes });
  const chunks = chunkText(extractedText);

  if (!chunks.length) {
    throw new Error('No text chunks generated from document content.');
  }

  const embeddings = await generateEmbeddings(chunks.map((chunk) => chunk.content));

  const rows = chunks.map((chunk, idx) => ({
    document_id: document.id,
    user_id: document.user_id,
    chunk_index: chunk.chunkIndex,
    content: chunk.content,
    metadata: { source_file: document.file_name },
    embedding: embeddings[idx]
  }));

  const insertRes = await fetch(`${url}/rest/v1/document_chunks`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify(rows)
  });

  if (!insertRes.ok) {
    throw new Error(`Failed to insert chunk embeddings: ${await insertRes.text()}`);
  }

  const inserted = await insertRes.json();
  return { chunkCount: inserted.length };
}
