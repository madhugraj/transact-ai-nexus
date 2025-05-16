
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableIcon, FileText } from 'lucide-react';

export interface Document {
  id: string;
  name: string;
  type: 'table' | 'document' | 'image';
  extractedAt: string;
}

interface DocumentSelectorProps {
  documents: Document[];
  onDocumentChange: (value: string) => void;
}

const DocumentSelector: React.FC<DocumentSelectorProps> = ({ documents, onDocumentChange }) => {
  return (
    <Select onValueChange={onDocumentChange}>
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder="Select a document" />
      </SelectTrigger>
      <SelectContent>
        {documents.length === 0 ? (
          <div className="p-2 text-center text-sm text-muted-foreground">
            No processed documents found
          </div>
        ) : (
          documents.map((doc) => (
            <SelectItem key={doc.id} value={doc.id}>
              <div className="flex items-center">
                {doc.type === 'table' ? (
                  <TableIcon className="h-4 w-4 mr-2 text-blue-500" />
                ) : (
                  <FileText className="h-4 w-4 mr-2 text-blue-500" />
                )}
                {doc.name}
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};

export default DocumentSelector;
