
declare module "@/types/processing" {
  // Post-processing action types
  export type PostProcessAction = 'table_extraction' | 'insights' | 'summary' | 'combine_data' | 'push_to_db';
  
  // Processing options for different action types
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
    useGemini?: boolean; // Flag to enable Gemini processing
    geminiOptions?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    };
  }
}
