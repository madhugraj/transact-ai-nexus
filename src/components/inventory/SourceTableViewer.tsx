
import { useState } from "react";
import { InventoryItem } from "@/types/inventoryMapping";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff } from "lucide-react";

interface SourceTableViewerProps {
  items: InventoryItem[];
  maxRows?: number;
}

export function SourceTableViewer({ items, maxRows = 5 }: SourceTableViewerProps) {
  const [showAll, setShowAll] = useState(false);
  
  // Get all unique keys from all items to use as headers
  const allKeys = new Set<string>();
  items.forEach(item => {
    Object.keys(item).forEach(key => {
      if (key !== 'id') {
        allKeys.add(key);
      }
    });
  });
  
  // Prioritize important columns
  const priorityKeys = ['name', 'quantity', 'unitPrice', 'description', 'sku', 'category'];
  const sortedKeys = [...allKeys].sort((a, b) => {
    const aIndex = priorityKeys.indexOf(a);
    const bIndex = priorityKeys.indexOf(b);
    
    if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
    if (aIndex >= 0) return -1;
    if (bIndex >= 0) return 1;
    return a.localeCompare(b);
  });
  
  // Limit displayed keys to keep table manageable
  const displayKeys = sortedKeys.slice(0, 6);
  
  const displayedItems = showAll ? items : items.slice(0, maxRows);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">Source Items ({items.length})</h4>
        <Badge variant="outline" className="text-xs">
          {items.length} items detected
        </Badge>
      </div>
      
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {displayKeys.map(key => (
                <TableHead key={key} className="text-xs whitespace-nowrap">
                  {key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedItems.map((item, index) => (
              <TableRow key={item.id || index}>
                {displayKeys.map(key => (
                  <TableCell key={`${item.id}-${key}`} className="text-xs">
                    <div className="truncate max-w-[150px]" title={String(item[key] !== undefined ? item[key] : '-')}>
                      {item[key] !== undefined ? String(item[key]) : '-'}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {items.length > maxRows && (
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? (
            <>
              <EyeOff className="h-3 w-3 mr-1" />
              Show fewer rows
            </>
          ) : (
            <>
              <Eye className="h-3 w-3 mr-1" />
              Show all {items.length} rows
            </>
          )}
        </Button>
      )}
    </div>
  );
}
