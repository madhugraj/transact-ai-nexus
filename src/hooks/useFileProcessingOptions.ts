
import { useState } from 'react';
import { ProcessingOptions } from '@/types/processing';

export function useFileProcessingOptions() {
  const [processingOptions, setProcessingOptions] = useState<ProcessingOptions>({
    tableFormat: {
      hasHeaders: true,
      headerRow: 1,
      skipRows: 0,
      delimiter: 'auto',
    },
    dataProcessing: {
      normalizeData: true,
      removeEmptyRows: true,
      detectTypes: true,
    },
    databaseOptions: {
      connection: 'ERP Database',
      tableName: '',
      createIfNotExists: true,
    },
    ocrOptions: {
      enabled: false,
      enhanceImage: true,
      language: 'eng',
    },
    extractionOptions: {
      confidenceThreshold: 0.8,
      retainFormatting: false,
      detectMultipleTables: false,
    }
  });

  // Set default table name based on file name
  const setDefaultTableName = (fileName: string) => {
    const tableName = fileName.split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
    setProcessingOptions(prev => ({
      ...prev,
      databaseOptions: {
        ...prev.databaseOptions,
        tableName
      }
    }));
  };

  // Update OCR settings based on file types
  const updateOcrSettings = (enableOcr: boolean) => {
    setProcessingOptions(prev => ({
      ...prev,
      ocrOptions: {
        ...prev.ocrOptions,
        enabled: enableOcr
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
