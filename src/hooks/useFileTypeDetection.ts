
import { UploadedFile } from '@/types/fileUpload';

export function useFileTypeDetection() {
  // Determine if file is a document (PDF/image) or data file (CSV/Excel)
  const isDocumentFile = (file: File) => {
    return file.type === 'application/pdf' || file.type.startsWith('image/');
  };

  // Determine if file is a data file (CSV/Excel)
  const isDataFile = (file: File) => {
    return file.type.includes('excel') || file.type.includes('spreadsheet') || file.type === 'text/csv';
  };

  // Detect file types for a group of files
  const detectFileTypes = (files: UploadedFile[]) => {
    const allDocuments = files.every(file => isDocumentFile(file.file));
    const allData = files.every(file => isDataFile(file.file));
    
    return { allDocuments, allData };
  };

  return {
    isDocumentFile,
    isDataFile,
    detectFileTypes
  };
}
