
import { UploadedFile } from '@/types/fileUpload';

export function useFileTypeDetection() {
  // Check if a file is a document (PDF or image)
  const isDocumentFile = (file: File): boolean => {
    return (
      file.type === 'application/pdf' ||
      file.type.startsWith('image/')
    );
  };
  
  // Check if a file is a data file (CSV, Excel)
  const isDataFile = (file: File): boolean => {
    return (
      file.type === 'text/csv' ||
      file.type.includes('excel') ||
      file.type.includes('spreadsheet') ||
      file.name.toLowerCase().endsWith('.csv') ||
      file.name.toLowerCase().endsWith('.xls') ||
      file.name.toLowerCase().endsWith('.xlsx')
    );
  };
  
  // Detect file types in a collection
  const detectFileTypes = (files: UploadedFile[]) => {
    const documentCount = files.filter(file => isDocumentFile(file.file)).length;
    const dataCount = files.filter(file => isDataFile(file.file)).length;
    
    return {
      documentCount,
      dataCount,
      allDocuments: documentCount === files.length && documentCount > 0,
      allData: dataCount === files.length && dataCount > 0,
      mixed: documentCount > 0 && dataCount > 0
    };
  };
  
  return {
    isDocumentFile,
    isDataFile,
    detectFileTypes
  };
}
