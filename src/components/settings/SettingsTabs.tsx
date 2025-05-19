
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppearanceSettings from "./AppearanceSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SettingsTabsProps {
  isAdmin?: boolean;
  isReadOnly?: boolean;
}

const SettingsTabs = ({ isAdmin = false, isReadOnly = false }: SettingsTabsProps) => {
  return (
    <Tabs defaultValue="account" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="appearance">Appearance</TabsTrigger>
        {isAdmin && <TabsTrigger value="organization">Organization</TabsTrigger>}
      </TabsList>
      
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>
              Manage your account information and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                placeholder="Your Name" 
                readOnly={isReadOnly} 
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="your.email@example.com" 
                readOnly={isReadOnly} 
              />
            </div>
            <Button 
              disabled={isReadOnly}
            >
              Save Account Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="appearance">
        <AppearanceSettings isReadOnly={isReadOnly} />
      </TabsContent>
      
      {isAdmin && (
        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>
                Manage your organization details and settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input 
                    id="org-name" 
                    placeholder="Your Organization" 
                    readOnly={isReadOnly} 
                  />
                </div>
                <Button 
                  disabled={isReadOnly}
                >
                  Save Organization Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      )}
    </Tabs>
  );
};

export default SettingsTabs;
