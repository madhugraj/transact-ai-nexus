
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    <div className="flex space-x-2">
      <div className="flex-1">
        <Input
          placeholder="Search emails..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSearch()}
        />
      </div>
      <div className="w-20">
        <Input
          type="number"
          placeholder="50"
          value={maxResults}
          onChange={(e) => onMaxResultsChange(e.target.value)}
          min="1"
          max="500"
        />
      </div>
      <Button variant="outline" onClick={onSearch} disabled={isLoading}>
        Search
      </Button>
    </div>
  );
};

export default GmailSearchControls;
