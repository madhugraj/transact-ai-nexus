
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ComparisonResult } from "./DocumentComparison";

interface ComparisonResultsPanelProps {
  poFile: File | null;
  invoiceFiles: File[];
  activeInvoiceIndex: number;
  setActiveInvoiceIndex: (index: number) => void;
  comparisonResults: ComparisonResult[];
  matchPercentage: number;
}

export const ComparisonResultsPanel: React.FC<ComparisonResultsPanelProps> = ({
  poFile,
  invoiceFiles,
  activeInvoiceIndex,
  setActiveInvoiceIndex,
  comparisonResults,
  matchPercentage
}) => {
  return (
    <>
      {/* Invoice selector if multiple invoices */}
      {invoiceFiles.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {invoiceFiles.map((file, index) => (
            <Button
              key={index}
              variant={activeInvoiceIndex === index ? "default" : "outline"}
              className="text-xs"
              onClick={() => setActiveInvoiceIndex(index)}
            >
              {file.name}
            </Button>
          ))}
        </div>
      )}
      
      {/* Comparison Summary - Simplified and minimalistic as requested */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            Document Comparison
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {poFile?.name} vs {invoiceFiles[activeInvoiceIndex]?.name}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <div className="inline-block px-4 py-2 rounded-md bg-red-100 dark:bg-red-900/30">
              <span className="text-2xl font-bold text-red-700 dark:text-red-300">{matchPercentage}% Match</span>
            </div>
          </div>
          
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead>PO Value</TableHead>
                  <TableHead>Invoice Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonResults.map((result, index) => (
                  <TableRow key={index} className={result.match ? "" : "bg-red-50 dark:bg-red-900/10"}>
                    <TableCell className="font-medium">{result.field}</TableCell>
                    <TableCell>{result.poValue}</TableCell>
                    <TableCell>{result.invoiceValue}</TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        result.match 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                      }`}>
                        {result.match ? "Match" : "Mismatch"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Simple Download Button */}
      <div className="flex justify-end">
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Comparison Report
        </Button>
      </div>
    </>
  );
};
