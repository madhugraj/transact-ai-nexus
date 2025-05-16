
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import EnhancedTablePreview from './EnhancedTablePreview';
import { getTableById } from '@/services/supabase/tableService';
import { ensureStringArray, ensure2DArray } from '@/utils/documentHelpers';

interface ExtractedTablePreviewProps {
  fileId?: string;
  initialData?: {
    headers: string[];
    rows: any[][];
  };
  displayFormat?: 'table' | 'json';
  isLoading?: boolean;
}

const ExtractedTablePreview: React.FC<ExtractedTablePreviewProps> = ({ 
  fileId,
  initialData,
  displayFormat = 'table',
  isLoading: externalLoading
}) => {
  const [isLoading, setIsLoading] = useState(externalLoading || false);
  const [tableData, setTableData] = useState<any | null>(initialData || null);
  const [multipleTablesData, setMultipleTablesData] = useState<Array<{
    title: string;
    headers: string[];
    rows: any[][];
  }> | null>(null);
  
  // Fetch table data from Supabase if fileId is provided and no initial data
  useEffect(() => {
    const fetchTableData = async () => {
      if (!fileId || initialData) return;
      
      setIsLoading(true);
      
      try {
        console.log("Fetching table data for fileId:", fileId);
        const tableData = await getTableById(fileId);
        
        if (tableData) {
          console.log("Table data fetched:", tableData);
          
          // Format for display
          setTableData({
            headers: ensureStringArray(tableData.headers),
            rows: ensure2DArray(tableData.rows),
            metadata: {
              confidence: tableData.confidence || 0.9,
              sourceFile: tableData.title || 'Unknown'
            }
          });
          
          // Check if there are other tables linked to this file
          // This is a placeholder - implement API call to get all tables for the file
        } else {
          console.log("No table data found for fileId:", fileId);
          setTableData(null);
        }
      } catch (error) {
        console.error("Error fetching table data:", error);
        setTableData(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTableData();
  }, [fileId, initialData]);
  
  // This effect handles checking for multiple tables in the data
  useEffect(() => {
    if (tableData && Array.isArray(tableData.allTables) && tableData.allTables.length > 0) {
      // Format for multiple tables display
      setMultipleTablesData(tableData.allTables.map((table: any) => ({
        title: table.title || 'Extracted Table',
        headers: ensureStringArray(table.headers),
        rows: ensure2DArray(table.rows)
      })));
    } else {
      setMultipleTablesData(null);
    }
  }, [tableData]);
  
  if (!fileId && !initialData && !externalLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground border rounded-md">
        No table data to display
      </div>
    );
  }
  
  return (
    <EnhancedTablePreview 
      initialData={tableData}
      multipleTablesData={multipleTablesData}
      isLoading={isLoading || externalLoading}
    />
  );
};

export default ExtractedTablePreview;
