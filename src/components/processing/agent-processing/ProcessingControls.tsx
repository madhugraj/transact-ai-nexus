
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader } from 'lucide-react';

interface ProcessingControlsProps {
  isProcessing: boolean;
  processingComplete: boolean;
  resetProcessing: () => void;
  handleStartProcessing: () => Promise<void>;
  filesLength: number;
}

export const ProcessingControls: React.FC<ProcessingControlsProps> = ({
  isProcessing,
  processingComplete,
  resetProcessing,
  handleStartProcessing,
  filesLength
}) => {
  return (
    <div className="flex justify-end space-x-3 pt-4">
      {processingComplete ? (
        <Button onClick={resetProcessing} variant="outline">
          Process New Files
        </Button>
      ) : (
        <>
          <Button 
            variant="outline" 
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleStartProcessing}
            disabled={isProcessing || filesLength === 0}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            {isProcessing ? (
              <>
                <Loader className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Start Processing with Gemini"
            )}
          </Button>
        </>
      )}
    </div>
  );
};
