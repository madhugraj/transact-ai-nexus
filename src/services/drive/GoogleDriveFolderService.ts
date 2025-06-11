
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
      // Check if we have a valid access token stored
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User not authenticated');
        return false;
      }

      // For now, we'll use the existing Google auth flow
      // In a real implementation, you'd store the Drive access token
      const storedToken = localStorage.getItem('google_drive_access_token');
      if (storedToken) {
        this.accessToken = storedToken;
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Drive authentication failed:', error);
      return false;
    }
  }

  async listFolders(parentId: string = 'root'): Promise<DriveFolder[]> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error('Google Drive authentication required');
      }
    }

    try {
      console.log('📁 Fetching Drive folders from parent:', parentId);
      
      const { data, error } = await supabase.functions.invoke('google-drive', {
        body: {
          accessToken: this.accessToken,
          action: 'list',
          folderId: parentId === 'root' ? null : parentId
        }
      });

      if (error) {
        console.error('❌ Error fetching Drive folders:', error);
        throw new Error('Failed to fetch Drive folders');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to fetch Drive folders');
      }

      const folders: DriveFolder[] = (data.data || [])
        .filter((item: any) => item.mimeType === 'application/vnd.google-apps.folder')
        .map((folder: any) => ({
          id: folder.id,
          name: folder.name,
          path: folder.name, // We'll build the full path later
          parentId: folder.parents?.[0],
          isFolder: true
        }));

      console.log('✅ Fetched', folders.length, 'folders from Drive');
      return folders;
    } catch (error) {
      console.error('❌ Failed to list Drive folders:', error);
      throw error;
    }
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
  }

  clearAccessToken() {
    this.accessToken = null;
    localStorage.removeItem('google_drive_access_token');
  }
}
