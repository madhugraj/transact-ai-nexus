
import { useState, useEffect } from 'react';
import { Building, ChevronDown, BellRing } from 'lucide-react';
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
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent border-[#2a3149] hover:bg-blue-900/20 hover:text-blue-200">
                <Building size={16} />
                <span className="font-medium">{currentOrg.name}</span>
                <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted">
                  {currentOrg.plan}
                </span>
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[220px] bg-[#151929] border-[#2a3149] text-gray-200">
              <DropdownMenuLabel>Organizations</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#2a3149]" />
              {organizations.map(org => <DropdownMenuItem key={org.id} onClick={() => handleSwitchOrg(org)} className="flex flex-col items-start hover:bg-blue-900/20 hover:text-blue-200">
                  <span className="font-medium">{org.name}</span>
                  <span className="text-xs text-muted-foreground">{org.plan} Plan</span>
                </DropdownMenuItem>)}
              <DropdownMenuSeparator className="bg-[#2a3149]" />
              <DropdownMenuItem onClick={() => setCreateDialogOpen(true)} className="hover:bg-blue-900/20 hover:text-blue-200">
                <span className="text-sm">Add New Organization</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-900/20" title="Notifications">
            <BellRing className="h-5 w-5 text-gray-300" />
          </Button>
          <img src="/lovable-uploads/27845ced-a36a-431c-8cd1-5016f13aab53.png" alt="Z-Transact logo" className="h-8" />
        </div>
      </div>

      <CreateOrgDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onCreateOrg={handleCreateOrg} />
    </>;
};

export default StatusBanner;
