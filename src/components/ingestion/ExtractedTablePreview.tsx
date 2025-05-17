import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Edit, Download, Loader, AlertCircle, FileJson, Files } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/services/api';

interface TableData {
  headers: string[];
  rows: string[][];
  metadata?: {
    totalRows?: number;
    confidence?: number;
    sourceFile?: string;
    title?: string;
  };
}

interface ExtractedTablePreviewProps {
  fileId?: string;
  initialData?: TableData;
  isLoading?: boolean;
  onEdit?: () => void;
  displayFormat?: 'table' | 'json';
  tableName?: string;
}

const ExtractedTablePreview: React.FC<ExtractedTablePreviewProps> = ({
  fileId,
  initialData,
  isLoading = false,
  onEdit,
  displayFormat = 'table',
  tableName = 'extracted_table'
}) => {
  const [tableData, setTableData] = useState<TableData | null>(initialData || null);
  const [loading, setLoading] = useState(isLoading);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  console.log("ExtractedTablePreview - Received data:", {
    fileId,
    initialData: initialData ? {
      headers: initialData.headers,
      rowCount: initialData.rows?.length
    } : null,
    isLoading,
    displayFormat
  });

  // Load table data from API if not provided as initialData
  useEffect(() => {
    if (initialData) {
      console.log("Setting table data from initialData", initialData);
      // Validate initial data structure
      if (initialData.headers && Array.isArray(initialData.headers) && 
          initialData.rows && Array.isArray(initialData.rows)) {
        setTableData(initialData);
      } else {
        console.error("Invalid table data structure:", initialData);
        setError("Invalid table data structure");
      }
      setLoading(false);
      return;
    }
    
    if (!fileId) {
      setError("No file or data provided for table preview");
      setLoading(false);
      return;
    }
    
    const fetchTableData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await api.getTablePreview(fileId);
        
        if (response.success && response.data) {
          console.log("Successfully fetched table data from API", response.data);
          setTableData({
            headers: response.data.headers,
            rows: response.data.rows
          });
        } else {
          setError(response.error || "Failed to load table data");
          toast({
            title: "Error loading table",
            description: response.error,
            variant: "destructive",
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(errorMessage);
        toast({
          title: "Error loading table",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTableData();
  }, [fileId, initialData, toast]);

  // Reset pagination when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [tableData]);

  // Handle export functionality
  const handleExportCSV = () => {
    if (!tableData) return;
    
    try {
      // Create CSV content
      let csvContent = '';
      
      // Add headers
      csvContent += tableData.headers.map(h => `"${h}"`).join(',') + '\n';
      
      // Add rows
      csvContent += tableData.rows.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${tableName || 'extracted_table'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({
        title: "Export successful",
        description: "Table exported as CSV",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error during export",
        variant: "destructive",
      });
    }
  };

  // Handle JSON export
  const handleExportJSON = () => {
    if (!tableData) return;
    
    try {
      const jsonData = {
        headers: tableData.headers,
        rows: tableData.rows
      };
      
      // Create and download the file
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${tableName || 'extracted_table'}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({
        title: "Export successful",
        description: "Table exported as JSON",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error during export",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card className="border-muted/40">
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
          <Loader className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Loading table data...</p>
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Card className="border-muted/40 border-red-200">
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px]">
          <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-sm text-red-500 font-medium">{error}</p>
        </CardContent>
      </Card>
    );
  }
  
  // Check if we have valid table data
  const isValidTableData = tableData && 
    Array.isArray(tableData.headers) && tableData.headers.length > 0 &&
    Array.isArray(tableData.rows) && tableData.rows.length > 0;
  
  // No data state
  if (!isValidTableData) {
    console.log("No valid table data available", tableData);
    return (
      <Card className="border-muted/40">
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px]">
          <p className="text-sm text-muted-foreground">No table data available</p>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate pagination
  const totalPages = Math.ceil(tableData.rows.length / rowsPerPage);
  const paginatedRows = tableData.rows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  
  // Render Response (JSON) view if displayFormat is 'json'
  if (displayFormat === 'json') {
    const jsonData = {
      headers: tableData.headers,
      rows: tableData.rows
    };
    
    return (
      <Card className="border-muted/40">
        <CardContent className="p-4">
          <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-xs max-h-[500px]">
            {JSON.stringify(jsonData, null, 2)}
          </pre>
          
          <div className="p-4 flex justify-between items-center border-t mt-4">
            <div className="text-sm text-muted-foreground">
              {tableData.rows.length} rows, {tableData.headers.length} columns
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onEdit}
                disabled={!onEdit}
              >
                <Edit className="h-4 w-4 mr-1" /> Edit Data
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportJSON}
              >
                <FileJson className="h-4 w-4 mr-1" /> Export JSON
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportCSV}
              >
                <Files className="h-4 w-4 mr-1" /> Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render table data (default)
  return (
    <Card className="border-muted/40">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {tableData.headers.map((header, index) => (
                  <TableHead key={index} className="font-semibold">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <TableCell key={cellIndex}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {tableData.rows.length > rowsPerPage && (
          <div className="py-4 border-t">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  // For simplicity, show first 5 pages
                  const pageNumber = i + 1;
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        isActive={pageNumber === currentPage}
                        onClick={() => setCurrentPage(pageNumber)}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {/* Show ellipsis if there are more pages */}
                {totalPages > 5 && (
                  <PaginationItem>
                    <span className="px-2">...</span>
                  </PaginationItem>
                )}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
        
        <div className="p-4 flex justify-between items-center border-t">
          <div className="text-sm text-muted-foreground">
            {tableData.rows.length} rows, {tableData.headers.length} columns
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEdit}
              disabled={!onEdit}
            >
              <Edit className="h-4 w-4 mr-1" /> Edit Data
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportJSON}
            >
              <FileJson className="h-4 w-4 mr-1" /> Export JSON
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportCSV}
            >
              <Files className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExtractedTablePreview;
