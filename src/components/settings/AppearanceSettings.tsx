
import { useState } from 'react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface AppearanceSettingsProps {
  isReadOnly?: boolean;
}

const AppearanceSettings = ({ isReadOnly = false }: AppearanceSettingsProps) => {
  const { theme, compactMode, setTheme, setCompactMode } = useTheme();
  const { toast } = useToast();
  
  // Local state to track changes before saving
  const [localTheme, setLocalTheme] = useState<'light' | 'dark' | 'system'>(theme);
  const [localCompactMode, setLocalCompactMode] = useState<boolean>(compactMode);

  const saveSettings = () => {
    setTheme(localTheme);
    setCompactMode(localCompactMode);
    
    toast({
      title: "Appearance settings saved",
      description: "Your appearance preferences have been updated.",
      duration: 3000,
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize how yavar Z-Transact looks for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme-select">Theme</Label>
            <Select
              value={localTheme}
              onValueChange={(value) => setLocalTheme(value as 'light' | 'dark' | 'system')}
              disabled={isReadOnly}
            >
              <SelectTrigger className="w-[180px]" id="theme-select">
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="compact-mode" className="block">Compact Mode</Label>
              <p className="text-sm text-muted-foreground">Display more content with reduced spacing.</p>
            </div>
            <Switch 
              id="compact-mode" 
              checked={localCompactMode}
              onCheckedChange={setLocalCompactMode}
              disabled={isReadOnly}
            />
          </div>
        </div>
        
        <Button 
          onClick={saveSettings} 
          disabled={isReadOnly}
          className="mt-4"
        >
          Save Appearance
        </Button>
      </CardContent>
    </Card>
  );
};

export default AppearanceSettings;
