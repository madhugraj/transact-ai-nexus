
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isLoading: boolean;
  onRefresh: () => void;
  onDisconnect: () => void;
}

const ConnectionStatus = ({ isConnected, isLoading, onRefresh, onDisconnect }: ConnectionStatusProps) => {
  if (!isConnected) return null;

  return (
    <div className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm text-green-700">Connected to Google Drive</span>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
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
