
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import ProcessingTab from "@/components/processing/ProcessingTab";

const Documents = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col mb-6">
          <h1 className="text-3xl font-semibold">Document Processing</h1>
          <p className="text-muted-foreground mt-1">
            Process and analyze financial documents using our agent system
          </p>
        </div>
        
        <Card className="overflow-hidden border-muted/40 shadow-sm hover:shadow-md transition-all duration-200 p-6">
          <ProcessingTab />
        </Card>
      </div>
    </AppLayout>
  );
};

export default Documents;
