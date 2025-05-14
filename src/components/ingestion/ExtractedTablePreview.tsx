
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/services/api';

interface ExtractedTablePreviewProps {
  fileId?: string;
  initialData?: {
    headers: string[];
    rows: string[][];
  };
  isLoading?: boolean;
  onExport?: (format: 'csv' | 'excel') => void;
}

const ExtractedTablePreview: React.FC<ExtractedTablePreviewProps> = ({
  fileId,
  initialData,
  isLoading: externalIsLoading = false,
  onExport
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(externalIsLoading);
  const [tableData, setTableData] = useState<api.TableData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rowsPerPage = 10;
  const { toast } = useToast();

  // Fetch table data when fileId changes or search/pagination parameters change
  useEffect(() => {
    const fetchTableData = async () => {
      if (!fileId) {
        // If no fileId is provided but we have initialData, use that
        if (initialData) {
          setTableData({
            headers: initialData.headers,
            rows: initialData.rows,
            metadata: {
              totalRows: initialData.rows.length,
              confidence: 0,
              sourceFile: ''
            }
          });
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.getTablePreview(fileId, currentPage, rowsPerPage, searchTerm);
        
        if (!response.success) {
          setError(response.error || 'Failed to fetch table data');
          toast({
            title: "Error loading table",
            description: response.error,
            variant: "destructive",
          });
        } else {
          setTableData(response.data!);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error loading table data';
        setError(errorMessage);
        toast({
          title: "Error loading table",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTableData();
  }, [fileId, currentPage, searchTerm, initialData, toast]);

  // Handle export with real API
  const handleExport = async (format: 'csv' | 'excel') => {
    if (onExport) {
      onExport(format);
      return;
    }

    if (!fileId) {
      toast({
        title: "Export error",
        description: "No file to export",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.exportTableData(fileId, format);
      
      if (!response.success) {
        toast({
          title: "Export failed",
          description: response.error,
          variant: "destructive",
        });
        return;
      }
      
      // Create download link
      const url = window.URL.createObjectURL(response.data!);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `table-data.${format === 'csv' ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({
        title: "Export successful",
        description: `Table exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export error",
        description: error instanceof Error ? error.message : 'Unknown error during export',
        variant: "destructive",
      });
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    if (!tableData) return [];
    
    const totalPages = Math.ceil(tableData.metadata.totalRows / rowsPerPage);
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages are less than or equal to max visible pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include first page
      pageNumbers.push(1);
      
      // Calculate start and end of middle pages
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(currentPage + 1, totalPages - 1);
      
      // Adjust if at the beginning
      if (currentPage <= 3) {
        endPage = 4;
      }
      
      // Adjust if at the end
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3;
      }
      
      // Add ellipsis if needed before middle pages
      if (startPage > 2) {
        pageNumbers.push('ellipsis');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis if needed after middle pages
      if (endPage < totalPages - 1) {
        pageNumbers.push('ellipsis');
      }
      
      // Always include last page
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  const headers = tableData?.headers || [];
  const rows = tableData?.rows || [];
  const totalPages = tableData ? Math.ceil(tableData.metadata.totalRows / rowsPerPage) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search table content..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleExport('csv')}
            disabled={isLoading || !tableData?.rows.length}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleExport('excel')}
            disabled={isLoading || !tableData?.rows.length}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header, i) => (
                <TableHead key={`header-${i}`} className="font-medium">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={headers.length || 1}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading table data...
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={headers.length || 1}
                  className="h-24 text-center text-red-500"
                >
                  Error: {error}
                </TableCell>
              </TableRow>
            ) : rows.length > 0 ? (
              rows.map((row, rowIndex) => (
                <TableRow key={`row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <TableCell key={`cell-${rowIndex}-${cellIndex}`}>
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={headers.length || 1}
                  className="h-24 text-center"
                >
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage(prev => Math.max(1, prev - 1));
                }}
                aria-disabled={currentPage === 1}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {getPageNumbers().map((pageNum, index) => (
              pageNum === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={`page-${pageNum}`}>
                  <PaginationLink 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(pageNum as number);
                    }}
                    isActive={currentPage === pageNum}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              )
            ))}
            
            <PaginationItem>
              <PaginationNext 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage(prev => Math.min(totalPages, prev + 1));
                }}
                aria-disabled={currentPage === totalPages}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      
      {/* Show confidence score if available */}
      {tableData?.metadata.confidence !== undefined && (
        <div className="text-sm text-muted-foreground">
          Extraction confidence: {Math.round(tableData.metadata.confidence * 100)}%
        </div>
      )}
    </div>
  );
};

export default ExtractedTablePreview;
