
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
}

const DropZone = ({ onFilesSelected }: DropZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      onFilesSelected(Array.from(selectedFiles));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center",
        isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center">
        <Upload size={48} className={cn(
          "mb-4 text-muted-foreground",
          isDragOver && "text-primary"
        )} />
        
        <h3 className="text-lg font-medium mb-2">
          Drop files here or click to upload
        </h3>
        <p className="text-muted-foreground mb-4">
          PDF, JPG, PNG, Excel, and CSV files are supported
        </p>
        
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <Upload size={16} className="mr-2" />
            Select Files
          </Button>
          <Button 
            variant="outline"
            onClick={() => document.getElementById('folder-upload')?.click()}
          >
            <Upload size={16} className="mr-2" />
            Select Folder
          </Button>
          <input
            id="file-upload"
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,.csv"
            onChange={handleFileChange}
          />
          <input
            id="folder-upload"
            type="file"
            multiple
            className="hidden"
            // Using attributes that will work with TypeScript
            data-directory=""
            {...{ webkitdirectory: true }} // Apply as a spread prop to avoid TS errors
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
};

export default DropZone;
