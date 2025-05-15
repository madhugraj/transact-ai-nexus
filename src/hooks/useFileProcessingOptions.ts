
import { useState } from 'react';
import { ProcessingOptions } from '@/types/processing';

export function useFileProcessingOptions() {
  const [processingOptions, setProcessingOptions] = useState<ProcessingOptions>({
    tableFormat: {
      hasHeaders: true,
      headerRow: 1,
      skipRows: 0,
      delimiter: 'auto'
    },
    dataProcessing: {
      normalizeData: true,
      removeEmptyRows: true,
      detectTypes: true
    },
    databaseOptions: {
      connection: 'Default Connection',
      tableName: 'extracted_data',
      createIfNotExists: true
    },
    ocrOptions: {
      enabled: false,
      enhanceImage: true,
      language: 'eng'
    },
    extractionOptions: {
      confidenceThreshold: 0.8,
      retainFormatting: false,
      detectMultipleTables: false
    }
  });
  
  // Set default table name based on file
  const setDefaultTableName = (fileName: string) => {
    const sanitizedName = fileName
      .toLowerCase()
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-z0-9_]/g, '_'); // Replace non-alphanumeric with underscore
      
    setProcessingOptions(prevOptions => ({
      ...prevOptions,
      databaseOptions: {
        ...prevOptions.databaseOptions,
        tableName: sanitizedName
      }
    }));
  };
  
  // Update OCR settings
  const updateOcrSettings = (enabled: boolean) => {
    setProcessingOptions(prevOptions => ({
      ...prevOptions,
      ocrOptions: {
        ...prevOptions.ocrOptions,
        enabled
      }
    }));
  };
  
  return {
    processingOptions,
    setProcessingOptions,
    setDefaultTableName,
    updateOcrSettings
  };
}
