
declare module "@/types/fileUpload" {
  // File status definitions
  export type FileStatus = 'idle' | 'uploading' | 'success' | 'error';
  
  // Post-processing action for uploaded files
  export type PostProcessAction = 'table_extraction' | 'insights' | 'summary' | 'combine_data' | 'push_to_db';
  
  // Interface for the uploaded file with status and progress
  export interface UploadedFile {
    id: string;
    file: File;
    status: FileStatus;
    progress: number;
    backendId?: string; // Backend-assigned ID for the uploaded file
    error?: string;
    processed?: boolean;
    processing?: boolean; // Flag to indicate if the file is being processed
  }
  
  // File processing options
  export interface ProcessingOptions {
    tableFormat?: {
      hasHeaders: boolean;
      headerRow?: number;
      skipRows?: number;
      delimiter?: string;
    };
    dataProcessing?: {
      normalizeData: boolean;
      removeEmptyRows: boolean;
      detectTypes: boolean;
    };
    databaseOptions?: {
      connection: string;
      tableName: string;
      createIfNotExists: boolean;
    };
  }
}
