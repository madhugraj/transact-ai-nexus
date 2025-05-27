
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentUploadPanel } from "./DocumentUploadPanel";
import { ComparisonResultsPanel } from "./ComparisonResultsPanel";
import ComparisonDashboard from "./ComparisonDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDocumentComparison } from "./hooks/useDocumentComparison";

const DocumentComparison = () => {
  const {
    poFile,
    invoiceFiles,
    activeInvoiceIndex,
    setActiveInvoiceIndex,
    isComparing,
    comparisonResults,
    detailedResults,
    matchPercentage,
    activeTab,
    setActiveTab,
    handlePoFileChange,
    handleInvoiceFileChange,
    removeInvoiceFile,
    compareDocuments
  } = useDocumentComparison();

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="upload">Upload Documents</TabsTrigger>
          <TabsTrigger value="results" disabled={comparisonResults.length === 0}>
            Comparison Results
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="mt-4 space-y-4">
          <DocumentUploadPanel 
            poFile={poFile}
            invoiceFiles={invoiceFiles}
            handlePoFileChange={handlePoFileChange}
            handleInvoiceFileChange={handleInvoiceFileChange}
            removeInvoiceFile={removeInvoiceFile}
            compareDocuments={compareDocuments}
            isComparing={isComparing}
          />
        </TabsContent>
        
        <TabsContent value="results" className="mt-4 space-y-4">
          {comparisonResults.length > 0 && detailedResults ? (
            <>
              <ComparisonResultsPanel
                poFile={poFile}
                invoiceFiles={invoiceFiles}
                activeInvoiceIndex={activeInvoiceIndex}
                setActiveInvoiceIndex={setActiveInvoiceIndex}
                comparisonResults={comparisonResults}
                matchPercentage={matchPercentage}
                detailedResults={detailedResults}
              />
              
              {/* Integrated Dashboard Section */}
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Comparison Analytics Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <ComparisonDashboard />
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No comparison results available. Please run a comparison first.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentComparison;
