
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, MailPlus, Webhook, FileCheck, Mail, FileSpreadsheet, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Actions = () => {
  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Action Workflows</h1>
          <Button>
            <Send className="mr-2 h-4 w-4" />
            Create Workflow
          </Button>
        </div>

        <Tabs defaultValue="automated" className="space-y-4">
          <TabsList>
            <TabsTrigger value="automated">Automated Actions</TabsTrigger>
            <TabsTrigger value="templates">Email Templates</TabsTrigger>
            <TabsTrigger value="history">Action History</TabsTrigger>
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
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Actions;
