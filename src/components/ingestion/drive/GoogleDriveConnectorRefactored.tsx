
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { GoogleAuthService } from '@/services/auth/googleAuthService';
import ConnectionStatus from './ConnectionStatus';
import FileBrowser from './FileBrowser';
import ProcessingSection from './ProcessingSection';
import { extractPODataFromFile } from '@/services/api/poProcessingService';
import { supabase } from '@/integrations/supabase/client';

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink: string;
  parents?: string[];
}

const GoogleDriveConnectorRefactored: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<GoogleDriveFile[]>([]);
  const [selectedPOFiles, setSelectedPOFiles] = useState<GoogleDriveFile[]>([]);
  const [downloadedFiles, setDownloadedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResults, setProcessingResults] = useState<any[]>([]);
  const { toast } = useToast();

  // Create auth service instance with current domain redirect URI
  const authService = new GoogleAuthService({
    clientId: '59647658413-2aq8dou9iikfe6dq6ujsp1aiaku5r985.apps.googleusercontent.com',
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    redirectUri: `${window.location.origin}/oauth/callback`  // Use current domain
  }, 'drive_auth_tokens');

  // Enhanced authentication check with better persistence and auto-loading
  React.useEffect(() => {
    console.log('🔧 GoogleDrive connector mounted, checking for stored tokens...');
    
    const checkStoredAuth = async () => {
      const hasValidTokens = authService.hasValidTokens();
      const tokens = authService.getStoredTokens();
      
      console.log('🔍 Auth check results:', { hasValidTokens, hasAccessToken: !!tokens.accessToken });
      
      if (hasValidTokens && tokens.accessToken) {
        console.log('✅ Found valid stored tokens, setting connected state');
        setIsConnected(true);
        
        // Auto-load files when connection is restored
        try {
          console.log('📁 Auto-loading files from Google Drive...');
          const fileList = await authService.listFiles();
          setFiles(fileList);
          console.log(`📁 Auto-loaded ${fileList.length} files from Google Drive`);
        } catch (error) {
          console.error('❌ Error auto-loading files:', error);
          // If file loading fails, token might be expired
          if (error instanceof Error && error.message.includes('401')) {
            console.log('🔄 Token expired, clearing auth state');
            authService.clearTokens();
            setIsConnected(false);
          }
        }
      } else {
        console.log('❌ No valid tokens found, user needs to authenticate');
        setIsConnected(false);
      }
    };

    // Check immediately
    checkStoredAuth();
    
    // Listen for storage changes (in case user authenticates in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'drive_auth_tokens') {
        console.log('🔄 Storage changed, rechecking auth...');
        checkStoredAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Only run once on mount

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      console.log('🔗 Starting Google Drive authentication...');
      
      await authService.signInWithGoogle();
      setIsConnected(true);
      
      // Load files immediately after connection
      await loadFiles();
      
      toast({
        title: "Connected to Google Drive",
        description: "Successfully connected to your Google Drive account.",
      });
    } catch (error) {
      console.error("Google Drive connection error:", error);
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to connect to Google Drive.",
        variant: "destructive",
      });
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      await authService.signOut();
      setIsConnected(false);
      setFiles([]);
      setSelectedFiles([]);
      setDownloadedFiles([]);
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from Google Drive.",
      });
    } catch (error) {
      console.error("Google Drive disconnection error:", error);
      toast({
        title: "Disconnection Error",
        description: error instanceof Error ? error.message : "Failed to disconnect from Google Drive.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const fileList = await authService.listFiles();
      setFiles(fileList);
      toast({
        title: "Files Loaded",
        description: `Successfully loaded ${fileList.length} files from Google Drive.`,
      });
    } catch (error) {
      console.error("Error loading files from Google Drive:", error);
      toast({
        title: "File Loading Error",
        description: error instanceof Error ? error.message : "Failed to load files from Google Drive.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileToggle = (file: GoogleDriveFile) => {
    setSelectedFiles(prev =>
      prev.some(f => f.id === file.id)
        ? prev.filter(f => f.id !== file.id)
        : [...prev, file]
    );
  };

  const handlePOFileToggle = (file: GoogleDriveFile) => {
    setSelectedPOFiles(prev =>
      prev.some(f => f.id === file.id)
        ? prev.filter(f => f.id !== file.id)
        : [...prev, file]
    );
  };

  const handleBulkProcess = async () => {
    if (selectedPOFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select PO files to process",
        variant: "destructive"
      });
      return;
    }

    console.log(`🚀 Starting bulk processing of ${selectedPOFiles.length} files...`);
    setIsProcessing(true);
    setProcessingResults([]);
    
    try {
      toast({
        title: "Processing Started",
        description: `Processing ${selectedPOFiles.length} PO file(s)...`,
      });

      const results = [];
      
      for (let i = 0; i < selectedPOFiles.length; i++) {
        const file = selectedPOFiles[i];
        console.log(`📄 Processing file ${i + 1}/${selectedPOFiles.length}: ${file.name}`);
        
        try {
          // Download file data using the access token
          const tokens = authService.getStoredTokens();
          if (!tokens.accessToken) {
            throw new Error('No access token found. Please reconnect to Google Drive.');
          }

          const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
          const response = await fetch(downloadUrl, {
            headers: {
              'Authorization': `Bearer ${tokens.accessToken}`
            }
          });

          if (!response.ok) {
            throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
          }

          const arrayBuffer = await response.arrayBuffer();
          const blob = new Blob([arrayBuffer], { type: file.mimeType });
          const fileObject = new File([blob], file.name, { type: file.mimeType });

          // Process with our dedicated PO service
          const extractionResult = await extractPODataFromFile(fileObject);
          console.log(`🔍 Extraction result for ${file.name}:`, extractionResult);

          if (extractionResult.success && extractionResult.data) {
            const result = {
              fileName: file.name,
              fileSize: file.size,
              status: 'success',
              data: extractionResult.data,
              supabaseData: extractionResult.supabaseData,
              processingTime: Date.now()
            };
            results.push(result);
            console.log(`✅ Successfully processed: ${file.name}`);
            
            // Update results incrementally so user can see progress
            setProcessingResults([...results]);
          } else {
            const errorResult = {
              fileName: file.name,
              fileSize: file.size,
              status: 'error',
              error: extractionResult.error || 'Failed to extract data',
              processingTime: Date.now()
            };
            results.push(errorResult);
            console.log(`❌ Failed to process: ${file.name}`, extractionResult.error);
            
            // Update results incrementally
            setProcessingResults([...results]);
          }
        } catch (error) {
          const errorResult = {
            fileName: file.name,
            fileSize: file.size,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            processingTime: Date.now()
          };
          results.push(errorResult);
          console.error(`❌ Error processing ${file.name}:`, error);
          
          // Update results incrementally
          setProcessingResults([...results]);
        }
      }

      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      toast({
        title: "Processing Complete",
        description: `Successfully processed ${successCount} files. ${errorCount > 0 ? `${errorCount} errors.` : ''}`,
        variant: errorCount > 0 ? "destructive" : "default"
      });

      console.log(`✅ Bulk processing complete. Success: ${successCount}, Errors: ${errorCount}`);

    } catch (error) {
      console.error(`❌ Bulk processing error:`, error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process files",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkSaveToDatabase = async () => {
    const successfulResults = processingResults.filter(r => r.status === 'success' && r.supabaseData);
    
    if (successfulResults.length === 0) {
      toast({
        title: "No data to save",
        description: "No successfully processed files with valid data",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Saving multiple PO records to Supabase po_table:', successfulResults.length);
      
      const dataToInsert = successfulResults.map(result => result.supabaseData);
      
      const { data, error } = await supabase
        .from('po_table')
        .insert(dataToInsert)
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "Success!",
        description: `Saved ${successfulResults.length} PO records to database successfully`,
      });

      console.log('Successfully saved to po_table:', data);
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const importFiles = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to import.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const filesToDownload = [...selectedFiles]; // Copy selectedFiles to avoid modifying the original array
      const downloadedFilesData: File[] = [];

      for (const file of filesToDownload) {
        try {
          const tokens = authService.getStoredTokens();
          if (!tokens.accessToken) {
            throw new Error('No access token found. Please reconnect to Google Drive.');
          }

          const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
          const response = await fetch(downloadUrl, {
            headers: {
              'Authorization': `Bearer ${tokens.accessToken}`
            }
          });

          if (!response.ok) {
            throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
          }

          const arrayBuffer = await response.arrayBuffer();
          const blob = new Blob([arrayBuffer], { type: file.mimeType });
          const fileObject = new File([blob], file.name, { type: file.mimeType });

          downloadedFilesData.push(fileObject);
          console.log(`✅ Downloaded file: ${file.name}, size: ${fileObject.size} bytes, type: ${fileObject.type}`);

        } catch (downloadError) {
          console.error(`❌ Error downloading file ${file.name}:`, downloadError);
          toast({
            title: "File Download Error",
            description: `Failed to download ${file.name}: ${downloadError instanceof Error ? downloadError.message : 'Unknown error'}`,
            variant: "destructive",
          });
        }
      }

      setDownloadedFiles(downloadedFilesData);
      setSelectedFiles([]); // Clear selected files after successful download
      toast({
        title: "Files Downloaded",
        description: `Successfully prepared ${downloadedFilesData.length} files for processing.`,
      });

    } catch (error) {
      console.error("Error during file import:", error);
      toast({
        title: "Import Error",
        description: error instanceof Error ? error.message : "Failed to import files.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessingComplete = (results: any[]) => {
    console.log('Processing complete with results:', results);
    // Results are already being handled in the processing loop
  };

  return (
    <div className="space-y-4">
      <ConnectionStatus 
        isConnected={isConnected}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onLoadFiles={loadFiles}
        isLoading={isLoading}
      />
      
      {isConnected && (
        <FileBrowser
          files={files}
          selectedFiles={selectedFiles}
          selectedPOFiles={selectedPOFiles}
          isLoading={isLoading}
          onFileToggle={handleFileToggle}
          onPOFileToggle={handlePOFileToggle}
          onImportFiles={importFiles}
          onBulkProcess={handleBulkProcess}
          onBulkSaveToDatabase={handleBulkSaveToDatabase}
          isProcessing={isProcessing}
          processingResults={processingResults}
        />
      )}
      
      {downloadedFiles.length > 0 && (
        <ProcessingSection
          downloadedFiles={downloadedFiles}
          onProcessingComplete={handleProcessingComplete}
          onClose={() => setDownloadedFiles([])}
        />
      )}
    </div>
  );
};

export default GoogleDriveConnectorRefactored;
