
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const DataCombiningSettings: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <Label>Combine Method</Label>
        <Select defaultValue="append">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="append">Append (stack vertically)</SelectItem>
            <SelectItem value="merge">Merge on common columns</SelectItem>
            <SelectItem value="union">Union (distinct rows)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Match Columns</Label>
        <Select defaultValue="auto">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto-detect columns</SelectItem>
            <SelectItem value="name">Match by column name</SelectItem>
            <SelectItem value="position">Match by position</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox id="remove-empty-rows" defaultChecked />
        <label htmlFor="remove-empty-rows" className="text-sm">
          Remove empty rows
        </label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox id="normalize-combined-data" defaultChecked />
        <label htmlFor="normalize-combined-data" className="text-sm">
          Normalize column names across files
        </label>
      </div>
    </div>
  );
};
