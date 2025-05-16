
export type Document = {
  id: string;
  name: string;
  type: 'document' | 'table' | 'image';
  extractedAt: string;
  source?: 'local' | 'supabase';
  headers?: string[];
  rows?: any[][];
  confidence?: number;
};
