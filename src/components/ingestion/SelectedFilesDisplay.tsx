
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { UploadedFile } from '@/types/fileUpload';

interface SelectedFilesDisplayProps {
  selectedFiles: UploadedFile[];
}

const SelectedFilesDisplay: React.FC<SelectedFilesDisplayProps> = ({ 
  selectedFiles 
}) => {
  if (selectedFiles.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {selectedFiles.map(file => (
        <Badge key={file.id} variant="secondary" className="px-3 py-1">
          {file.file.name}
        </Badge>
      ))}
    </div>
  );
};

export default SelectedFilesDisplay;
