
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import ProcessTransactions from "@/components/processing/ProcessTransactions";
import { Card } from "@/components/ui/card";

const Documents = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col mb-6">
          <h1 className="text-3xl font-semibold">Document Processing</h1>
          <p className="text-muted-foreground mt-1">
            Process and analyze financial documents
          </p>
        </div>
        
        <Card className="overflow-hidden border-muted/40 shadow-sm hover:shadow-md transition-all duration-200 p-6">
          <ProcessTransactions />
        </Card>
      </div>
    </AppLayout>
  );
};

export default Documents;
