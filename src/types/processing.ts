
export type PostProcessAction = 'table_extraction' | 'insights' | 'summary' | 'combine_data' | 'push_to_db';

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
  ocrOptions?: {
    enabled: boolean;
    enhanceImage: boolean;
    language: string;
  };
  extractionOptions?: {
    confidenceThreshold: number;
    retainFormatting: boolean;
    detectMultipleTables: boolean;
  };
  useGemini?: boolean; // Added this property to support Gemini AI processing
}
