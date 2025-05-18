
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MailPlus, Webhook, FileCheck } from "lucide-react";

export const AutomatedActionsContent: React.FC = () => {
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
