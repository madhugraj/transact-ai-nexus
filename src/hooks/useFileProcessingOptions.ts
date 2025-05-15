
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
    },
    ocrSettings: {
      enabled: false,
      enhanceResolution: true,
      language: 'eng',
      promptId: 'default',
      customPrompt: `You're an OCR assistant. Read this scanned document image and extract clean, structured text.
You are also an expert in extracting tables from scanned images.
If the image has Checks, Mention that it is a check image and extract the values accordingly.
- Give appropriate title for the image according to the type of image.
Instructions:
- Extract all clear tabular structures from the image.
- Extract all possible tabular structures with data from the image
- Extract the Headings of the table {extracted heading}
- Avoid any logos or text not part of a structured table.
- Output JSON only in the format:

\`\`\`json
{
  "tables": [
    {
      "title": "extracted heading",
      "headers": ["Column A", "Column B"],
      "rows": [
        ["value1", "value2"],
        ...
      ]
    }
  ]
}
\`\`\``
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
      },
      ocrSettings: {
        ...prevOptions.ocrSettings,
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
