
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UploadedFile } from '@/types/fileUpload';

interface FileUploadActionsProps {
  files: UploadedFile[];
  isLoading: boolean;
  handleProcessFiles: () => void;
  selectFilesForProcessing: (fileIds: string[]) => void;
  selectByType: (type: 'document' | 'data') => any;
  setShowProcessingDialog: (show: boolean) => void;
}

const FileUploadActions = ({
  files,
  isLoading,
  handleProcessFiles,
  selectFilesForProcessing,
  selectByType,
  setShowProcessingDialog
}: FileUploadActionsProps) => {
  const { toast } = useToast();
  
  // Open processing dialog for selected files
  const openProcessingDialog = (fileIds: string[]) => {
    selectFilesForProcessing(fileIds);
    setShowProcessingDialog(true);
  };

  // Process document files
  const handleProcessDocuments = () => {
    const result = selectByType('document');
    if (result) setShowProcessingDialog(true);
  };

  // Process data files
  const handleProcessDataFiles = () => {
    const result = selectByType('data');
    if (result) setShowProcessingDialog(true);
  };

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      <Button 
        onClick={handleProcessFiles}
        disabled={isLoading || files.length === 0}
      >
        Process Selected Files
      </Button>
      
      <Button 
        variant="outline"
        onClick={handleProcessDocuments}
        disabled={isLoading || files.length === 0}
      >
        Process Document Files
      </Button>
      
      <Button 
        variant="outline"
        onClick={handleProcessDataFiles}
        disabled={isLoading || files.length === 0}
      >
        Process Data Files
      </Button>
    </div>
  );
};

export default FileUploadActions;
