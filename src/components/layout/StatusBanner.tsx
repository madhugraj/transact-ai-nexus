
import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const StatusBanner = () => {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('System ready');

  // For demo purposes, cycle through different statuses
  useEffect(() => {
    const interval = setInterval(() => {
      const statuses: Array<'idle' | 'processing' | 'success' | 'error'> = ['idle', 'processing', 'success', 'error'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      if (randomStatus === 'processing') {
        setMessage('Processing invoice batch...');
      } else if (randomStatus === 'success') {
        setMessage('3 invoices successfully processed');
      } else if (randomStatus === 'error') {
        setMessage('Error: Failed to connect to ERP system');
      } else {
        setMessage('System ready');
      }
      
      setStatus(randomStatus);
    }, 10000); // Change status every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center">
      {status === 'processing' && (
        <div className="flex items-center text-status-processing">
          <div className="h-2 w-2 rounded-full bg-status-processing animate-pulse mr-2"></div>
          <span>{message}</span>
        </div>
      )}
      
      {status === 'success' && (
        <div className="flex items-center text-status-approved">
          <CheckCircle2 className="h-4 w-4 mr-2" />
          <span>{message}</span>
        </div>
      )}
      
      {status === 'error' && (
        <div className="flex items-center text-status-rejected">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span>{message}</span>
        </div>
      )}
      
      {status === 'idle' && (
        <div className="flex items-center text-muted-foreground">
          <span>{message}</span>
        </div>
      )}
    </div>
  );
};

export default StatusBanner;
