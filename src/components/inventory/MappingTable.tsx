
import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InventoryItem, MappingResult } from "@/types/inventoryMapping";
import { Check, AlertCircle } from "lucide-react";

interface MappingTableProps {
  sourceItems: InventoryItem[];
  mappingResults: Record<string, MappingResult>;
  onUpdateMapping: (itemId: string, targetCode: string, targetSystem: string) => void;
  selectedTargetSystem: string;
}

export function MappingTable({ 
  sourceItems, 
  mappingResults, 
  onUpdateMapping,
  selectedTargetSystem
}: MappingTableProps) {
  const [filter, setFilter] = useState<string>("");
  
  // Generate target options for the demo
  const generateTargetOptions = (itemName: string, system: string) => {
    const options = [];
    const prefix = system === 'SAP' 
      ? 'MAT' 
      : system === 'QuickBooks' 
        ? 'QB' 
        : system === 'Xero' 
          ? 'XER' 
          : 'ZOH';
    
    const itemPrefix = itemName.substring(0, 3).toUpperCase();
    
    for (let i = 0; i < 3; i++) {
      const randomNum = Math.floor(Math.random() * 900000) + 100000;
      options.push(`${prefix}-${itemPrefix}${randomNum}`);
    }
    
    return options;
  };
  
  // Filter items by name if filter is active
  const filteredItems = filter 
    ? sourceItems.filter(item => 
        item.name.toLowerCase().includes(filter.toLowerCase()) || 
        (item.sku && item.sku.toString().toLowerCase().includes(filter.toLowerCase()))
      )
    : sourceItems;
  
  return (
    <div className="space-y-3">
      <div className="w-full">
        <Input
          placeholder="Filter by item name or SKU..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[30%]">Source Item</TableHead>
              <TableHead className="w-[55%]">Target Code</TableHead>
              <TableHead className="w-[15%] text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => {
              const result = mappingResults[item.id];
              const isUnmapped = !result?.targetCode;
              const isAmbiguous = result?.isAmbiguous;
              
              return (
                <TableRow 
                  key={item.id}
                  className={
                    isUnmapped
                      ? "bg-amber-50/30"
                      : isAmbiguous
                        ? "bg-blue-50/30"
                        : "bg-green-50/30"
                  }
                >
                  <TableCell>
                    <div className="font-medium truncate max-w-[250px]" title={item.name}>{item.name}</div>
                    {item.sku && (
                      <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {selectedTargetSystem ? (
                      <Select
                        value={result?.targetCode || ""}
                        onValueChange={(value) => {
                          onUpdateMapping(
                            item.id, 
                            value, 
                            selectedTargetSystem
                          );
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select code" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Auto-matched option first if available */}
                          {result?.targetCode && (
                            <SelectItem value={result.targetCode}>
                              <div className="flex items-center">
                                <span className="truncate max-w-[180px]" title={result.targetCode}>{result.targetCode}</span>
                                {result.confidenceScore && (
                                  <Badge 
                                    variant="outline" 
                                    className="ml-2 bg-blue-50 text-blue-700 text-xs"
                                  >
                                    {result.confidenceScore}%
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          )}
                          
                          {/* Additional options */}
                          {generateTargetOptions(item.name, selectedTargetSystem).map((option) => (
                            option !== result?.targetCode && (
                              <SelectItem key={option} value={option}>
                                <span className="truncate max-w-[180px]" title={option}>{option}</span>
                              </SelectItem>
                            )
                          ))}
                          
                          {/* Custom option */}
                          <SelectItem value="custom">Custom Entry...</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">
                        Select target system first
                      </div>
                    )}
                    
                    {/* Show input for custom entry if custom is selected */}
                    {result?.targetCode === "custom" && (
                      <Input
                        className="mt-2"
                        placeholder="Enter custom code..."
                        onChange={(e) => {
                          onUpdateMapping(
                            item.id, 
                            e.target.value, 
                            selectedTargetSystem
                          );
                        }}
                      />
                    )}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    {isUnmapped ? (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Unmapped
                      </Badge>
                    ) : isAmbiguous ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        Suggested
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <Check className="h-3 w-3 mr-1" />
                        Confirmed
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                  No items match the current filter
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground px-2">
        <div>
          Showing {filteredItems.length} of {sourceItems.length} items
        </div>
        <div className="flex gap-4">
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-amber-500 mr-1"></div>
            <span>Unmapped</span>
          </div>
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-blue-500 mr-1"></div>
            <span>Suggested</span>
          </div>
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-green-500 mr-1"></div>
            <span>Confirmed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
