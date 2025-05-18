
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Mail, MailPlus, Webhook, FileSearch, FileCheck, FileSpreadsheet, Database, Cloud, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import WorkflowCreator from "@/components/actions/WorkflowCreator";

const Actions = () => {
  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Action Workflows</h1>
          <WorkflowCreator />
        </div>

        <Tabs defaultValue="automated" className="space-y-4">
          <TabsList>
            <TabsTrigger value="automated">Automated Actions</TabsTrigger>
            <TabsTrigger value="templates">Email Templates</TabsTrigger>
            <TabsTrigger value="history">Action History</TabsTrigger>
            <TabsTrigger value="workflows">Workflow Pipelines</TabsTrigger>
          </TabsList>
          
          <TabsContent value="automated" className="space-y-4">
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
          </TabsContent>
          
          <TabsContent value="templates" className="space-y-4">
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
          </TabsContent>
          
          <TabsContent value="history">
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
          </TabsContent>
          
          <TabsContent value="workflows" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Document Processing Pipeline</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure end-to-end document processing workflows from input to approval and storage
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <Button variant="outline" className="flex items-center gap-2">
                      <Cloud className="h-4 w-4" />
                      <span>Configure Sources</span>
                    </Button>
                    
                    <Button variant="outline" className="flex items-center gap-2">
                      <FileSearch className="h-4 w-4" />
                      <span>Comparison Rules</span>
                    </Button>
                    
                    <Button variant="outline" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>Approval Flow</span>
                    </Button>
                    
                    <Button variant="outline" className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      <span>Storage Options</span>
                    </Button>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-md">
                    <h4 className="text-sm font-medium mb-3">Sample Workflow Pipeline</h4>
                    
                    <div className="relative">
                      {/* Workflow steps with connector lines */}
                      <div className="absolute top-0 left-6 w-[2px] h-full bg-muted-foreground/20"></div>
                      
                      <div className="space-y-6">
                        <div className="flex relative">
                          <div className="bg-blue-500 rounded-full h-3 w-3 mt-1 z-10"></div>
                          <div className="ml-8">
                            <div className="font-medium text-sm">Document Source</div>
                            <div className="text-xs text-muted-foreground">
                              Connect to Google Drive, Email or Database to import PO and Invoice documents
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex relative">
                          <div className="bg-amber-500 rounded-full h-3 w-3 mt-1 z-10"></div>
                          <div className="ml-8">
                            <div className="font-medium text-sm">Document Comparison</div>
                            <div className="text-xs text-muted-foreground">
                              Automatically compare PO with Invoices to identify discrepancies
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex relative">
                          <div className="bg-green-500 rounded-full h-3 w-3 mt-1 z-10"></div>
                          <div className="ml-8">
                            <div className="font-medium text-sm">Report Generation</div>
                            <div className="text-xs text-muted-foreground">
                              Create detailed reports and visualizations for the dashboard
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex relative">
                          <div className="bg-purple-500 rounded-full h-3 w-3 mt-1 z-10"></div>
                          <div className="ml-8">
                            <div className="font-medium text-sm">Approval Notification</div>
                            <div className="text-xs text-muted-foreground">
                              Send email to appropriate authorities requesting approval
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex relative">
                          <div className="bg-gray-500 rounded-full h-3 w-3 mt-1 z-10"></div>
                          <div className="ml-8">
                            <div className="font-medium text-sm">Database Storage</div>
                            <div className="text-xs text-muted-foreground">
                              Store processed documents and approvals in database for accounting
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
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
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Actions;
