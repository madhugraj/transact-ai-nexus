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

  // Get the correct redirect URI based on current domain
  private getRedirectUri(): string {
    const currentOrigin = window.location.origin;
    
    // Map of allowed origins to their redirect URIs
    const allowedRedirects = [
      'https://79d72649-d878-4ff4-9672-26026a4d9011.lovableproject.com/oauth/callback',
      'https://transact-ai-nexus.lovable.app/oauth/callback',
      'https://preview--transact-ai-nexus.lovable.app/oauth/callback'
    ];
    
    // Find matching redirect URI for current origin
    for (const uri of allowedRedirects) {
      const uriOrigin = new URL(uri).origin;
      if (currentOrigin === uriOrigin) {
        console.log('Using redirect URI:', uri, 'for origin:', currentOrigin);
        return uri;
      }
    }
    
    // Fallback to the project-specific URI
    const fallbackUri = 'https://79d72649-d878-4ff4-9672-26026a4d9011.lovableproject.com/oauth/callback';
    console.log('No exact match found, using fallback URI:', fallbackUri, 'for origin:', currentOrigin);
    return fallbackUri;
  }

  // Create auth URL for popup with correct redirect URI
  createAuthUrl(): string {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    const redirectUri = this.getRedirectUri();
    
    console.log('Creating auth URL with config:', {
      clientId: this.config.clientId,
      redirectUri: redirectUri,
      scopes: this.config.scopes.join(' '),
      currentOrigin: window.location.origin
    });
    
    authUrl.searchParams.set('client_id', this.config.clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', this.config.scopes.join(' '));
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    
    const finalUrl = authUrl.toString();
    console.log('Generated auth URL (truncated):', finalUrl.substring(0, 100) + '...');
    
    return finalUrl;
  }

  // Popup-based authentication
  async authenticateWithPopup(): Promise<AuthResult> {
    console.log('Starting popup authentication...');
    
    return new Promise((resolve) => {
      const authUrl = this.createAuthUrl();
      
      const popup = window.open(
        authUrl, 
        'google-auth', 
        'width=500,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,directories=no,status=no'
      );

      if (!popup) {
        console.error('Popup was blocked by browser');
        resolve({ success: false, error: 'Popup was blocked. Please allow popups for this site.' });
        return;
      }

      let messageReceived = false;

      // Listen for messages from the popup
      const messageListener = (event: MessageEvent) => {
        // Accept messages from our OAuth callback page and current origin
        const allowedOrigins = [
          window.location.origin,
          'https://transact-ai-nexus.lovable.app',
          'https://preview--transact-ai-nexus.lovable.app'
        ];
        
        if (!allowedOrigins.includes(event.origin)) {
          console.log('Message from unexpected origin ignored:', event.origin);
          return;
        }

        console.log('Received auth message:', event.data);
        
        if (event.data && event.data.type === 'OAUTH_SUCCESS') {
          messageReceived = true;
          window.removeEventListener('message', messageListener);
          
          setTimeout(() => {
            if (!popup.closed) {
              popup.close();
            }
          }, 100);
          
          if (event.data.code) {
            console.log('OAuth success, exchanging code for tokens...');
            this.exchangeCodeForToken(event.data.code).then(resolve);
          } else {
            console.error('No authorization code received');
            resolve({ success: false, error: 'No authorization code received' });
          }
        } else if (event.data && event.data.type === 'OAUTH_ERROR') {
          messageReceived = true;
          window.removeEventListener('message', messageListener);
          
          setTimeout(() => {
            if (!popup.closed) {
              popup.close();
            }
          }, 100);
          
          console.error('OAuth error:', event.data.error);
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
          
          if (!messageReceived) {
            console.log('Authentication cancelled by user');
            resolve({ success: false, error: 'Authentication was cancelled' });
          }
        }
      }, 2000);
    });
  }

  // Exchange auth code for tokens
  private async exchangeCodeForToken(authCode: string): Promise<AuthResult> {
    try {
      console.log('Exchanging authorization code for access token...');
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Use the same redirect URI as in createAuthUrl for consistency
      const redirectUri = this.getRedirectUri();
      
      const { data, error } = await supabase.functions.invoke('google-auth', {
        body: {
          authCode,
          scope: this.config.scopes.join(' '),
          redirectUri: redirectUri
        }
      });

      if (error) {
        console.error('Token exchange error:', error);
        throw error;
      }

      console.log('Token exchange response:', { 
        success: data?.success, 
        hasAccessToken: !!data?.accessToken,
        hasRefreshToken: !!data?.refreshToken 
      });

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
      console.error('Token exchange failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token exchange failed'
      };
    }
  }
}
