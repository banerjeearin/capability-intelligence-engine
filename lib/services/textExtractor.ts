export interface ExtractTextInput {
  fileName: string;
  mimeType: string | null;
  fileBytes: ArrayBuffer;
}

function decodeUtf8(fileBytes: ArrayBuffer): string {
  return new TextDecoder('utf-8', { fatal: false }).decode(fileBytes);
}

export async function extractTextFromDocument(input: ExtractTextInput): Promise<string> {
  const { mimeType, fileName, fileBytes } = input;
  const lowerName = fileName.toLowerCase();

  // Phase 4 baseline: robust plain-text ingestion for TXT/MD.
  if (mimeType === 'text/plain' || mimeType === 'text/markdown' || lowerName.endsWith('.txt') || lowerName.endsWith('.md') || lowerName.endsWith('.markdown')) {
    return decodeUtf8(fileBytes).trim();
  }

  // Best-effort fallback (PDF/DOCX extraction can be improved in later phase with dedicated parsers).
  const fallbackText = decodeUtf8(fileBytes)
    .replace(/\u0000/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!fallbackText) {
    throw new Error(`Text extraction failed for ${fileName}. Add a parser for mime type: ${mimeType ?? 'unknown'}.`);
  }

  return fallbackText;
}
