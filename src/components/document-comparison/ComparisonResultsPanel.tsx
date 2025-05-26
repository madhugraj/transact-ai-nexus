import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ComparisonResult {
  field: string;
  sourceValue: string | number;
  targetValue: string | number;
  isMatch: boolean;
}

interface RowComparison {
  fieldValues: {
    [field: string]: {
      sourceValue: string | number;
      targetValue: string | number;
      isMatch: boolean;
    };
  };
  remarks?: string;
}

interface SectionComparison {
  sectionName: string;
  rows: RowComparison[];
}

interface DetailedComparisonResult {
  overallMatch: number;
  headerResults: ComparisonResult[];
  sections: SectionComparison[];
}

interface ComparisonResultsPanelProps {
  result: DetailedComparisonResult;
}

const ComparisonResultsPanel: React.FC<ComparisonResultsPanelProps> = ({ result }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <h3 className="text-xl font-semibold mb-2">Overall Match: {result.overallMatch}%</h3>

          <h4 className="text-lg font-semibold mt-4 mb-2">Header Comparison</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Match</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.headerResults.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.field}</TableCell>
                  <TableCell>{item.sourceValue}</TableCell>
                  <TableCell>{item.targetValue}</TableCell>
                  <TableCell>
                    {item.isMatch ? (
                      <span className="text-green-600 font-bold">✓</span>
                    ) : (
                      <span className="text-red-600 font-bold">✗</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {result.sections.map((section, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <h4 className="text-lg font-semibold mb-2">{section.sectionName}</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Match</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {section.rows.map((row, rowIndex) =>
                  Object.entries(row.fieldValues).map(([field, values], fieldIndex) => (
                    <TableRow key={`${rowIndex}-${fieldIndex}`}>
                      <TableCell>{field}</TableCell>
                      <TableCell>{values.sourceValue}</TableCell>
                      <TableCell>{values.targetValue}</TableCell>
                      <TableCell>
                        {values.isMatch ? (
                          <span className="text-green-600 font-bold">✓</span>
                        ) : (
                          <span className="text-red-600 font-bold">✗</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ComparisonResultsPanel;
