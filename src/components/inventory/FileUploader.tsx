
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader, FileSpreadsheet, Upload } from "lucide-react";

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
}

export function FileUploader({ onFileUpload, isProcessing }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const validateAndProcessFile = (file: File) => {
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/json",
      "image/jpeg",
      "image/png",
      "image/gif",
    ];
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV, Excel, JSON, or image file",
        variant: "destructive",
      });
      return;
    }
    
    onFileUpload(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center">
        <h3 className="text-lg font-medium">Upload Inventory File</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a CSV, Excel, JSON, or image of an inventory/invoice table
        </p>
      </div>
      
      <div
        className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center">
            <Loader className="h-10 w-10 text-muted-foreground animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">Processing file...</p>
          </div>
        ) : (
          <>
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm text-center text-muted-foreground mb-2">
              Drag & drop your file here or click to browse
            </p>
            <p className="text-xs text-center text-muted-foreground">
              Supported formats: CSV, Excel, JSON, or images (JPEG, PNG)
            </p>
          </>
        )}
        
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".csv,.xls,.xlsx,.json,.jpeg,.jpg,.png,.gif"
          onChange={handleChange}
          disabled={isProcessing}
        />
      </div>
      
      <div className="text-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isProcessing}
        >
          <Upload className="h-4 w-4 mr-2" />
          Select File
        </Button>
      </div>
    </div>
  );
}
