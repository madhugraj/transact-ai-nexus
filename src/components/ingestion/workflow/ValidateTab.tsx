
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, Edit } from 'lucide-react';
import ExtractedTablePreview from '../ExtractedTablePreview';
import { TableData } from '@/services/api/tableService';

interface ValidateTabProps {
  tableData: TableData | null;
  fileId?: string;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  onContinue: () => void;
}

export const ValidateTab: React.FC<ValidateTabProps> = ({
  tableData,
  fileId,
  isEditing,
  setIsEditing,
  onContinue
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Validate Data</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsEditing(!isEditing)}
            disabled={!tableData}
          >
            {isEditing ? 'Done Editing' : (
              <>
                <Edit className="h-4 w-4 mr-1" /> Edit Data
              </>
            )}
          </Button>
          <Button 
            onClick={onContinue}
            className="gap-1"
          >
            Confirm <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {isEditing ? (
        <div className="border rounded-md p-4 bg-muted/30">
          <p className="text-center text-muted-foreground mb-4">
            Table editing mode would be implemented here
          </p>
          <ExtractedTablePreview 
            fileId={fileId}
            initialData={tableData ? { headers: tableData.headers, rows: tableData.rows } : undefined}
          />
        </div>
      ) : (
        <ExtractedTablePreview 
          fileId={fileId}
          initialData={tableData ? { headers: tableData.headers, rows: tableData.rows } : undefined}
        />
      )}
    </div>
  );
};
