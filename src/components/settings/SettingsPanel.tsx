
import { useState } from "react";
import { useAuth } from "@/components/auth/UserAuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  User, 
  Bell, 
  Shield, 
  Building, 
  Users, 
  CreditCard, 
  Save, 
  Check,
  Mail 
} from "lucide-react";

const SettingsPanel = () => {
  const { user } = useAuth();
  const [notifyOnNewDocuments, setNotifyOnNewDocuments] = useState(true);
  const [notifyOnErrors, setNotifyOnErrors] = useState(true);
  const [notifyOnComments, setNotifyOnComments] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [compactMode, setCompactMode] = useState(false);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile updated successfully");
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Password updated successfully");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="profile"><User size={16} className="mr-2" /> Profile</TabsTrigger>
          <TabsTrigger value="notifications"><Bell size={16} className="mr-2" /> Notifications</TabsTrigger>
          <TabsTrigger value="appearance"><Shield size={16} className="mr-2" /> Appearance</TabsTrigger>
          <TabsTrigger value="organization"><Building size={16} className="mr-2" /> Organization</TabsTrigger>
          <TabsTrigger value="team"><Users size={16} className="mr-2" /> Team</TabsTrigger>
          <TabsTrigger value="billing"><CreditCard size={16} className="mr-2" /> Billing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue={user?.name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={user?.email} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" defaultValue={user?.role.replace('_', ' ')} disabled />
                  </div>
                  <Button type="submit">
                    <Save size={16} className="mr-2" />
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Update your password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                  <Button type="submit">
                    <Shield size={16} className="mr-2" />
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-documents">New Document Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when new documents are processed
                  </p>
                </div>
                <Switch
                  id="notify-documents"
                  checked={notifyOnNewDocuments}
                  onCheckedChange={setNotifyOnNewDocuments}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-errors">Error Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when processing errors occur
                  </p>
                </div>
                <Switch
                  id="notify-errors"
                  checked={notifyOnErrors}
                  onCheckedChange={setNotifyOnErrors}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-comments">Comment Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when someone comments on your documents
                  </p>
                </div>
                <Switch
                  id="notify-comments"
                  checked={notifyOnComments}
                  onCheckedChange={setNotifyOnComments}
                />
              </div>
              <div className="pt-4">
                <Button>
                  <Check size={16} className="mr-2" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the application appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Use dark theme for the application
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compact-mode">Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Display more content with compact UI
                  </p>
                </div>
                <Switch
                  id="compact-mode"
                  checked={compactMode}
                  onCheckedChange={setCompactMode}
                />
              </div>
              <div className="pt-4">
                <Button>
                  <Check size={16} className="mr-2" />
                  Save Appearance
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Manage your organization information and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input id="org-name" defaultValue="Acme Corporation" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-industry">Industry</Label>
                <Input id="org-industry" defaultValue="Technology" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-size">Company Size</Label>
                <Input id="org-size" defaultValue="50-200 employees" />
              </div>
              <Button>
                <Save size={16} className="mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Management</CardTitle>
              <CardDescription>
                Manage your team members and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">John Finance</p>
                        <p className="text-sm text-muted-foreground">finance@example.com</p>
                      </div>
                    </div>
                    <div className="text-sm bg-muted py-1 px-3 rounded-full">
                      Finance Analyst
                    </div>
                  </div>
                </div>
                
                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Mary Manager</p>
                        <p className="text-sm text-muted-foreground">manager@example.com</p>
                      </div>
                    </div>
                    <div className="text-sm bg-muted py-1 px-3 rounded-full">
                      Project Manager
                    </div>
                  </div>
                </div>
                
                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Alex Auditor</p>
                        <p className="text-sm text-muted-foreground">auditor@example.com</p>
                      </div>
                    </div>
                    <div className="text-sm bg-muted py-1 px-3 rounded-full">
                      Auditor
                    </div>
                  </div>
                </div>
                
                <Button variant="outline">
                  <Users size={16} className="mr-2" />
                  Invite Team Member
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>
                Manage your subscription and payment information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg bg-secondary p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">Current Plan</div>
                    <div className="text-sm bg-primary/20 text-primary py-1 px-3 rounded-full">
                      Enterprise
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Your plan renews on August 1, 2025
                  </p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Change Plan
                    </Button>
                    <Button variant="outline" size="sm">
                      Cancel Subscription
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Visa ending in 4242</p>
                          <p className="text-sm text-muted-foreground">Expires 05/2026</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Billing Address</Label>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Acme Corporation</p>
                        <p className="text-sm text-muted-foreground">
                          123 Business Avenue<br />
                          San Francisco, CA 94107<br />
                          United States
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Billing History</Label>
                  <div className="rounded-lg border overflow-hidden">
                    <div className="bg-muted px-4 py-2 text-sm font-medium grid grid-cols-5">
                      <div>Date</div>
                      <div>Description</div>
                      <div>Amount</div>
                      <div>Status</div>
                      <div></div>
                    </div>
                    <div className="px-4 py-3 grid grid-cols-5 border-t">
                      <div className="text-sm">May 1, 2025</div>
                      <div className="text-sm">Enterprise Plan</div>
                      <div className="text-sm">$199.00</div>
                      <div className="text-sm text-green-600">Paid</div>
                      <div className="text-right">
                        <Button variant="ghost" size="sm">
                          Receipt
                        </Button>
                      </div>
                    </div>
                    <div className="px-4 py-3 grid grid-cols-5 border-t">
                      <div className="text-sm">Apr 1, 2025</div>
                      <div className="text-sm">Enterprise Plan</div>
                      <div className="text-sm">$199.00</div>
                      <div className="text-sm text-green-600">Paid</div>
                      <div className="text-right">
                        <Button variant="ghost" size="sm">
                          Receipt
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPanel;
