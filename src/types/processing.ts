
// Available post-processing actions
export type PostProcessAction = 
  | 'table_extraction'
  | 'combine_data'
  | 'push_to_db'
  | 'insights'
  | 'summary';

// Processing options interface
export interface ProcessingOptions {
  tableFormat?: {
    hasHeaders?: boolean;
    headerRow?: number;
    skipRows?: number;
    delimiter?: 'auto' | ',' | ';' | '\t';
  };
  dataProcessing?: {
    normalizeData?: boolean;
    removeEmptyRows?: boolean;
    detectTypes?: boolean;
  };
  databaseOptions?: {
    connection?: string;
    tableName?: string;
    createIfNotExists?: boolean;
    updateExisting?: boolean;
    schema?: Record<string, string>;
  };
  ocrOptions?: {
    enabled?: boolean;
    enhanceImage?: boolean;
    language?: string;
  };
  extractionOptions?: {
    confidenceThreshold?: number;
    retainFormatting?: boolean;
    detectMultipleTables?: boolean;
  };
  // Add ocrSettings for table extraction and custom prompts
  ocrSettings?: {
    enabled?: boolean;
    enhanceResolution?: boolean;
    language?: string;
    promptId?: string;
    customPrompt?: string;
  };
}
