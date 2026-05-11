export interface TextChunk {
  chunkIndex: number;
  content: string;
}

interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
}

export function chunkText(text: string, options: ChunkOptions = {}): TextChunk[] {
  const chunkSize = options.chunkSize ?? 1000;
  const overlap = options.overlap ?? 250;

  if (chunkSize <= overlap) {
    throw new Error('chunkSize must be greater than overlap.');
  }

  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < normalized.length) {
    let end = Math.min(start + chunkSize, normalized.length);

    if (end < normalized.length) {
      const sentenceBreak = normalized.lastIndexOf('.', end);
      if (sentenceBreak > start + Math.floor(chunkSize * 0.6)) {
        end = sentenceBreak + 1;
      }
    }

    const content = normalized.slice(start, end).trim();
    if (content) {
      chunks.push({ chunkIndex: index++, content });
    }

    if (end === normalized.length) break;
    start = Math.max(0, end - overlap);
  }

  return chunks;
}
