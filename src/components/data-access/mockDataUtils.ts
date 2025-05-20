
import { DataSource } from "@/types/dataSource";

// Create a new type to export
export interface MockDataSource extends DataSource {
  id: string;
}

// Mock data sources for different agent types
export const getMockDataSources = (agentType: "recommendations" | "financial" | "automation" | "compliance"): MockDataSource[] => {
  // Base data sources with common structure
  const commonSources: Record<string, MockDataSource[]> = {
    "recommendations": [
      {
        id: "zoho-crm-1",
        name: "Zoho CRM",
        type: "CRM",
        status: "connected",
        modules: [
          {
            name: "Contacts",
            lastSynced: "2 mins ago",
            recordsFetched: 354
          },
          {
            name: "Deals",
            lastSynced: "5 mins ago",
            recordsFetched: 126
          },
          {
            name: "Activities",
            lastSynced: "10 mins ago",
            recordsFetched: 78
          }
        ]
      },
      {
        id: "zoho-books-1",
        name: "Zoho Books",
        type: "Accounting",
        status: "connected",
        modules: [
          {
            name: "Invoices",
            lastSynced: "5 mins ago",
            recordsFetched: 426
          },
          {
            name: "Payments",
            lastSynced: "15 mins ago",
            recordsFetched: 289
          }
        ]
      }
    ],
    "financial": [
      {
        id: "zoho-crm-2",
        name: "Zoho CRM",
        type: "CRM",
        status: "connected",
        modules: [
          {
            name: "Contacts",
            lastSynced: "3 mins ago",
            recordsFetched: 354
          },
          {
            name: "Deals",
            lastSynced: "3 mins ago",
            recordsFetched: 126
          }
        ]
      },
      {
        id: "netsuite-1",
        name: "NetSuite",
        type: "Financial",
        status: "connected",
        modules: [
          {
            name: "Transactions",
            lastSynced: "10 mins ago",
            recordsFetched: 522
          },
          {
            name: "Accounts",
            lastSynced: "10 mins ago",
            recordsFetched: 156
          }
        ]
      }
    ],
    "automation": [
      {
        id: "keap-1",
        name: "Keap",
        type: "CRM",
        status: "connected",
        modules: [
          {
            name: "Contacts",
            lastSynced: "5 mins ago",
            recordsFetched: 245
          },
          {
            name: "Orders",
            lastSynced: "5 mins ago",
            recordsFetched: 89
          }
        ]
      },
      {
        id: "myob-1",
        name: "MYOB",
        type: "Accounting",
        status: "connected",
        modules: [
          {
            name: "Transactions",
            lastSynced: "15 mins ago",
            recordsFetched: 342
          },
          {
            name: "Categories",
            lastSynced: "15 mins ago",
            recordsFetched: 28
          }
        ]
      }
    ],
    "compliance": [
      {
        id: "dynamics-1",
        name: "Dynamics 365",
        type: "CRM",
        status: "connected",
        modules: [
          {
            name: "Accounts",
            lastSynced: "5 mins ago",
            recordsFetched: 189
          },
          {
            name: "Contacts",
            lastSynced: "5 mins ago",
            recordsFetched: 456
          }
        ]
      },
      {
        id: "sage-1",
        name: "Sage",
        type: "Accounting",
        status: "connected",
        modules: [
          {
            name: "Invoices",
            lastSynced: "10 mins ago",
            recordsFetched: 312
          },
          {
            name: "Tax Records",
            lastSynced: "10 mins ago",
            recordsFetched: 85
          }
        ]
      }
    ]
  };
  
  return commonSources[agentType] || [];
};
