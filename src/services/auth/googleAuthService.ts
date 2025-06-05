
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

  // Create auth URL for popup (no redirect needed)
  createAuthUrl(): string {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    
    console.log('Auth URL Debug Info:');
    console.log('- Client ID:', this.config.clientId);
    console.log('- Using popup mode (no redirect URI)');
    console.log('- Current Host:', window.location.hostname);
    console.log('- Current URL:', window.location.href);
    
    authUrl.searchParams.set('client_id', this.config.clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', this.config.scopes.join(' '));
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    // For popup mode, we use postMessage instead of redirect
    authUrl.searchParams.set('redirect_uri', 'postmessage');
    
    const finalUrl = authUrl.toString();
    console.log('Final Auth URL:', finalUrl);
    
    return finalUrl;
  }

  // Popup-based authentication using postMessage
  async authenticateWithPopup(): Promise<AuthResult> {
    return new Promise((resolve) => {
      const authUrl = this.createAuthUrl();
      console.log('Opening popup with URL:', authUrl);
      
      const popup = window.open(
        authUrl, 
        'google-auth', 
        'width=500,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,directories=no,status=no'
      );

      if (!popup) {
        console.error('Popup was blocked');
        resolve({ success: false, error: 'Popup was blocked. Please allow popups for this site.' });
        return;
      }

      // Listen for postMessage from the popup
      const messageListener = (event: MessageEvent) => {
        // Google OAuth sends messages from accounts.google.com
        if (event.origin !== 'https://accounts.google.com') {
          return;
        }

        console.log('Received message from Google:', event);
        
        if (event.data && event.data.type === 'authorization_response') {
          window.removeEventListener('message', messageListener);
          popup.close();
          
          if (event.data.response && event.data.response.code) {
            console.log('OAuth success received, code:', event.data.response.code);
            this.exchangeCodeForToken(event.data.response.code).then(resolve);
          } else if (event.data.response && event.data.response.error) {
            console.error('OAuth error received:', event.data.response.error);
            resolve({ success: false, error: event.data.response.error || 'Authentication failed' });
          }
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
          redirectUri: 'postmessage' // Use postmessage for popup mode
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
