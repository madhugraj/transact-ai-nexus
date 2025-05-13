import { useState } from "react";
import { useAuth } from "@/components/auth/UserAuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Bell,
  Shield,
  Building,
  Users,
  CreditCard,
  Save,
  Check,
  Mail,
  ServerCog,
  Database,
  Cog,
  CloudSync
} from "lucide-react";

interface SettingsPanelProps {
  isAdmin?: boolean;
  isReadOnly?: boolean;
}

const SettingsPanel = ({ isAdmin = false, isReadOnly = false }: SettingsPanelProps) => {
  const { user } = useAuth();
  const [notifyOnNewDocuments, setNotifyOnNewDocuments] = useState(true);
  const [notifyOnErrors, setNotifyOnErrors] = useState(true);
  const [notifyOnComments, setNotifyOnComments] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [dataRetentionDays, setDataRetentionDays] = useState("90");
  const [dataEncryption, setDataEncryption] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [backupFrequency, setBackupFrequency] = useState("daily");
  const [auditLogging, setAuditLogging] = useState(true);
  const [customApiKey, setCustomApiKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  
  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile updated successfully");
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Password updated successfully");
  };

  const handleSaveAdvancedSettings = () => {
    toast.success("Advanced settings saved successfully");
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
          {isAdmin && (
            <>
              <TabsTrigger value="advanced"><Cog size={16} className="mr-2" /> Advanced</TabsTrigger>
              <TabsTrigger value="integrations"><ServerCog size={16} className="mr-2" /> Integrations</TabsTrigger>
            </>
          )}
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
                    <Input id="name" defaultValue={user?.name} disabled={isReadOnly} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={user?.email} disabled={isReadOnly} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" defaultValue={user?.role.replace('_', ' ')} disabled />
                  </div>
                  <Button type="submit" disabled={isReadOnly}>
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
                    <Input id="current-password" type="password" disabled={isReadOnly} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" disabled={isReadOnly} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" disabled={isReadOnly} />
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="two-factor-auth"
                      checked={twoFactorAuth}
                      onCheckedChange={setTwoFactorAuth}
                      disabled={isReadOnly}
                    />
                    <Label htmlFor="two-factor-auth">Enable Two-Factor Authentication</Label>
                  </div>
                  <Button type="submit" disabled={isReadOnly}>
                    <Shield size={16} className="mr-2" />
                    Update Security Settings
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
                  disabled={isReadOnly}
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
                  disabled={isReadOnly}
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
                  disabled={isReadOnly}
                />
              </div>
              <div className="pt-4">
                <Button disabled={isReadOnly}>
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
                  disabled={isReadOnly}
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
                  disabled={isReadOnly}
                />
              </div>
              <div className="pt-4">
                <Button disabled={isReadOnly}>
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
                <Input id="org-name" defaultValue="Acme Corporation" disabled={isReadOnly} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-industry">Industry</Label>
                <Input id="org-industry" defaultValue="Technology" disabled={isReadOnly} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-size">Company Size</Label>
                <Input id="org-size" defaultValue="50-200 employees" disabled={isReadOnly} />
              </div>
              <Button disabled={isReadOnly}>
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
                
                <Button variant="outline" disabled={isReadOnly || !isAdmin}>
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
                    <Button variant="outline" size="sm" disabled={isReadOnly || !isAdmin}>
                      Change Plan
                    </Button>
                    <Button variant="outline" size="sm" disabled={isReadOnly || !isAdmin}>
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
        
        {/* New Advanced Tab - Admin Only */}
        {isAdmin && (
          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle>Advanced System Settings</CardTitle>
                <CardDescription>
                  Configure system-wide advanced settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Data Management</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="data-retention">Data Retention Period (days)</Label>
                      <Input 
                        id="data-retention"
                        type="number"
                        value={dataRetentionDays}
                        onChange={(e) => setDataRetentionDays(e.target.value)}
                        min="1"
                      />
                      <p className="text-xs text-muted-foreground">
                        How long to keep data before automatic archiving
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="data-encryption">Enhanced Data Encryption</Label>
                        <p className="text-sm text-muted-foreground">
                          Use advanced encryption for sensitive data
                        </p>
                      </div>
                      <Switch
                        id="data-encryption"
                        checked={dataEncryption}
                        onCheckedChange={setDataEncryption}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="backup-frequency">Database Backup Frequency</Label>
                      <Select 
                        value={backupFrequency} 
                        onValueChange={setBackupFrequency}
                      >
                        <SelectTrigger id="backup-frequency">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">System Logging</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="audit-logging">Audit Logging</Label>
                        <p className="text-sm text-muted-foreground">
                          Track all user actions for compliance
                        </p>
                      </div>
                      <Switch
                        id="audit-logging"
                        checked={auditLogging}
                        onCheckedChange={setAuditLogging}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="log-level">Log Level</Label>
                      <Select defaultValue="info">
                        <SelectTrigger id="log-level">
                          <SelectValue placeholder="Select log level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="error">Error</SelectItem>
                          <SelectItem value="warn">Warning</SelectItem>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="debug">Debug</SelectItem>
                          <SelectItem value="trace">Trace</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button onClick={handleSaveAdvancedSettings}>
                    <Save size={16} className="mr-2" />
                    Save Advanced Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        {/* New Integrations Tab - Admin Only */}
        {isAdmin && (
          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>API Integrations</CardTitle>
                <CardDescription>
                  Configure external API integrations and webhooks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">API Configuration</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="api-key">Custom API Key</Label>
                      <Input
                        id="api-key"
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                        placeholder="Enter your API key"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="webhook-url">Webhook URL</Label>
                      <Input
                        id="webhook-url"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://your-webhook-endpoint.com"
                      />
                      <p className="text-xs text-muted-foreground">
                        URL to receive event notifications
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Webhook Events</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <Switch id="event-document" defaultChecked />
                          <Label htmlFor="event-document">Document Events</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="event-user" defaultChecked />
                          <Label htmlFor="event-user">User Events</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="event-system" defaultChecked />
                          <Label htmlFor="event-system">System Events</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="event-billing" />
                          <Label htmlFor="event-billing">Billing Events</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Integration Partners</h3>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between p-2 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <Database className="h-8 w-8 text-blue-500" />
                          <div>
                            <p className="font-medium">PostgreSQL</p>
                            <p className="text-xs text-muted-foreground">Database Integration</p>
                          </div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between p-2 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <Database className="h-8 w-8 text-green-500" />
                          <div>
                            <p className="font-medium">MongoDB</p>
                            <p className="text-xs text-muted-foreground">Database Integration</p>
                          </div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between p-2 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <CloudSync className="h-8 w-8 text-orange-500" />
                          <div>
                            <p className="font-medium">SAP HANA</p>
                            <p className="text-xs text-muted-foreground">ERP Integration</p>
                          </div>
                        </div>
                        <Switch />
                      </div>
                      
                      <div className="flex items-center justify-between p-2 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <CloudSync className="h-8 w-8 text-purple-500" />
                          <div>
                            <p className="font-medium">Zoho CRM</p>
                            <p className="text-xs text-muted-foreground">CRM Integration</p>
                          </div>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </div>
                  
                  <Button>
                    <Save size={16} className="mr-2" />
                    Save Integration Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default SettingsPanel;
