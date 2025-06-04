
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader } from 'lucide-react';

interface GmailAuthProps {
  isConnecting: boolean;
  onAuth: () => void;
}

const GmailAuth: React.FC<GmailAuthProps> = ({ isConnecting, onAuth }) => {
  return (
    <Card className="p-6">
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Connect to Gmail</h3>
          <p className="text-sm text-muted-foreground">
            Authenticate with your Google account to access your Gmail
          </p>
          <p className="text-xs text-muted-foreground">
            Note: You may see a warning that the app is unverified. Click "Advanced" → "Go to {window.location.hostname} (unsafe)" to continue.
          </p>
        </div>
        
        <Button
          onClick={onAuth}
          disabled={isConnecting}
          className="w-full"
        >
          {isConnecting ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Connecting to Gmail...
            </>
          ) : (
            'Connect Gmail'
          )}
        </Button>
        
        <div className="text-xs text-muted-foreground">
          <p>You'll be redirected to Google to authorize access</p>
        </div>
      </div>
    </Card>
  );
};

export default GmailAuth;
