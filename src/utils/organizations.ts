
export interface Organization {
  id: number;
  name: string;
  plan: "Starter" | "Professional" | "Enterprise";
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
    { id: 1, name: "Acme Corporation", plan: "Enterprise" as const },
    { id: 2, name: "Globex Industries", plan: "Professional" as const },
    { id: 3, name: "Stark Enterprises", plan: "Enterprise" as const },
    { id: 4, name: "Wayne Industries", plan: "Professional" as const },
    { id: 5, name: "Umbrella Corp", plan: "Starter" as const }
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

export function addOrganization(organization: Omit<Organization, "id">): Organization {
  const organizations = getOrganizations();
  const newId = organizations.length > 0 
    ? Math.max(...organizations.map(org => org.id)) + 1 
    : 1;
  
  const newOrganization = {
    id: newId,
    ...organization
  };
  
  organizations.push(newOrganization);
  saveOrganizations(organizations);
  return newOrganization;
}
