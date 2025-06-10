
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X, CheckCircle, AlertCircle } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isLoading: boolean;
  error?: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onLoadFiles: () => void;
}

const ConnectionStatus = ({ 
  isConnected, 
  isLoading,
  error,
  onConnect,
  onDisconnect,
  onLoadFiles 
}: ConnectionStatusProps) => {
  // Determine the current state
  const hasStoredTokens = () => {
    try {
      const tokens = localStorage.getItem('drive_auth_tokens');
      return tokens && JSON.parse(tokens).accessToken;
    } catch {
      return false;
    }
  };

  const hasTokens = hasStoredTokens();
  const isExpiredError = error && error.includes('expired');

  if (isConnected) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <div>
            <span className="text-sm text-green-700">Connected to Google Drive</span>
            <div className="text-xs text-green-600 mt-1">
              Ready to browse and process files
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
  }

  // Not connected states
  if (isExpiredError) {
    return (
      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded border border-yellow-200">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-500" />
          <div>
            <span className="text-sm text-yellow-700">Connection Expired</span>
            <div className="text-xs text-yellow-600 mt-1">
              Your Google Drive session has expired
            </div>
          </div>
        </div>
        <Button onClick={onConnect} disabled={isLoading} size="sm" variant="outline">
          {isLoading ? 'Reconnecting...' : 'Reconnect'}
        </Button>
      </div>
    );
  }

  if (hasTokens && !isConnected) {
    return (
      <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
        <div className="flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 text-blue-500 ${isLoading ? 'animate-spin' : ''}`} />
          <div>
            <span className="text-sm text-blue-700">Reconnecting to Google Drive</span>
            <div className="text-xs text-blue-600 mt-1">
              Validating stored credentials...
            </div>
          </div>
        </div>
        <Button onClick={onConnect} disabled={isLoading} size="sm" variant="outline">
          {isLoading ? 'Connecting...' : 'Retry'}
        </Button>
      </div>
    );
  }

  // Default not connected state
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-gray-500" />
        <div>
          <span className="text-sm text-gray-700">Not connected to Google Drive</span>
          <div className="text-xs text-gray-600 mt-1">
            Connect to browse and process your files
          </div>
        </div>
      </div>
      <Button onClick={onConnect} disabled={isLoading} size="sm">
        {isLoading ? 'Connecting...' : 'Connect'}
      </Button>
    </div>
  );
};

export default ConnectionStatus;
