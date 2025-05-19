import { useState, useEffect } from 'react';
import { Building, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CreateOrgDialog } from '@/components/organization/CreateOrgDialog';
import { Organization, getOrganizations, getCurrentOrganization, saveCurrentOrganization, addOrganization } from '@/utils/organizations';
const StatusBanner = () => {
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  useEffect(() => {
    // Load organizations and current organization from storage
    const orgs = getOrganizations();
    const current = getCurrentOrganization();
    setOrganizations(orgs);
    setCurrentOrg(current);
  }, []);
  const handleSwitchOrg = (org: Organization) => {
    setCurrentOrg(org);
    saveCurrentOrganization(org);
  };
  const handleCreateOrg = (orgData: {
    name: string;
    plan: string;
  }) => {
    const newOrg = addOrganization({
      name: orgData.name,
      plan: orgData.plan as "Starter" | "Professional" | "Enterprise"
    });
    setOrganizations([...organizations, newOrg]);
    handleSwitchOrg(newOrg);
  };
  if (!currentOrg) return null;
  return <>
      <div className="flex items-center">
        <div className="flex items-center gap-2 mr-4">
          <img src="/lovable-uploads/27845ced-a36a-431c-8cd1-5016f13aab53.png" alt="yavar logo" className="h-8" />
          <div className="flex flex-col">
            
            
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Building size={16} />
              <span className="font-medium">{currentOrg.name}</span>
              <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted">
                {currentOrg.plan}
              </span>
              <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[220px]">
            <DropdownMenuLabel>Organizations</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {organizations.map(org => <DropdownMenuItem key={org.id} onClick={() => handleSwitchOrg(org)} className="flex flex-col items-start">
                <span className="font-medium">{org.name}</span>
                <span className="text-xs text-muted-foreground">{org.plan} Plan</span>
              </DropdownMenuItem>)}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
              <span className="text-sm">Add New Organization</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CreateOrgDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onCreateOrg={handleCreateOrg} />
    </>;
};
export default StatusBanner;