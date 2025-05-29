
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle } from "lucide-react";

interface FieldComparisonTableProps {
  fields: any[];
}

const getMatchColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const getMatchBadge = (match: boolean) => {
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

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === 'object') {
    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => 
        typeof item === 'object' ? JSON.stringify(item) : String(item)
      ).join(', ');
    }
    // Handle objects - extract meaningful data
    if (value.description || value.partDescription) {
      return value.description || value.partDescription;
    }
    if (value.amount || value.total) {
      return String(value.amount || value.total);
    }
    if (value.quantity) {
      return String(value.quantity);
    }
    // Fallback to string representation
    return JSON.stringify(value);
  }
  return String(value);
};

export const FieldComparisonTable: React.FC<FieldComparisonTableProps> = ({ fields }) => {
  console.log("🔍 FieldComparisonTable rendering with fields:", fields);

  if (!fields || fields.length === 0) {
    return <p className="text-muted-foreground">No field comparisons available</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Field</TableHead>
          <TableHead>Source Value</TableHead>
          <TableHead>Target Value</TableHead>
          <TableHead>Match %</TableHead>
          <TableHead>Weight</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fields.map((field: any, fieldIndex: number) => (
          <TableRow key={fieldIndex}>
            <TableCell className="font-medium">{field.field || 'Unknown Field'}</TableCell>
            <TableCell className="max-w-[150px] truncate" title={formatValue(field.source_value)}>
              {formatValue(field.source_value)}
            </TableCell>
            <TableCell className="max-w-[150px] truncate" title={formatValue(field.target_value)}>
              {formatValue(field.target_value)}
            </TableCell>
            <TableCell>
              <span className={getMatchColor(field.match_percentage || 0)}>
                {(field.match_percentage || 0).toFixed(1)}%
              </span>
            </TableCell>
            <TableCell>{Math.round((field.weight || 0) * 100)}%</TableCell>
            <TableCell>
              {getMatchBadge(field.match)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
