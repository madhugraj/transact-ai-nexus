
export interface AuthConfig {
  clientId: string;
  scopes: string[];
  redirectUri: string;
}

export interface AuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

export class GoogleAuthService {
  private config: AuthConfig;
  private storageKey: string;

  constructor(config: AuthConfig, storageKey: string = 'google_auth_tokens') {
    this.config = config;
    this.storageKey = storageKey;
  }

  // Get stored tokens
  getStoredTokens(): { accessToken?: string; refreshToken?: string } {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  // Store tokens
  storeTokens(accessToken: string, refreshToken?: string): void {
    localStorage.setItem(this.storageKey, JSON.stringify({
      accessToken,
      refreshToken,
      timestamp: Date.now()
    }));
  }

  // Clear stored tokens
  clearTokens(): void {
    localStorage.removeItem(this.storageKey);
  }

  // Check if we have valid stored tokens
  hasValidTokens(): boolean {
    const tokens = this.getStoredTokens();
    return !!tokens.accessToken;
  }

  // Get the correct redirect URI based on current domain
  private getRedirectUri(): string {
    const currentHost = window.location.hostname;
    
    // Use the exact redirect URIs configured in Google Cloud Console
    if (currentHost === '79d72649-d878-4ff4-9672-26026a4d9011.lovableproject.com') {
      return 'https://79d72649-d878-4ff4-9672-26026a4d9011.lovableproject.com/oauth/callback';
    } else if (currentHost === 'transact-ai-nexus.lovable.app') {
      return 'https://transact-ai-nexus.lovable.app/oauth/callback';
    } else if (currentHost === 'preview--transact-ai-nexus.lovable.app') {
      return 'https://preview--transact-ai-nexus.lovable.app/oauth/callback';
    } else {
      // Fallback for localhost or other domains
      return `${window.location.origin}/oauth/callback`;
    }
  }

  // Create auth URL with correct redirect URI
  createAuthUrl(): string {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    const redirectUri = this.getRedirectUri();
    
    console.log('Auth URL Debug Info:');
    console.log('- Client ID:', this.config.clientId);
    console.log('- Redirect URI:', redirectUri);
    console.log('- Current Host:', window.location.hostname);
    console.log('- Current URL:', window.location.href);
    
    authUrl.searchParams.set('client_id', this.config.clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', this.config.scopes.join(' '));
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    
    const finalUrl = authUrl.toString();
    console.log('Final Auth URL:', finalUrl);
    
    return finalUrl;
  }

  // Popup-based authentication
  async authenticateWithPopup(): Promise<AuthResult> {
    return new Promise((resolve) => {
      const authUrl = this.createAuthUrl();
      console.log('Opening popup with URL:', authUrl);
      
      const popup = window.open(authUrl, 'google-auth', 'width=500,height=600,scrollbars=yes,resizable=yes');

      if (!popup) {
        console.error('Popup was blocked');
        resolve({ success: false, error: 'Popup was blocked. Please allow popups for this site.' });
        return;
      }

      const messageListener = (event: MessageEvent) => {
        console.log('Received message:', event);
        
        if (event.origin !== window.location.origin) {
          console.log('Message from different origin, ignoring:', event.origin);
          return;
        }

        if (event.data?.type === 'OAUTH_SUCCESS' && event.data?.code) {
          console.log('OAuth success received, code:', event.data.code);
          window.removeEventListener('message', messageListener);
          popup.close();
          this.exchangeCodeForToken(event.data.code).then(resolve);
        } else if (event.data?.type === 'OAUTH_ERROR') {
          console.error('OAuth error received:', event.data.error);
          window.removeEventListener('message', messageListener);
          popup.close();
          resolve({ success: false, error: event.data.error || 'Authentication failed' });
        }
      };

      window.addEventListener('message', messageListener);

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          console.log('Popup was closed manually');
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          resolve({ success: false, error: 'Authentication was cancelled' });
        }
      }, 1000);
    });
  }

  // Exchange auth code for tokens
  private async exchangeCodeForToken(authCode: string): Promise<AuthResult> {
    try {
      console.log('Exchanging auth code for tokens...');
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('google-auth', {
        body: {
          authCode,
          scope: this.config.scopes.join(' '),
          redirectUri: this.getRedirectUri()
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('Token exchange response:', data);

      if (data.success) {
        this.storeTokens(data.accessToken, data.refreshToken);
        return {
          success: true,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken
        };
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Token exchange error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token exchange failed'
      };
    }
  }
}
