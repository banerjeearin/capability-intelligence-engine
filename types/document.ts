export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface DocumentRecord {
  id: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  status: string;
  created_at: string;
}
