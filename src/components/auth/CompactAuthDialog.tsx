
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

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
  const isRedirectUriError = error && error.includes('redirect_uri_mismatch');
  
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
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md space-y-2">
              <p className="font-medium">Authentication Error:</p>
              <p>{error}</p>
              
              {isRedirectUriError && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800">
                  <p className="font-medium mb-2">🔧 Setup Required:</p>
                  <p className="text-xs mb-2">
                    You need to add this EXACT redirect URI to your Google Cloud Console:
                  </p>
                  <code className="block p-2 bg-white border rounded text-xs break-all">
                    {window.location.origin}/oauth/callback
                  </code>
                  <div className="mt-2">
                    <a 
                      href="https://console.cloud.google.com/apis/credentials" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Open Google Cloud Console <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <p className="text-xs mt-2">
                    1. Select your OAuth 2.0 client<br/>
                    2. Add the above URI to "Authorized redirect URIs"<br/>
                    3. Save and try again
                  </p>
                </div>
              )}
            </div>
          )}
          
          {!isConnected ? (
            <div className="space-y-3">
              {!isRedirectUriError && (
                <p className="text-xs text-muted-foreground">
                  Note: You may see a warning that the app is unverified. Click "Advanced" → "Go to {window.location.hostname} (unsafe)" to continue.
                </p>
              )}
              <Button
                onClick={onConnect}
                disabled={isConnecting || isRedirectUriError}
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
