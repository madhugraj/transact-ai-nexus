
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
      if (!stored) return {};
      
      const parsed = JSON.parse(stored);
      console.log('Retrieved stored tokens:', { 
        hasAccessToken: !!parsed.accessToken,
        timestamp: parsed.timestamp,
        age: parsed.timestamp ? Date.now() - parsed.timestamp : 'unknown'
      });
      
      return parsed;
    } catch (error) {
      console.error('Error retrieving stored tokens:', error);
      return {};
    }
  }

  // Store tokens
  storeTokens(accessToken: string, refreshToken?: string): void {
    try {
      const tokenData = {
        accessToken,
        refreshToken,
        timestamp: Date.now()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(tokenData));
      console.log('Stored new tokens:', { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken });
    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  }

  // Clear stored tokens
  clearTokens(): void {
    try {
      localStorage.removeItem(this.storageKey);
      console.log('Cleared stored tokens');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  // Check if we have valid stored tokens
  hasValidTokens(): boolean {
    const tokens = this.getStoredTokens();
    const hasTokens = !!tokens.accessToken;
    console.log('Checking token validity:', { hasTokens });
    return hasTokens;
  }

  // Updated authentication methods
  async signInWithGoogle(): Promise<void> {
    const result = await this.authenticateWithPopup();
    if (!result.success) {
      throw new Error(result.error || 'Authentication failed');
    }
  }

  async signOut(): Promise<void> {
    this.clearTokens();
  }

  async listFiles(): Promise<any[]> {
    const tokens = this.getStoredTokens();
    if (!tokens.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch files from Google Drive');
    }

    const data = await response.json();
    return data.files || [];
  }

  // Get the correct redirect URI - Use current domain
  private getRedirectUri(): string {
    const currentDomain = window.location.origin;
    const redirectUri = `${currentDomain}/oauth/callback`;
    
    console.log('🔧 Using current domain redirect URI:', redirectUri);
    
    return redirectUri;
  }

  // Create auth URL for popup with current domain
  createAuthUrl(): string {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    const redirectUri = this.getRedirectUri();
    
    console.log('🔧 Creating auth URL with current domain config:', {
      clientId: this.config.clientId,
      redirectUri: redirectUri,
      scopes: this.config.scopes.join(' ')
    });
    
    authUrl.searchParams.set('client_id', this.config.clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', this.config.scopes.join(' '));
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    
    // Add state parameter for additional security
    authUrl.searchParams.set('state', Math.random().toString(36).substring(2, 15));
    
    const finalUrl = authUrl.toString();
    console.log('🔧 Generated auth URL with current domain:', finalUrl);
    
    return finalUrl;
  }

  // Simplified popup-based authentication using postMessage
  async authenticateWithPopup(): Promise<AuthResult> {
    console.log('🚀 Starting popup authentication...');
    
    return new Promise((resolve) => {
      // Create a simplified auth URL that redirects to a data URL with postMessage
      const authUrl = this.createSimpleAuthUrl();
      
      console.log('🔗 Opening popup with URL:', authUrl);
      
      const popup = window.open(
        authUrl, 
        'google-auth', 
        'width=500,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,directories=no,status=no'
      );

      if (!popup) {
        console.error('❌ Popup was blocked by browser');
        resolve({ 
          success: false, 
          error: 'Popup was blocked. Please allow popups for this site and try again.' 
        });
        return;
      }

      console.log('✅ Popup opened successfully');

      let messageReceived = false;
      let checkClosedInterval: NodeJS.Timeout;

      // Listen for messages from the popup
      const messageListener = (event: MessageEvent) => {
        console.log('📨 Message received:', {
          origin: event.origin,
          data: event.data
        });
        
        // Check if this is our OAuth response
        if (event.data && typeof event.data === 'object' && event.data.type === 'GOOGLE_AUTH') {
          messageReceived = true;
          console.log('✅ Valid OAuth message received');
          
          // Clean up
          window.removeEventListener('message', messageListener);
          if (checkClosedInterval) {
            clearInterval(checkClosedInterval);
          }
          
          // Close popup
          if (popup && !popup.closed) {
            popup.close();
          }
          
          if (event.data.success && event.data.accessToken) {
            console.log('🔄 OAuth success, storing tokens...');
            this.storeTokens(event.data.accessToken, event.data.refreshToken);
            resolve({
              success: true,
              accessToken: event.data.accessToken,
              refreshToken: event.data.refreshToken
            });
          } else {
            console.error('❌ OAuth error:', event.data.error);
            resolve({ success: false, error: event.data.error || 'Authentication failed' });
          }
        }
      };

      // Add message listener
      window.addEventListener('message', messageListener);
      console.log('👂 Message listener added, waiting for popup response...');

      // Check if popup was closed manually
      checkClosedInterval = setInterval(() => {
        if (popup.closed) {
          console.log('⚠️ Popup was closed');
          clearInterval(checkClosedInterval);
          window.removeEventListener('message', messageListener);
          
          if (!messageReceived) {
            console.log('❌ No message received before popup closed');
            resolve({ 
              success: false, 
              error: 'Authentication was cancelled. Please complete the authentication process.' 
            });
          }
        }
      }, 250);

      // Timeout after 5 minutes
      setTimeout(() => {
        if (!messageReceived) {
          console.log('⏰ Authentication timeout');
          clearInterval(checkClosedInterval);
          window.removeEventListener('message', messageListener);
          if (popup && !popup.closed) {
            popup.close();
          }
          resolve({ 
            success: false, 
            error: 'Authentication timeout. Please try again.' 
          });
        }
      }, 5 * 60 * 1000);
    });
  }

  // Create a simple auth URL that will work with the Google API directly
  private createSimpleAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'token',  // Use implicit flow for simplicity
      scope: this.config.scopes.join(' '),
      redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',  // Use out-of-band flow
      state: Math.random().toString(36).substring(2, 15)
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }
}
