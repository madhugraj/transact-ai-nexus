
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Download, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TableData {
  headers: string[];
  rows: any[][];
  metadata?: {
    totalRows?: number;
    confidence?: number;
    sourceFile?: string;
  };
}

interface EnhancedTablePreviewProps {
  initialData: TableData;
  displayFormat?: 'table' | 'json';
  isLoading?: boolean;
  onDownload?: (format: 'csv' | 'xlsx' | 'json') => void;
  className?: string;
}

const EnhancedTablePreview: React.FC<EnhancedTablePreviewProps> = ({
  initialData,
  displayFormat = 'table',
  isLoading = false,
  onDownload,
  className
}) => {
  const [activeFormat, setActiveFormat] = useState<'table' | 'json'>(displayFormat);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    setActiveFormat(displayFormat);
  }, [displayFormat]);
  
  const handleCopyToClipboard = () => {
    // Build JSON string with proper indentation
    const jsonContent = JSON.stringify({
      headers: initialData.headers,
      data: initialData.rows
    }, null, 2);
    
    navigator.clipboard.writeText(jsonContent)
      .then(() => {
        setIsCopied(true);
        toast({
          title: "Copied to clipboard",
          description: "Table data copied as JSON",
        });
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        toast({
          title: "Copy failed",
          description: "Could not copy to clipboard",
          variant: "destructive",
        });
      });
  };
  
  const handleDownload = (format: 'csv' | 'xlsx' | 'json') => {
    if (onDownload) {
      onDownload(format);
      return;
    }
    
    if (format === 'csv') {
      // Create CSV content
      let csvContent = '';
      
      // Add headers
      csvContent += initialData.headers.map(h => `"${h}"`).join(',') + '\n';
      
      // Add rows
      csvContent += initialData.rows.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `table-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({
        title: "Download complete",
        description: "Table exported as CSV",
      });
    } else if (format === 'json') {
      // Create JSON content
      const jsonContent = JSON.stringify({
        headers: initialData.headers,
        data: initialData.rows
      }, null, 2);
      
      // Create and trigger download
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `table-export-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({
        title: "Download complete",
        description: "Table exported as JSON",
      });
    } else {
      toast({
        title: "Not supported",
        description: `Export to ${format} is not implemented yet`,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6 flex items-center justify-center min-h-[200px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading table data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!initialData || !initialData.headers || !initialData.rows) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No table data available</p>
        </CardContent>
      </Card>
    );
  }
  
  const TableContent = () => (
    <div className="overflow-auto max-h-[500px] border rounded-md">
      <table className="w-full min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            {initialData.headers.map((header, idx) => (
              <th
                key={`header-${idx}`}
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {initialData.rows.map((row, rowIdx) => (
            <tr key={`row-${rowIdx}`} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {row.map((cell, cellIdx) => (
                <td
                  key={`cell-${rowIdx}-${cellIdx}`}
                  className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]"
                  title={String(cell)}
                >
                  {String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  
  const JsonContent = () => (
    <div className="relative">
      <pre className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[500px] text-sm text-gray-800">
        {JSON.stringify({
          headers: initialData.headers,
          data: initialData.rows
        }, null, 2)}
      </pre>
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2"
        onClick={handleCopyToClipboard}
      >
        {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <Tabs value={activeFormat} onValueChange={(v) => setActiveFormat(v as 'table' | 'json')}>
            <TabsList>
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="json">JSON View</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="space-x-2">
            <Button size="sm" variant="outline" onClick={() => handleDownload('csv')}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleDownload('json')}>
              <Download className="h-4 w-4 mr-1" /> JSON
            </Button>
          </div>
        </div>
        
        <div className="mt-4">
          {activeFormat === 'table' ? <TableContent /> : <JsonContent />}
        </div>
        
        {initialData.metadata && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            {initialData.metadata.totalRows !== undefined && (
              <div>{initialData.metadata.totalRows} rows</div>
            )}
            {initialData.metadata.confidence !== undefined && (
              <div>•&nbsp;&nbsp;Confidence: {Math.round(initialData.metadata.confidence * 100)}%</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedTablePreview;
