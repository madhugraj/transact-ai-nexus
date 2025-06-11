
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Folder, RefreshCw, Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import { GoogleDriveFolderService, DriveFolder } from '@/services/drive/GoogleDriveFolderService';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DriveAdvancedConfigProps {
  config: any;
  onConfigUpdate: (key: string, value: any) => void;
}

export const DriveAdvancedConfig: React.FC<DriveAdvancedConfigProps> = ({
  config,
  onConfigUpdate
}) => {
  const { toast } = useToast();
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [useAIPODetection, setUseAIPODetection] = useState(
    config.driveConfig?.useAIPODetection || false
  );

  const folderService = new GoogleDriveFolderService();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      console.log('🔍 Checking Google Drive connection...');
      const isAuthenticated = await folderService.authenticate();
      setConnected(isAuthenticated);
      setConnectionError(null);
      
      if (isAuthenticated) {
        console.log('✅ Drive connected, loading folders...');
        await loadFolders();
      } else {
        console.log('❌ Drive not connected');
        setConnectionError('Google Drive authentication required. Please connect your account first.');
      }
    } catch (error) {
      console.error('❌ Connection check failed:', error);
      setConnected(false);
      setConnectionError(error instanceof Error ? error.message : 'Failed to connect to Google Drive');
    }
  };

  const loadFolders = async () => {
    setLoading(true);
    try {
      console.log('📁 Loading Drive folders...');
      const drivefolders = await folderService.listFolders();
      setFolders(drivefolders);
      console.log('✅ Loaded', drivefolders.length, 'folders from Drive');
      
      toast({
        title: "Folders Loaded",
        description: `Found ${drivefolders.length} folders in your Google Drive`,
      });
    } catch (error) {
      console.error('❌ Failed to load folders:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load Drive folders';
      setConnectionError(errorMessage);
      toast({
        title: "Error Loading Folders",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFolderSelect = (folderId: string) => {
    const selectedFolder = folders.find(f => f.id === folderId);
    if (selectedFolder) {
      onConfigUpdate('driveConfig', {
        ...config.driveConfig,
        selectedFolderId: folderId,
        folderPath: selectedFolder.path,
        folderName: selectedFolder.name
      });
      
      toast({
        title: "Folder Selected",
        description: `Selected: ${selectedFolder.name}`,
      });
    }
  };

  const enableAIPODetection = () => {
    setUseAIPODetection(true);
    onConfigUpdate('driveConfig', {
      ...config.driveConfig,
      useAIPODetection: true,
      aiDetectionRules: {
        detectPurchaseOrders: true,
        checkFileContent: true,
        aiConfidenceThreshold: 0.7,
        poKeywords: ['purchase order', 'po number', 'vendor', 'procurement', 'order form', 'purchase requisition']
      }
    });
    
    toast({
      title: "AI PO Detection Enabled",
      description: "Gemini AI will analyze files for Purchase Order indicators",
    });
  };

  const connectToDrive = () => {
    toast({
      title: "Connect to Google Drive",
      description: "Please use the Google Drive connector in the Email Connector page to authenticate first",
      variant: "default"
    });
  };

  if (connectionError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Google Drive Connection Issue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{connectionError}</AlertDescription>
          </Alert>
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Please connect to Google Drive first to access folders and enable AI-powered PO detection
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={connectToDrive} className="gap-2">
                <Folder className="h-4 w-4" />
                Connect to Drive
              </Button>
              <Button variant="outline" onClick={checkConnection} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry Connection
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-4 w-4" />
            Google Drive Connection Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect to Google Drive to access folders and enable AI-powered PO detection
            </p>
            <Button onClick={connectToDrive} className="gap-2">
              <Folder className="h-4 w-4" />
              Connect to Drive
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI-Powered PO Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            AI-Powered PO Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <Label className="font-medium">Enable AI PO Detection</Label>
              <p className="text-xs text-muted-foreground mt-1">
                {useAIPODetection 
                  ? "Gemini AI will analyze file content to identify Purchase Orders"
                  : "Enable to use AI for intelligent Purchase Order detection"
                }
              </p>
            </div>
            <Switch
              checked={useAIPODetection}
              onCheckedChange={(checked) => {
                if (checked) {
                  enableAIPODetection();
                } else {
                  setUseAIPODetection(false);
                  onConfigUpdate('driveConfig', {
                    ...config.driveConfig,
                    useAIPODetection: false,
                    aiDetectionRules: undefined
                  });
                }
              }}
            />
          </div>

          {useAIPODetection && (
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="flex flex-wrap gap-1 mb-2">
                {['purchase order', 'po number', 'vendor', 'procurement', 'order form', 'purchase requisition'].map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-purple-700">
                AI will scan for these keywords and content patterns to identify Purchase Orders
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Folder Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Folder Selection
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadFolders}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Select Drive Folder</Label>
              <Select 
                value={config.driveConfig?.selectedFolderId || ''} 
                onValueChange={handleFolderSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Loading folders..." : "Choose a folder"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">📁 Root (My Drive)</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      📁 {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {config.driveConfig?.selectedFolderId && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium">Selected Folder:</p>
                <p className="text-sm text-muted-foreground">
                  {config.driveConfig.folderName || 'Root'}
                </p>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="processSubfolders"
                checked={config.driveConfig?.processSubfolders !== false}
                onCheckedChange={(checked) => onConfigUpdate('driveConfig', {
                  ...config.driveConfig,
                  processSubfolders: checked
                })}
              />
              <Label htmlFor="processSubfolders">Include subfolders</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Type Filters */}
      <Card>
        <CardHeader>
          <CardTitle>File Type Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label>Process these file types:</Label>
            <div className="flex flex-wrap gap-2">
              {['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx'].map((type) => (
                <Badge 
                  key={type}
                  variant={config.driveConfig?.fileTypes?.includes(type) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    const currentTypes = config.driveConfig?.fileTypes || ['pdf'];
                    const updatedTypes = currentTypes.includes(type)
                      ? currentTypes.filter(t => t !== type)
                      : [...currentTypes, type];
                    
                    onConfigUpdate('driveConfig', {
                      ...config.driveConfig,
                      fileTypes: updatedTypes
                    });
                  }}
                >
                  {type.toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Source:</span>
              <span>{config.driveConfig?.source || 'Google Drive'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Folder:</span>
              <span>{config.driveConfig?.folderName || 'Root'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">AI PO Detection:</span>
              <span>{useAIPODetection ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">File Types:</span>
              <span>{config.driveConfig?.fileTypes?.join(', ') || 'PDF'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Include Subfolders:</span>
              <span>{config.driveConfig?.processSubfolders !== false ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
