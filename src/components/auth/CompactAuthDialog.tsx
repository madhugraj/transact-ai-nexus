
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';

interface CompactAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  isConnecting: boolean;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  error?: string;
}

const CompactAuthDialog: React.FC<CompactAuthDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  isConnecting,
  isConnected,
  onConnect,
  onDisconnect,
  error
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isConnected ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : error ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : null}
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
          
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
          
          {!isConnected ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Note: You may see a warning that the app is unverified. Click "Advanced" → "Go to {window.location.hostname} (unsafe)" to continue.
              </p>
              <Button
                onClick={onConnect}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  `Connect ${title}`
                )}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={onDisconnect} className="flex-1">
                Disconnect
              </Button>
              <Button onClick={onClose} className="flex-1">
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompactAuthDialog;
