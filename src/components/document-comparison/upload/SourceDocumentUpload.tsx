
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, File, Upload } from "lucide-react";

interface SourceDocumentUploadProps {
  poFile: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SourceDocumentUpload: React.FC<SourceDocumentUploadProps> = ({
  poFile,
  onFileChange
}) => {
  const handleReplaceClick = () => {
    const input = document.getElementById('po-upload') as HTMLInputElement;
    if (input) {
      input.value = '';
      input.click();
    }
  };

  const handleSelectClick = () => {
    const input = document.getElementById('po-upload') as HTMLInputElement;
    if (input) {
      input.click();
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-blue-50 dark:bg-blue-950/20 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <File className="h-5 w-5" />
          Source Document
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {poFile ? (
          <div className="flex items-center justify-between p-2 border rounded-md">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span className="truncate max-w-[200px]">{poFile.name}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleReplaceClick}
            >
              Replace
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center p-6 border-2 border-dashed rounded-md">
            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-4">Upload your Source document</p>
            <Button 
              variant="outline" 
              onClick={handleSelectClick}
            >
              Primary Document
            </Button>
          </div>
        )}
        <input 
          id="po-upload" 
          type="file" 
          className="hidden" 
          accept=".pdf,.jpg,.jpeg,.png" 
          onChange={onFileChange}
        />
      </CardContent>
    </Card>
  );
};
