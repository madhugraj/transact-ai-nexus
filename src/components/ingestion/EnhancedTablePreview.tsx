
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TableIcon, Code, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EnhancedTablePreviewProps {
  initialData?: {
    headers: string[];
    rows: any[][];
    metadata?: any;
  };
  isLoading?: boolean;
  multipleTablesData?: Array<{
    title: string;
    headers: string[];
    rows: any[][];
  }>;
}

const EnhancedTablePreview: React.FC<EnhancedTablePreviewProps> = ({ initialData, isLoading, multipleTablesData }) => {
  const [displayFormat, setDisplayFormat] = useState<'table' | 'json'>('table');
  const [currentTableIndex, setCurrentTableIndex] = useState(0);
  
  // Get all tables data: if multipleTablesData is provided, use it; otherwise create array from single initialData
  const allTables = multipleTablesData || (initialData ? [{ 
    title: 'Extracted Table', 
    headers: initialData.headers, 
    rows: initialData.rows 
  }] : []);
  
  const hasMultipleTables = allTables.length > 1;
  const currentTable = allTables[currentTableIndex] || null;
  
  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Extracting table data...</p>
        </div>
      </div>
    );
  }
  
  if (!currentTable && allTables.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center border rounded-md bg-muted/20">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <TableIcon className="h-8 w-8" />
          <p className="text-sm">No table data available</p>
        </div>
      </div>
    );
  }
  
  const renderTableOrJson = (table: { headers: string[], rows: any[][] }, index: number) => {
    if (displayFormat === 'table') {
      return (
        <div className="overflow-auto max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                {table.headers.map((header, i) => (
                  <TableHead key={`${index}-header-${i}`}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.rows.map((row, rowIndex) => (
                <TableRow key={`${index}-row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <TableCell key={`${index}-cell-${rowIndex}-${cellIndex}`}>
                      {cell || ''}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    } else {
      // JSON format
      const jsonData = {
        headers: table.headers,
        rows: table.rows
      };
      
      return (
        <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[400px] text-xs">
          {JSON.stringify(jsonData, null, 2)}
        </pre>
      );
    }
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <CardTitle className="text-base flex items-center gap-2">
              <TableIcon className="h-4 w-4" /> 
              {currentTable?.title || 'Extracted Table'}
            </CardTitle>
            {hasMultipleTables && (
              <p className="text-xs text-muted-foreground mt-1">
                Showing table {currentTableIndex + 1} of {allTables.length}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={displayFormat === 'table' ? "default" : "outline"}
              size="sm"
              onClick={() => setDisplayFormat('table')}
            >
              <TableIcon className="h-3.5 w-3.5 mr-1" /> Table
            </Button>
            <Button
              variant={displayFormat === 'json' ? "default" : "outline"}
              size="sm"
              onClick={() => setDisplayFormat('json')}
            >
              <Code className="h-3.5 w-3.5 mr-1" /> JSON
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        {hasMultipleTables && (
          <div className="mb-4 overflow-auto pb-2">
            <div className="flex gap-2 flex-nowrap">
              {allTables.map((table, idx) => (
                <Badge 
                  key={`table-${idx}`}
                  variant={currentTableIndex === idx ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setCurrentTableIndex(idx)}
                >
                  Table {idx + 1}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {currentTable && renderTableOrJson(currentTable, currentTableIndex)}
        
        {initialData?.metadata && (
          <div className="mt-4 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5" />
            <span>
              {initialData.metadata.totalRows || currentTable?.rows.length} rows extracted
              {initialData.metadata.confidence && ` with ${(initialData.metadata.confidence * 100).toFixed(0)}% confidence`}
              {initialData.metadata.sourceFile && ` from ${initialData.metadata.sourceFile}`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedTablePreview;
