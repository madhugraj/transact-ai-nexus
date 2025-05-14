
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Upload, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
    <Card className={cn(
      "overflow-hidden",
      isDragOver ? "ring-2 ring-primary" : ""
    )}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center",
          isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 bg-muted/10"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center">
          {isDragOver ? (
            <FileUp size={48} className="mb-4 text-primary animate-pulse" />
          ) : (
            <Upload size={48} className="mb-4 text-muted-foreground" />
          )}
          
          <h3 className="text-lg font-medium mb-2">
            Drop files here or click to upload
          </h3>
          <p className="text-muted-foreground mb-6">
            PDF, JPG, PNG, Excel, and CSV files are supported
          </p>
          
          <div className="space-x-3">
            <Button 
              variant="default" 
              size="lg"
              className="px-6 transition-all duration-300 hover:scale-105"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload size={16} className="mr-2" />
              Select Files
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="px-6 transition-all duration-300 hover:scale-105"
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
    </Card>
  );
};

export default DropZone;
