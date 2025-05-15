
import React from 'react';
import { Button } from '@/components/ui/button';
import { Database, Download } from 'lucide-react';

interface CompleteTabProps {
  fileId?: string;
  onViewInDatabase?: () => void;
  handleExport: (format: 'csv' | 'xlsx') => Promise<void>;
  onClose: () => void;
}

export const CompleteTab: React.FC<CompleteTabProps> = ({
  fileId,
  onViewInDatabase,
  handleExport,
  onClose
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Extraction Complete</h3>
        <p className="text-muted-foreground">
          Your table has been successfully extracted and processed.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => onViewInDatabase && onViewInDatabase()}
        >
          <Database className="mr-2 h-4 w-4" />
          View in Database
        </Button>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => fileId && handleExport('csv')}
          disabled={!fileId}
        >
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>
      
      <div className="pt-4 border-t">
        <Button 
          onClick={onClose}
          className="w-full"
        >
          Close
        </Button>
      </div>
    </div>
  );
};
