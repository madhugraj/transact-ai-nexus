
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const DocumentSummarySettings: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <Label>Summary Type</Label>
        <Select defaultValue="comprehensive">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="brief">Brief Overview</SelectItem>
            <SelectItem value="comprehensive">Comprehensive</SelectItem>
            <SelectItem value="financial">Financial Focus</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Include Elements</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="elem-metadata" defaultChecked />
            <label htmlFor="elem-metadata" className="text-sm">Document Metadata</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="elem-entities" defaultChecked />
            <label htmlFor="elem-entities" className="text-sm">Named Entities</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="elem-tables" defaultChecked />
            <label htmlFor="elem-tables" className="text-sm">Tables</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="elem-amounts" defaultChecked />
            <label htmlFor="elem-amounts" className="text-sm">Monetary Amounts</label>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox id="extract-key-terms" defaultChecked />
        <label htmlFor="extract-key-terms" className="text-sm">
          Extract key terms and concepts
        </label>
      </div>
    </div>
  );
};
