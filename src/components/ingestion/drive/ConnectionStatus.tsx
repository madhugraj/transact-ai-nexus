
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X, CheckCircle, AlertCircle } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isLoading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onLoadFiles: () => void;
}

const ConnectionStatus = ({ 
  isConnected, 
  isLoading, 
  onConnect,
  onDisconnect,
  onLoadFiles 
}: ConnectionStatusProps) => {
  // Check if we have stored tokens for better status display
  const hasStoredTokens = () => {
    const tokens = localStorage.getItem('drive_auth_tokens');
    return tokens && JSON.parse(tokens).accessToken;
  };

  if (!isConnected) {
    const hasTokens = hasStoredTokens();
    return (
      <div className={`flex items-center justify-between p-3 rounded border ${
        hasTokens ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center gap-2">
          {hasTokens ? (
            <CheckCircle className="w-4 h-4 text-blue-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-yellow-500" />
          )}
          <div>
            <span className={`text-sm ${hasTokens ? 'text-blue-700' : 'text-yellow-700'}`}>
              {hasTokens ? 'Reconnecting to Google Drive...' : 'Not connected to Google Drive'}
            </span>
            {hasTokens && (
              <div className="text-xs text-blue-600 mt-1">
                Found stored credentials, attempting reconnection
              </div>
            )}
          </div>
        </div>
        <Button onClick={onConnect} disabled={isLoading} size="sm">
          {isLoading ? 'Connecting...' : hasTokens ? 'Reconnect' : 'Connect'}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200">
      <div className="flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-green-500" />
        <div>
          <span className="text-sm text-green-700">Connected to Google Drive</span>
          <div className="text-xs text-green-600 mt-1">
            Connection active and authenticated
          </div>
        </div>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={onLoadFiles} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDisconnect}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ConnectionStatus;
