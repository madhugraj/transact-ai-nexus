
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, File, Upload } from "lucide-react";

interface TargetDocumentsUploadProps {
  invoiceFiles: File[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
}

export const TargetDocumentsUpload: React.FC<TargetDocumentsUploadProps> = ({
  invoiceFiles,
  onFileChange,
  onRemoveFile
}) => {
  const handleAddMoreClick = () => {
    const input = document.getElementById('invoice-upload') as HTMLInputElement;
    if (input) {
      input.click();
    }
  };

  const handleSelectClick = () => {
    const input = document.getElementById('invoice-upload') as HTMLInputElement;
    if (input) {
      input.click();
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-amber-50 dark:bg-amber-950/20 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <File className="h-5 w-5" />
          Target Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {invoiceFiles.length > 0 ? (
          <div className="space-y-2">
            {invoiceFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-amber-500" />
                  <span className="truncate max-w-[200px]">{file.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onRemoveFile(index)}>
                  Remove
                </Button>
              </div>
            ))}
            {invoiceFiles.length < 5 && (
              <Button 
                variant="outline" 
                className="w-full mt-2" 
                onClick={handleAddMoreClick}
              >
                Add More Target Documents ({invoiceFiles.length}/5)
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center p-6 border-2 border-dashed rounded-md">
            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-4">Upload 1-5 Target documents</p>
            <Button 
              variant="outline" 
              onClick={handleSelectClick}
            >
              Reference Documents
            </Button>
          </div>
        )}
        <input 
          id="invoice-upload" 
          type="file" 
          multiple 
          className="hidden" 
          accept=".pdf,.jpg,.jpeg,.png" 
          onChange={onFileChange} 
        />
      </CardContent>
    </Card>
  );
};
