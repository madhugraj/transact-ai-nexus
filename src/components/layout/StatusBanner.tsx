import { useState } from 'react';
import { Building, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const StatusBanner = () => {
  const [currentOrg, setCurrentOrg] = useState({
    name: "Acme Corporation",
    plan: "Enterprise"
  });

  const organizations = [
    { id: 1, name: "Acme Corporation", plan: "Enterprise" },
    { id: 2, name: "Globex Industries", plan: "Professional" },
    { id: 3, name: "Stark Enterprises", plan: "Enterprise" },
    { id: 4, name: "Wayne Industries", plan: "Professional" },
    { id: 5, name: "Umbrella Corp", plan: "Starter" }
  ];

  return (
    <div className="flex items-center">
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
          {organizations.map(org => (
            <DropdownMenuItem 
              key={org.id} 
              onClick={() => setCurrentOrg(org)}
              className="flex flex-col items-start"
            >
              <span className="font-medium">{org.name}</span>
              <span className="text-xs text-muted-foreground">{org.plan} Plan</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <span className="text-sm">Add New Organization</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default StatusBanner;
