
export interface Organization {
  id: number;
  name: string;
  plan: "Starter" | "Professional" | "Enterprise";
  industry?: string;
  companySize?: string;
  contactEmail?: string;
  billingAddress?: string;
  paymentStatus?: "pending" | "active" | "failed" | "canceled";
  usageStats?: {
    users: number;
    documents: number;
    storageUsed: number; // in GB
  };
  createdAt: string;
}

// In a real application, these functions would interact with a backend API
// For now, we'll use localStorage to persist the organizations

export function getOrganizations(): Organization[] {
  const storedOrgs = localStorage.getItem('organizations');
  
  if (storedOrgs) {
    return JSON.parse(storedOrgs);
  }
  
  // Default organizations if none exist
  const defaultOrgs = [
    { 
      id: 1, 
      name: "Acme Corporation", 
      plan: "Enterprise" as const,
      industry: "Technology",
      companySize: "501-1000",
      contactEmail: "admin@acmecorp.com",
      paymentStatus: "active",
      usageStats: {
        users: 45,
        documents: 3200,
        storageUsed: 125
      },
      createdAt: new Date().toISOString()
    },
    { 
      id: 2, 
      name: "Globex Industries", 
      plan: "Professional" as const,
      industry: "Manufacturing",
      companySize: "101-500",
      contactEmail: "info@globex.com",
      paymentStatus: "active",
      usageStats: {
        users: 12,
        documents: 450,
        storageUsed: 23
      },
      createdAt: new Date().toISOString()
    },
    { 
      id: 3, 
      name: "Stark Enterprises", 
      plan: "Enterprise" as const,
      industry: "Defense",
      companySize: "1001+",
      contactEmail: "tony@stark.com",
      paymentStatus: "active",
      usageStats: {
        users: 78,
        documents: 7500,
        storageUsed: 320
      },
      createdAt: new Date().toISOString()
    },
    { 
      id: 4, 
      name: "Wayne Industries", 
      plan: "Professional" as const,
      industry: "Research",
      companySize: "101-500",
      contactEmail: "bruce@wayne.com",
      paymentStatus: "active",
      usageStats: {
        users: 15,
        documents: 820,
        storageUsed: 42
      },
      createdAt: new Date().toISOString()
    },
    { 
      id: 5, 
      name: "Umbrella Corp", 
      plan: "Starter" as const,
      industry: "Healthcare",
      companySize: "1-50",
      contactEmail: "hello@umbrella.com",
      paymentStatus: "pending",
      usageStats: {
        users: 3,
        documents: 45,
        storageUsed: 1.2
      },
      createdAt: new Date().toISOString()
    }
  ];
  
  localStorage.setItem('organizations', JSON.stringify(defaultOrgs));
  return defaultOrgs;
}

export function getCurrentOrganization(): Organization | null {
  const storedCurrentOrg = localStorage.getItem('currentOrganization');
  
  if (storedCurrentOrg) {
    return JSON.parse(storedCurrentOrg);
  }
  
  const organizations = getOrganizations();
  if (organizations.length > 0) {
    localStorage.setItem('currentOrganization', JSON.stringify(organizations[0]));
    return organizations[0];
  }
  
  return null;
}

export function saveOrganizations(organizations: Organization[]): void {
  localStorage.setItem('organizations', JSON.stringify(organizations));
}

export function saveCurrentOrganization(organization: Organization): void {
  localStorage.setItem('currentOrganization', JSON.stringify(organization));
}

export function addOrganization(organization: Omit<Organization, "id" | "createdAt" | "usageStats">): Organization {
  const organizations = getOrganizations();
  const newId = organizations.length > 0 
    ? Math.max(...organizations.map(org => org.id)) + 1 
    : 1;
  
  const newOrganization: Organization = {
    id: newId,
    ...organization,
    usageStats: {
      users: 1, // Start with one user (the creator)
      documents: 0,
      storageUsed: 0
    },
    createdAt: new Date().toISOString()
  };
  
  organizations.push(newOrganization);
  saveOrganizations(organizations);
  return newOrganization;
}

export function updateOrganization(id: number, updates: Partial<Organization>): Organization | null {
  const organizations = getOrganizations();
  const index = organizations.findIndex(org => org.id === id);
  
  if (index === -1) return null;
  
  organizations[index] = { ...organizations[index], ...updates };
  saveOrganizations(organizations);
  
  // If this was the current org, update it in storage
  const currentOrg = getCurrentOrganization();
  if (currentOrg && currentOrg.id === id) {
    saveCurrentOrganization(organizations[index]);
  }
  
  return organizations[index];
}
