
import { supabase } from '@/integrations/supabase/client';

export interface DriveFolder {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  isFolder: boolean;
}

export class GoogleDriveFolderService {
  private accessToken: string | null = null;

  async authenticate(): Promise<boolean> {
    try {
      console.log('🔐 Authenticating with Google Drive...');
      
      // Check if we have a valid access token stored
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User not authenticated with Supabase');
        return false;
      }

      // Try to get the access token from localStorage first
      const storedToken = localStorage.getItem('google_drive_access_token');
      if (storedToken) {
        console.log('✅ Found stored Google Drive access token');
        this.accessToken = storedToken;
        
        // Test the token by making a simple API call
        try {
          await this.testConnection();
          return true;
        } catch (error) {
          console.warn('⚠️ Stored token invalid, clearing it');
          this.clearAccessToken();
        }
      }

      // Check if we can get a fresh token from the Google auth session
      const googleToken = localStorage.getItem('google_access_token');
      if (googleToken) {
        console.log('✅ Found Google access token, using for Drive');
        this.accessToken = googleToken;
        localStorage.setItem('google_drive_access_token', googleToken);
        return true;
      }

      console.log('❌ No valid Google Drive access token found');
      return false;
    } catch (error) {
      console.error('❌ Drive authentication failed:', error);
      return false;
    }
  }

  private async testConnection(): Promise<void> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Token validation failed');
    }
  }

  async listFolders(parentId: string = 'root'): Promise<DriveFolder[]> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error('Google Drive authentication required. Please connect your Google account first.');
      }
    }

    try {
      console.log('📁 Fetching Drive folders from parent:', parentId);
      
      // Use Supabase Edge Function for Google Drive API calls
      const { data, error } = await supabase.functions.invoke('google-drive', {
        body: {
          accessToken: this.accessToken,
          action: 'list',
          folderId: parentId === 'root' ? null : parentId,
          mimeType: 'application/vnd.google-apps.folder'
        }
      });

      if (error) {
        console.error('❌ Error from Supabase function:', error);
        throw new Error('Failed to fetch Drive folders: ' + error.message);
      }

      if (!data?.success) {
        console.error('❌ Drive API error:', data?.error);
        throw new Error(data?.error || 'Failed to fetch Drive folders');
      }

      const folders: DriveFolder[] = (data.data || [])
        .filter((item: any) => item.mimeType === 'application/vnd.google-apps.folder')
        .map((folder: any) => ({
          id: folder.id,
          name: folder.name,
          path: this.buildFolderPath(folder.name, parentId),
          parentId: folder.parents?.[0],
          isFolder: true
        }));

      console.log('✅ Fetched', folders.length, 'folders from Drive');
      return folders;
    } catch (error) {
      console.error('❌ Failed to list Drive folders:', error);
      if (error instanceof Error && error.message.includes('401')) {
        // Token expired, clear it
        this.clearAccessToken();
        throw new Error('Google Drive access token expired. Please reconnect your account.');
      }
      throw error;
    }
  }

  private buildFolderPath(folderName: string, parentId: string): string {
    if (parentId === 'root') {
      return `/${folderName}`;
    }
    // For now, return simple path. In a full implementation, 
    // you'd recursively build the full path
    return `/${folderName}`;
  }

  async getFolderPath(folderId: string): Promise<string> {
    if (folderId === 'root') return '/';
    
    try {
      // This would require multiple API calls to build the full path
      // For now, we'll return the folder name
      return `/${folderId}`;
    } catch (error) {
      console.error('❌ Failed to get folder path:', error);
      return `/${folderId}`;
    }
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    localStorage.setItem('google_drive_access_token', token);
    console.log('✅ Google Drive access token stored');
  }

  clearAccessToken() {
    this.accessToken = null;
    localStorage.removeItem('google_drive_access_token');
    console.log('🗑️ Google Drive access token cleared');
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}
