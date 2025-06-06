
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isLoading: boolean;
  onRefresh: () => void;
  onDisconnect: () => void;
}

const ConnectionStatus = ({ isConnected, isLoading, onRefresh, onDisconnect }: ConnectionStatusProps) => {
  if (!isConnected) return null;

  return (
    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-green-700 font-medium">Connected to Google Drive</span>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button variant="outline" size="sm" onClick={onDisconnect}>
          Disconnect
        </Button>
      </div>
    </div>
  );
};

export default ConnectionStatus;
