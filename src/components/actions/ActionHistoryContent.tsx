
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, ArrowUpDown } from "lucide-react";

export const ActionHistoryContent: React.FC = () => {
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
