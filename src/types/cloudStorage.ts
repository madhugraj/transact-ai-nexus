
export type CloudStorageProvider = 'google_drive' | 'onedrive' | 'sharepoint' | 'dropbox';

export interface CloudFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  lastModified: Date;
  provider: CloudStorageProvider;
  parentId?: string;
  isFolder: boolean;
}

export interface CloudStorageAuthResult {
  provider: CloudStorageProvider;
  accessToken: string;
  success: boolean;
  expiresAt: Date;
}

export type DocumentClassificationType = 
  | 'invoice' 
  | 'purchase_order' 
  | 'receipt' 
  | 'bill' 
  | 'email' 
  | 'contract' 
  | 'report' 
  | 'work_order' 
  | 'utility' 
  | 'other';
