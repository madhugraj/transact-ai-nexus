
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/UserAuthContext';
import { 
  Database, 
  File, 
  Upload, 
  Mail, 
  Send, 
  BarChart, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileText
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

// Nav item type
interface NavItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

// Nav item component
const NavItem = ({ icon: Icon, label, href, active, collapsed, onClick }: NavItemProps) => {
  return (
    <Link
      to={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        active 
          ? "bg-sidebar-accent text-sidebar-accent-foreground" 
          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon className="h-5 w-5" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
};

// Main sidebar component
const AppSidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { label: "Dashboard", icon: BarChart, href: "/dashboard" },
    { label: "Documents", icon: FileText, href: "/documents" },
    { label: "Email Connector", icon: Mail, href: "/email-connector" },
    { label: "Upload", icon: Upload, href: "/upload" },
    { label: "Database", icon: Database, href: "/database" },
    { label: "Actions", icon: Send, href: "/actions" },
    { label: "SAP Data", icon: File, href: "/sap-data" },
    { label: "Settings", icon: Settings, href: "/settings" },
  ];

  return (
    <div 
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 py-2">
        {!collapsed && (
          <div className="text-sidebar-foreground font-semibold text-lg">
            Z-Transact
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>
      
      <Separator className="bg-sidebar-border" />
      
      <div className="flex-1 overflow-auto py-2 px-2">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={location.pathname === item.href}
              collapsed={collapsed}
            />
          ))}
        </nav>
      </div>
      
      <Separator className="bg-sidebar-border" />
      
      <div className={cn(
        "p-4 flex items-center",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground truncate max-w-[120px]">
                {user?.name}
              </span>
              <span className="text-xs text-sidebar-foreground/70 truncate max-w-[120px]">
                {user?.role.replace('_', ' ')}
              </span>
            </div>
          </div>
        )}
        
        <Button 
          variant="ghost" 
          size={collapsed ? "icon" : "sm"}
          onClick={logout} 
          className="text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          {collapsed ? <LogOut size={18} /> : <LogOut size={16} className="mr-1" />}
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );
};

export default AppSidebar;
