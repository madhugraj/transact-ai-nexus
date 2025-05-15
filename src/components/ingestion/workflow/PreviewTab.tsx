
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronRight, FileText, Table as TableIcon } from 'lucide-react';
import ExtractedTablePreview from '../ExtractedTablePreview';
import DocumentPreview from '../DocumentPreview';
import { TableData } from '@/services/api/tableService';

interface PreviewTabProps {
  tableData: TableData | null;
  isLoading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  fileId?: string;
  onContinue: () => void;
}

export const PreviewTab: React.FC<PreviewTabProps> = ({
  tableData,
  isLoading,
  activeTab,
  setActiveTab,
  fileUrl,
  fileName,
  fileType,
  fileId,
  onContinue
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Document & Table Preview</h3>
        <Button 
          onClick={onContinue}
          className="gap-1"
          disabled={!tableData && !isLoading}
        >
          Continue <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Preview tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="document" className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" /> Document
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-1">
            <TableIcon className="h-3.5 w-3.5" /> Extracted Table
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="document" className="mt-0">
          <DocumentPreview 
            fileUrl={fileUrl} 
            fileName={fileName || undefined}
            fileType={fileType || undefined}
          />
        </TabsContent>
        
        <TabsContent value="table" className="mt-0">
          <ExtractedTablePreview 
            fileId={fileId}
            initialData={tableData ? { headers: tableData.headers, rows: tableData.rows } : undefined}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
