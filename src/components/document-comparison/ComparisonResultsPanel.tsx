import React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { FileIcon, InfoIcon } from "lucide-react";
import { ComparisonResult, DetailedComparisonResult } from "@/types/comparison";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ComparisonResultsPanelProps {
  poFile: File | null;
  invoiceFiles: File[];
  activeInvoiceIndex: number;
  setActiveInvoiceIndex: (index: number) => void;
  comparisonResults: ComparisonResult[];
  matchPercentage: number;
  detailedResults: DetailedComparisonResult; // ✅ Passed as prop
}

// ...all previous imports remain unchanged

export const ComparisonResultsPanel: React.FC<ComparisonResultsPanelProps> = ({
  poFile,
  invoiceFiles,
  activeInvoiceIndex,
  setActiveInvoiceIndex,
  comparisonResults,
  matchPercentage,
  detailedResults,
}) => {
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="text-lg font-semibold">Comparison Results</div>

      <Tabs value={`invoice-${activeInvoiceIndex}`} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="po">PO</TabsTrigger>
          {invoiceFiles.map((file, index) => (
            <TabsTrigger
              key={index}
              value={`invoice-${index}`}
              onClick={() => setActiveInvoiceIndex(index)}
              className={cn({
                "bg-muted": index === activeInvoiceIndex,
              })}
            >
              Invoice {index + 1}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="po">
          <ScrollArea className="h-[300px] w-full rounded-md border p-4">
            <div className="flex items-center gap-2 mb-4">
              <FileIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{poFile?.name}</span>
            </div>
            <div className="text-sm">PO Details will be shown here.</div>
          </ScrollArea>
        </TabsContent>

        {invoiceFiles.map((file, index) => (
          <TabsContent key={index} value={`invoice-${index}`}>
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              <div className="flex items-center gap-2 mb-4">
                <FileIcon className="h-4 w-4" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
              <div className="text-sm">Invoice {index + 1} Details will be shown here.</div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-4">
        <div className="text-sm font-medium mb-1">
          Match Percentage: {matchPercentage}%
        </div>
        <Progress value={matchPercentage} />
      </div>

      {detailedResults && (
        <div className="mt-6">
          <div className="text-base font-semibold mb-2">Detailed Comparison</div>

          {detailedResults.matchedFields?.map((field, index) => (
            <div key={index} className="mb-2">
              <div className="text-sm font-medium text-green-600">
                ✅ {field.fieldName}
              </div>
              <div className="text-xs text-muted-foreground">
                PO: {field.poValue} | Invoice: {field.invoiceValue}
              </div>
            </div>
          ))}

          {detailedResults.mismatchedFields?.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="text-base font-semibold mb-2 text-red-600">
                Mismatches
              </div>
              {detailedResults.mismatchedFields.map((field, index) => (
                <div key={index} className="mb-2">
                  <div className="text-sm font-medium text-red-600">
                    ❌ {field.fieldName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    PO: {field.poValue} | Invoice: {field.invoiceValue}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      <div className="mt-6">
        <Button variant="outline">
          <InfoIcon className="mr-2 h-4 w-4" />
          View Full Comparison Report
        </Button>
      </div>
    </div>
  );
};
