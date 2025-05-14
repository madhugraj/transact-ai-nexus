
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import TablePostProcessingWorkflow from './TablePostProcessingWorkflow';
import { useToast } from '@/hooks/use-toast';
import { PostProcessAction } from '@/types/processing';
import * as api from '@/services/api';
import { useAgentProcessing } from '@/hooks/useAgentProcessing';

interface PostProcessingWorkflowProps {
  processingType: PostProcessAction;
  tableName?: string;
  onClose: () => void;
  processingId?: string;
  fileId?: string;
}

const PostProcessingWorkflow: React.FC<PostProcessingWorkflowProps> = ({
  processingType,
  tableName,
  onClose,
  processingId,
  fileId
}) => {
  const { toast } = useToast();
  const { processingResults } = useAgentProcessing();
  const [showInDatabase, setShowInDatabase] = useState(false);

  console.log("PostProcessingWorkflow with processingId:", processingId);
  console.log("PostProcessingWorkflow with fileId:", fileId);
  console.log("ProcessingResults available:", processingResults);

  const handleViewInDatabase = () => {
    toast({
      title: "Opening database view",
      description: `Viewing table ${tableName || 'extracted_data'} in database`,
    });
    setShowInDatabase(true);
    // In a real implementation, this would navigate to the database view
  };

  return (
    <Card className="shadow-md border-primary/20 mb-6">
      <CardContent className="p-0">
        {processingType === 'table_extraction' && (
          <TablePostProcessingWorkflow
            processingId={processingId}
            fileId={fileId}
            tableName={tableName || 'extracted_table'}
            onClose={onClose}
            onViewInDatabase={handleViewInDatabase}
            processingResults={processingResults}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default PostProcessingWorkflow;
