
import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, FileSpreadsheet } from "lucide-react";

export const EmailTemplatesContent: React.FC = () => {
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
