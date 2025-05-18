
import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Send, Mail, MailPlus, Webhook, FileSearch, FileCheck, 
  FileSpreadsheet, Database, Cloud, ArrowUpDown,
  CheckIcon, Sliders, History, Layout, FileIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import WorkflowCreator from "@/components/actions/WorkflowCreator";
import { 
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import WorkflowDiagram from "@/components/actions/WorkflowDiagram";
import { WorkflowStep } from "@/types/workflow";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-mobile";

// Sample workflow steps for visual demonstration
const exampleWorkflowSteps: WorkflowStep[] = [
  {
    id: "step-1",
    type: "document-source",
    name: "Document Source",
    position: 1,
    config: {
      sources: ["drive", "email"]
    }
  },
  {
    id: "step-2",
    type: "comparison",
    name: "Document Comparison",
    position: 2,
    config: {
      comparisonType: "po-invoice"
    }
  },
  {
    id: "step-3",
    type: "report-generation",
    name: "Report Generation",
    position: 3,
    config: {
      format: "pdf"
    }
  },
  {
    id: "step-4",
    type: "notification",
    name: "Approval Notification",
    position: 4,
    config: {
      recipients: ["approver@example.com"]
    }
  },
  {
    id: "step-5",
    type: "data-storage",
    name: "Database Storage",
    position: 5,
    config: {
      table: "processed_documents"
    }
  }
];

const Actions = () => {
  const [activeTab, setActiveTab] = useState("workflows");
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [openDrawer, setOpenDrawer] = useState(false);

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Action Workflows</h1>
          {activeTab === "workflows" && (
            <WorkflowCreator />
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="workflows">Workflow Pipelines</TabsTrigger>
            <TabsTrigger value="automated">Automated Actions</TabsTrigger>
            <TabsTrigger value="templates">Email Templates</TabsTrigger>
            <TabsTrigger value="history">Action History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="workflows" className="space-y-4">
            {isMobile ? (
              <MobileWorkflowView 
                selectedStep={selectedStep} 
                setSelectedStep={setSelectedStep}
                openDrawer={openDrawer}
                setOpenDrawer={setOpenDrawer}
              />
            ) : (
              <DesktopWorkflowView 
                selectedStep={selectedStep} 
                setSelectedStep={setSelectedStep}
              />
            )}
            
            <Separator />
            
            <WorkflowExampleCards />
          </TabsContent>
          
          <TabsContent value="automated" className="space-y-4">
            <AutomatedActionsContent />
          </TabsContent>
          
          <TabsContent value="templates" className="space-y-4">
            <EmailTemplatesContent />
          </TabsContent>
          
          <TabsContent value="history">
            <ActionHistoryContent />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

// Component to display step configuration
const StepConfig = ({ stepId }: { stepId: string }) => {
  const step = exampleWorkflowSteps.find(s => s.id === stepId);
  
  if (!step) return null;
  
  return (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-4">Configure: {step.name}</h3>
      
      {step.type === "document-source" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="flex flex-col h-24 items-center justify-center">
              <Cloud className="h-8 w-8 mb-2 text-blue-500" />
              <span>Google Drive</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-24 items-center justify-center">
              <Mail className="h-8 w-8 mb-2 text-purple-500" />
              <span>Email</span>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Select document sources to monitor for new POs and invoices.
          </p>
        </div>
      )}
      
      {step.type === "comparison" && (
        <div className="space-y-4">
          <div className="flex items-center p-4 border rounded-md">
            <div className="flex-1">
              <h4 className="text-sm font-medium">PO vs Invoice Comparison</h4>
              <p className="text-xs text-muted-foreground">
                Automatically match line items and detect price discrepancies
              </p>
            </div>
            <Badge>Active</Badge>
          </div>
          <div className="flex items-center p-4 border rounded-md">
            <div className="flex-1">
              <h4 className="text-sm font-medium">Tolerance Settings</h4>
              <p className="text-xs text-muted-foreground">
                Allow up to 2% variance on line item prices
              </p>
            </div>
            <Sliders className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}
      
      {step.type === "report-generation" && (
        <div className="space-y-4">
          <div className="flex items-center p-4 border rounded-md">
            <div className="flex-1">
              <h4 className="text-sm font-medium">Dashboard Reports</h4>
              <p className="text-xs text-muted-foreground">
                Generate visualizations for the dashboard
              </p>
            </div>
            <Layout className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center p-4 border rounded-md">
            <div className="flex-1">
              <h4 className="text-sm font-medium">PDF Export</h4>
              <p className="text-xs text-muted-foreground">
                Create downloadable reports for stakeholders
              </p>
            </div>
            <FileIcon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}
      
      {step.type === "notification" && (
        <div className="space-y-4">
          <div className="p-4 border rounded-md">
            <h4 className="text-sm font-medium mb-2">Approval Recipients</h4>
            <div className="space-y-2">
              <div className="flex items-center p-2 bg-muted rounded-md">
                <Mail className="h-4 w-4 mr-2 text-blue-500" />
                <span className="text-sm">finance@example.com</span>
              </div>
              <div className="flex items-center p-2 bg-muted rounded-md">
                <Mail className="h-4 w-4 mr-2 text-blue-500" />
                <span className="text-sm">approvals@example.com</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {step.type === "data-storage" && (
        <div className="space-y-4">
          <div className="flex items-center p-4 border rounded-md">
            <div className="flex-1">
              <h4 className="text-sm font-medium">Database Storage</h4>
              <p className="text-xs text-muted-foreground">
                Store processed documents in the processed_documents table
              </p>
            </div>
            <Database className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center p-4 border rounded-md">
            <div className="flex-1">
              <h4 className="text-sm font-medium">Archive Settings</h4>
              <p className="text-xs text-muted-foreground">
                Archive documents after 90 days
              </p>
            </div>
            <History className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}
      
      <div className="mt-6 flex justify-end">
        <Button>Save Configuration</Button>
      </div>
    </div>
  );
};

const MobileWorkflowView = ({ 
  selectedStep, 
  setSelectedStep,
  openDrawer,
  setOpenDrawer
}: { 
  selectedStep: string | null,
  setSelectedStep: React.Dispatch<React.SetStateAction<string | null>>,
  openDrawer: boolean,
  setOpenDrawer: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Document Processing Pipeline</CardTitle>
        <CardDescription>
          Configure each step of your document processing workflow
        </CardDescription>
      </CardHeader>
      <CardContent>
        <WorkflowDiagram 
          steps={exampleWorkflowSteps} 
          activeStepId={selectedStep || undefined}
          onStepClick={(stepId) => {
            setSelectedStep(stepId);
            setOpenDrawer(true);
          }}
        />
        
        <Drawer open={openDrawer} onOpenChange={setOpenDrawer}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Step Configuration</DrawerTitle>
              <DrawerDescription>
                Configure this workflow step
              </DrawerDescription>
            </DrawerHeader>
            {selectedStep && (
              <div className="px-4">
                <StepConfig stepId={selectedStep} />
              </div>
            )}
            <DrawerFooter>
              <Button onClick={() => setOpenDrawer(false)}>Close</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </CardContent>
    </Card>
  );
};

const DesktopWorkflowView = ({ 
  selectedStep, 
  setSelectedStep 
}: { 
  selectedStep: string | null,
  setSelectedStep: React.Dispatch<React.SetStateAction<string | null>>
}) => {
  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={60} minSize={40}>
        <Card className="h-[calc(100vh-200px)]">
          <CardHeader>
            <CardTitle className="text-lg">Document Processing Pipeline</CardTitle>
            <CardDescription>
              Configure each step of your document processing workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WorkflowDiagram 
              steps={exampleWorkflowSteps} 
              activeStepId={selectedStep || undefined}
              onStepClick={setSelectedStep}
            />
          </CardContent>
        </Card>
      </ResizablePanel>
      
      <ResizableHandle withHandle />
      
      <ResizablePanel defaultSize={40} minSize={30}>
        <Card className="h-[calc(100vh-200px)] overflow-auto">
          <CardHeader>
            <CardTitle className="text-lg">Step Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedStep ? (
              <StepConfig stepId={selectedStep} />
            ) : (
              <div className="flex h-full items-center justify-center text-center p-4">
                <div>
                  <div className="rounded-full bg-muted w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                    <FileSearch className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-2">Select a workflow step</h3>
                  <p className="text-sm text-muted-foreground">
                    Click on a step in the workflow to configure its settings
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

const WorkflowExampleCards = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <Badge className="w-fit mb-1">Active</Badge>
          <CardTitle className="text-base">PO-Invoice Approval Pipeline</CardTitle>
          <CardDescription className="text-xs">
            Automated workflow for processing and approving invoice payments
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Source:</span>
            <span>Google Drive, Email</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Matching:</span>
            <span>90% threshold</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Approval:</span>
            <span>finance@example.com</span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" size="sm">Edit</Button>
          <Button size="sm">Run Now</Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <Badge variant="outline" className="w-fit mb-1">Draft</Badge>
          <CardTitle className="text-base">Multi-vendor Invoice Processing</CardTitle>
          <CardDescription className="text-xs">
            Process invoices from multiple vendors against master agreements
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Source:</span>
            <span>Email Connector</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Matching:</span>
            <span>Not configured</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Approval:</span>
            <span>Not configured</span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="default" size="sm">Configure</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

const AutomatedActionsContent = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <Badge className="w-fit mb-1">Active</Badge>
          <CardTitle className="flex items-center">
            <MailPlus className="h-5 w-5 mr-2 text-blue-500" />
            Approval Request
          </CardTitle>
          <CardDescription>Sends automatic approval requests to managers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Trigger:</span>
            <span>New Invoice</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Action:</span>
            <span>Send Email</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Last run:</span>
            <span>Today, 10:45 AM</span>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">Settings</Button>
          <Button variant="outline" size="sm" className="flex-1">View History</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <Badge className="w-fit mb-1">Active</Badge>
          <CardTitle className="flex items-center">
            <Webhook className="h-5 w-5 mr-2 text-purple-500" />
            SAP AP Update
          </CardTitle>
          <CardDescription>Updates SAP with processed invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Trigger:</span>
            <span>Invoice Approved</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Action:</span>
            <span>API Post</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Last run:</span>
            <span>Yesterday, 3:20 PM</span>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">Settings</Button>
          <Button variant="outline" size="sm" className="flex-1">View History</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <Badge variant="outline" className="w-fit mb-1">Draft</Badge>
          <CardTitle className="flex items-center">
            <FileCheck className="h-5 w-5 mr-2 text-gray-500" />
            GRN Generator
          </CardTitle>
          <CardDescription>Automatically creates GRN documents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Trigger:</span>
            <span>Not configured</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Action:</span>
            <span>Generate PDF</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Last run:</span>
            <span>Never</span>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="default" size="sm" className="flex-1">Configure</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

const EmailTemplatesContent = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2 text-blue-500" />
            Invoice Approval Request
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">Used for sending approval requests to managers</p>
          <div className="flex justify-between items-center mt-2">
            <span className="text-muted-foreground">Variables:</span>
            <span>7</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Last modified:</span>
            <span>2 days ago</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" className="w-full">
            Edit Template
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center">
            <FileSpreadsheet className="h-5 w-5 mr-2 text-green-500" />
            Payment Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">Notifies vendors about processed payments</p>
          <div className="flex justify-between items-center mt-2">
            <span className="text-muted-foreground">Variables:</span>
            <span>5</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Last modified:</span>
            <span>1 week ago</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" className="w-full">
            Edit Template
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

const ActionHistoryContent = () => {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="border-b px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6">Recent Action History</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Record of all automated and manual actions
          </p>
        </div>
        <div className="px-4 py-5 sm:px-6">
          <div className="flow-root">
            <ul className="divide-y divide-gray-200">
              {[1, 2, 3, 4, 5].map((item) => (
                <li key={item} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className={`flex-shrink-0 rounded-full p-1 ${item % 2 === 0 ? 'bg-blue-100' : 'bg-green-100'}`}>
                      {item % 2 === 0 ? 
                        <Mail className="h-5 w-5 text-blue-600" /> : 
                        <ArrowUpDown className="h-5 w-5 text-green-600" />
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item % 2 === 0 ? "Approval request sent" : "SAP update completed"}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {item % 2 === 0 ? "Invoice #INV-2023-00" + item : "Updated in SAP with reference #REF-00" + item}
                      </p>
                    </div>
                    <div className="inline-flex items-center text-xs text-muted-foreground">
                      {item} hour{item !== 1 ? 's' : ''} ago
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Actions;
