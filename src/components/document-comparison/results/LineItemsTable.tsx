
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle } from "lucide-react";

interface LineItemsTableProps {
  lineItems: any[];
}

const getMatchColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const getMatchBadge = (match: boolean, score?: number) => {
  if (score !== undefined) {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">High Match</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Medium Match</Badge>;
    return <Badge className="bg-red-100 text-red-800">Low Match</Badge>;
  }
  return match ? (
    <Badge className="bg-green-100 text-green-800">
      <CheckCircle className="h-3 w-3 mr-1" />
      Match
    </Badge>
  ) : (
    <Badge className="bg-red-100 text-red-800">
      <AlertCircle className="h-3 w-3 mr-1" />
      No Match
    </Badge>
  );
};

const safeString = (value: any): string => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export const LineItemsTable: React.FC<LineItemsTableProps> = ({ lineItems }) => {
  console.log("🔍 LineItemsTable rendering with items:", lineItems);

  if (!lineItems || lineItems.length === 0) {
    return <p className="text-muted-foreground">No line items to display</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source Item</TableHead>
            <TableHead>Target Item</TableHead>
            <TableHead>Description Match</TableHead>
            <TableHead>Quantity Match</TableHead>
            <TableHead>Price Match</TableHead>
            <TableHead>HSN/SAC</TableHead>
            <TableHead>Issues</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lineItems.map((item: any, index: number) => {
            const sourceItem = item.po_item || item.source_item;
            const targetItem = item.invoice_item || item.target_item;
            
            return (
              <TableRow key={index}>
                <TableCell className="max-w-[200px]">
                  {sourceItem ? (
                    <div className="space-y-1 text-xs">
                      <div><strong>Desc:</strong> {safeString(sourceItem.partDescription || sourceItem.description)}</div>
                      <div><strong>Qty:</strong> {safeString(sourceItem.quantity)}</div>
                      <div><strong>Rate:</strong> {safeString(sourceItem.rate || sourceItem.unit_price)}</div>
                      <div><strong>Amount:</strong> {safeString(sourceItem.amount || sourceItem.total)}</div>
                      {sourceItem.hsnSac && <div><strong>HSN:</strong> {safeString(sourceItem.hsnSac)}</div>}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No source data</span>
                  )}
                </TableCell>
                <TableCell className="max-w-[200px]">
                  {targetItem ? (
                    <div className="space-y-1 text-xs">
                      <div><strong>Desc:</strong> {safeString(targetItem.description)}</div>
                      <div><strong>Qty:</strong> {safeString(targetItem.quantity)}</div>
                      <div><strong>Price:</strong> {safeString(targetItem.unit_price)}</div>
                      <div><strong>Total:</strong> {safeString(targetItem.total)}</div>
                      {targetItem.hsn_sac && <div><strong>HSN:</strong> {safeString(targetItem.hsn_sac)}</div>}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No target data</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className={getMatchColor(item.description_match || 0)}>
                    {(item.description_match || 0).toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell>
                  {getMatchBadge(item.quantity_match)}
                </TableCell>
                <TableCell>
                  {getMatchBadge(item.price_match)}
                </TableCell>
                <TableCell>
                  <div className="text-xs">
                    <div>Source: {safeString(sourceItem?.hsnSac)}</div>
                    <div>Target: {safeString(targetItem?.hsn_sac)}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs space-y-1">
                    {item.issues?.map((issue: string, i: number) => (
                      <div key={i} className="text-red-600">{safeString(issue)}</div>
                    )) || <span className="text-green-600">None</span>}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
