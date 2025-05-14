
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const InsightSettings: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <Label>Analysis Type</Label>
        <Select defaultValue="standard">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard Analysis</SelectItem>
            <SelectItem value="financial">Financial Analysis</SelectItem>
            <SelectItem value="detailed">Detailed Breakdown</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Key Metrics</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="metric-amounts" defaultChecked />
            <label htmlFor="metric-amounts" className="text-sm">Amount Analysis</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="metric-dates" defaultChecked />
            <label htmlFor="metric-dates" className="text-sm">Date Patterns</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="metric-vendors" defaultChecked />
            <label htmlFor="metric-vendors" className="text-sm">Vendor Analysis</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="metric-category" defaultChecked />
            <label htmlFor="metric-category" className="text-sm">Category Detection</label>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Visualization Options</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="viz-charts" defaultChecked />
            <label htmlFor="viz-charts" className="text-sm">Generate Charts</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="viz-summary" defaultChecked />
            <label htmlFor="viz-summary" className="text-sm">Summary Tables</label>
          </div>
        </div>
      </div>
    </div>
  );
};
