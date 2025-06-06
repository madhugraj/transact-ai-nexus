
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GmailSearchControlsProps {
  searchQuery: string;
  maxResults: string;
  isLoading: boolean;
  onSearchQueryChange: (query: string) => void;
  onMaxResultsChange: (maxResults: string) => void;
  onSearch: () => void;
}

const GmailSearchControls: React.FC<GmailSearchControlsProps> = ({
  searchQuery,
  maxResults,
  isLoading,
  onSearchQueryChange,
  onMaxResultsChange,
  onSearch
}) => {
  return (
    <div className="space-y-3">
      <div className="flex space-x-2">
        <div className="flex-1">
          <Input
            placeholder="Search emails (e.g., 'invoice', 'has:attachment', 'from:vendor@example.com')"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
          />
        </div>
        <div className="w-32">
          <Select value={maxResults} onValueChange={onMaxResultsChange}>
            <SelectTrigger>
              <SelectValue placeholder="Limit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 emails</SelectItem>
              <SelectItem value="25">25 emails</SelectItem>
              <SelectItem value="50">50 emails</SelectItem>
              <SelectItem value="100">100 emails</SelectItem>
              <SelectItem value="200">200 emails</SelectItem>
              <SelectItem value="500">500 emails</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={onSearch} disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground">
        <div className="mb-1">Search tips:</div>
        <div className="grid grid-cols-2 gap-1">
          <div>• <code>has:attachment</code> - emails with attachments</div>
          <div>• <code>from:vendor@domain.com</code> - from specific sender</div>
          <div>• <code>subject:invoice</code> - subject contains "invoice"</div>
          <div>• <code>newer_than:7d</code> - emails from last 7 days</div>
        </div>
      </div>
    </div>
  );
};

export default GmailSearchControls;
