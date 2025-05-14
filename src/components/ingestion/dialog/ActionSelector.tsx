
import React from 'react';
import { cn } from '@/lib/utils';
import { TableIcon, FileText, Layers, Sparkles, Database } from 'lucide-react';
import { PostProcessAction } from '@/types/processing';
import { UploadedFile } from '@/types/fileUpload';

interface ActionSelectorProps {
  selectedFileIds: string[];
  files: UploadedFile[];
  currentAction: PostProcessAction;
  setCurrentAction: (action: PostProcessAction) => void;
  isDocumentFile: (file: File) => boolean;
  isDataFile: (file: File) => boolean;
}

export const ActionSelector: React.FC<ActionSelectorProps> = ({
  selectedFileIds,
  files,
  currentAction,
  setCurrentAction,
  isDocumentFile,
  isDataFile
}) => {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {selectedFileIds.length > 0 && isDocumentFile(files.find(f => f.id === selectedFileIds[0])?.file as File) && (
          <>
            <div
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors",
                currentAction === 'table_extraction' && "border-primary bg-primary/5"
              )}
              onClick={() => setCurrentAction('table_extraction')}
            >
              <TableIcon className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm font-medium">Table Extraction</span>
            </div>
            <div
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors",
                currentAction === 'summary' && "border-primary bg-primary/5"
              )}
              onClick={() => setCurrentAction('summary')}
            >
              <FileText className="h-8 w-8 mb-2 text-orange-500" />
              <span className="text-sm font-medium">Document Summary</span>
            </div>
          </>
        )}

        {selectedFileIds.length > 0 && isDataFile(files.find(f => f.id === selectedFileIds[0])?.file as File) && selectedFileIds.length > 1 && (
          <div
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors",
              currentAction === 'combine_data' && "border-primary bg-primary/5"
            )}
            onClick={() => setCurrentAction('combine_data')}
          >
            <Layers className="h-8 w-8 mb-2 text-blue-500" />
            <span className="text-sm font-medium">Combine Data</span>
          </div>
        )}

        <div
          className={cn(
            "flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors",
            currentAction === 'insights' && "border-primary bg-primary/5"
          )}
          onClick={() => setCurrentAction('insights')}
        >
          <Sparkles className="h-8 w-8 mb-2 text-yellow-500" />
          <span className="text-sm font-medium">Generate Insights</span>
        </div>
        
        <div
          className={cn(
            "flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors",
            currentAction === 'push_to_db' && "border-primary bg-primary/5"
          )}
          onClick={() => setCurrentAction('push_to_db')}
        >
          <Database className="h-8 w-8 mb-2 text-green-500" />
          <span className="text-sm font-medium">Push to Database</span>
        </div>
      </div>
    </div>
  );
};
