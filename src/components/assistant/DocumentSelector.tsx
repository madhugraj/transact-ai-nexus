
import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, Table, FileText, FileImage, AlertTriangle } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { getDocumentDataById } from '@/utils/documentStorage';
import { useToast } from '@/hooks/use-toast';

export interface Document {
  id: string;
  name: string;
  type: 'table' | 'document' | 'image';
  extractedAt?: string;
}

interface DocumentSelectorProps {
  documents: Document[];
  onDocumentChange: (value: string) => void;
  selectedDocumentId?: string;
}

const DocumentSelector: React.FC<DocumentSelectorProps> = ({ 
  documents, 
  onDocumentChange,
  selectedDocumentId
}) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(selectedDocumentId || "");
  const [validDocuments, setValidDocuments] = useState<Document[]>([]);
  const { toast } = useToast();

  // Validate documents on load and filter out any that don't have data
  useEffect(() => {
    // First set the selected ID if provided
    if (selectedDocumentId) {
      setValue(selectedDocumentId);
      console.log("DocumentSelector: Setting initial ID:", selectedDocumentId);
    }

    // Validate which documents actually have data
    const validated = documents.filter(doc => {
      const hasData = getDocumentDataById(doc.id) !== null;
      if (!hasData) {
        console.log(`DocumentSelector: Document ${doc.id} (${doc.name}) has no data`);
      }
      return hasData;
    });

    if (validated.length !== documents.length) {
      console.log(`DocumentSelector: Filtered ${documents.length - validated.length} documents without data`);
    }

    setValidDocuments(validated);
  }, [documents, selectedDocumentId]);

  const handleSelect = (currentValue: string) => {
    // Verify document has data before selecting
    const docData = getDocumentDataById(currentValue);
    
    if (!docData) {
      toast({
        title: "Document data not available",
        description: "The selected document has no data associated with it",
        variant: "destructive",
      });
      return;
    }
    
    setValue(currentValue);
    setOpen(false);
    onDocumentChange(currentValue);
    
    console.log("DocumentSelector: Selected document:", currentValue);
    console.log("DocumentSelector: Document data:", docData);
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'table':
        return <Table className="h-4 w-4 text-blue-500" />;
      case 'image':
        return <FileImage className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const selectedDocument = validDocuments.find((doc) => doc.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="min-w-[200px] justify-between text-xs"
        >
          <div className="flex items-center gap-2 truncate">
            {value && selectedDocument ? (
              <>
                {getDocumentIcon(selectedDocument.type)}
                <span className="truncate">{selectedDocument.name}</span>
              </>
            ) : (
              "Select document..."
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search documents..." />
          <CommandEmpty>No documents found.</CommandEmpty>
          <ScrollArea className="h-64">
            <CommandGroup>
              {validDocuments.length > 0 ? (
                validDocuments.map((doc) => (
                  <CommandItem
                    key={doc.id}
                    value={doc.id}
                    onSelect={() => handleSelect(doc.id)}
                    className="flex items-center gap-2"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {getDocumentIcon(doc.type)}
                      <span className="truncate">{doc.name}</span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === doc.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))
              ) : (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No processed documents available.
                </div>
              )}
            </CommandGroup>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default DocumentSelector;
