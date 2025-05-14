
import React from 'react';
import TablePostProcessingWorkflow from './TablePostProcessingWorkflow';
import { PostProcessAction } from '@/types/processing';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface PostProcessingWorkflowProps {
  tableName?: string;
  processingType: PostProcessAction;
  onClose: () => void;
  processingId?: string;
  fileId?: string;
}

const PostProcessingWorkflow = ({ 
  tableName,
  processingType,
  onClose,
  processingId,
  fileId
}: PostProcessingWorkflowProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleViewInDatabase = () => {
    toast({
      title: "Navigating to database",
      description: "Opening the database view with your extracted table.",
    });
    navigate('/database');
  };

  // Return the appropriate workflow based on processing type
  if (processingType === 'table_extraction') {
    return (
      <TablePostProcessingWorkflow
        processingId={processingId}
        fileId={fileId}
        tableName={tableName}
        onClose={onClose}
        onViewInDatabase={handleViewInDatabase}
      />
    );
  }

  // Default placeholder for other workflow types
  return (
    <div className="bg-muted p-4 rounded-md text-center">
      <h3 className="font-medium text-lg mb-2">Processing Complete</h3>
      <p className="text-muted-foreground mb-4">
        Your {processingType.replace('_', ' ')} processing has completed successfully.
      </p>
      <button 
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
};

export default PostProcessingWorkflow;
