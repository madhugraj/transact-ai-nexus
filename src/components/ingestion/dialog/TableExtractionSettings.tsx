
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ProcessingOptions } from '@/types/processing';

interface TableExtractionSettingsProps {
  processingOptions: ProcessingOptions;
  setProcessingOptions: React.Dispatch<React.SetStateAction<ProcessingOptions>>;
}

export const TableExtractionSettings: React.FC<TableExtractionSettingsProps> = ({ 
  processingOptions, 
  setProcessingOptions 
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Table Headers</Label>
          <Select 
            value={processingOptions.tableFormat?.hasHeaders ? "yes" : "no"}
            onValueChange={(val) => setProcessingOptions(prev => ({
              ...prev,
              tableFormat: {
                ...prev.tableFormat,
                hasHeaders: val === "yes"
              }
            }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">First row is header</SelectItem>
              <SelectItem value="no">No headers in table</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {processingOptions.tableFormat?.hasHeaders && (
          <div>
            <Label>Header Row</Label>
            <Input 
              type="number" 
              min="1" 
              value={processingOptions.tableFormat.headerRow}
              onChange={(e) => setProcessingOptions(prev => ({
                ...prev,
                tableFormat: {
                  ...prev.tableFormat,
                  headerRow: parseInt(e.target.value)
                }
              }))}
            />
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Label>Skip Rows</Label>
        <Input 
          type="number" 
          min="0"
          value={processingOptions.tableFormat?.skipRows}
          onChange={(e) => setProcessingOptions(prev => ({
            ...prev,
            tableFormat: {
              ...prev.tableFormat,
              skipRows: parseInt(e.target.value)
            }
          }))}
        />
        <p className="text-xs text-muted-foreground">
          Number of rows to skip from the top of the document
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="normalize-data"
          checked={processingOptions.dataProcessing?.normalizeData}
          onCheckedChange={(checked) => setProcessingOptions(prev => ({
            ...prev,
            dataProcessing: {
              ...prev.dataProcessing,
              normalizeData: checked === true
            }
          }))}
        />
        <label htmlFor="normalize-data" className="text-sm">
          Normalize extracted data
        </label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="detect-types"
          checked={processingOptions.dataProcessing?.detectTypes}
          onCheckedChange={(checked) => setProcessingOptions(prev => ({
            ...prev,
            dataProcessing: {
              ...prev.dataProcessing,
              detectTypes: checked === true
            }
          }))}
        />
        <label htmlFor="detect-types" className="text-sm">
          Auto-detect data types
        </label>
      </div>
    </div>
  );
};
