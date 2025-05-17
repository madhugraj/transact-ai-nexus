
/**
 * Cloud storage integration types
 */

export type CloudStorageProvider = 'google-drive' | 'onedrive' | 'sharepoint' | 'dropbox' | 'box';

export interface CloudStorageConfig {
  provider: CloudStorageProvider;
  clientId?: string;
  redirectUri?: string;
  scopes?: string[];
  customParams?: Record<string, string>;
}

export interface CloudFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  lastModified: Date;
  thumbnailUrl?: string;
  provider: CloudStorageProvider;
  parentId?: string;
  path?: string;
  isFolder: boolean;
}

export interface CloudStorageAuthResult {
  provider: CloudStorageProvider;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  userId?: string;
  success: boolean;
  error?: string;
}

export type DocumentClassificationType = 
  | 'invoice' 
  | 'purchase_order' 
  | 'receipt' 
  | 'bill' 
  | 'email' 
  | 'contract' 
  | 'report' 
  | 'other';

export interface ClassificationResult {
  documentType: DocumentClassificationType;
  confidence: number;
  alternativeTypes?: Array<{type: DocumentClassificationType, confidence: number}>;
}
