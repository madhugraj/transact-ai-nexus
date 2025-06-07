
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

  // Get the correct redirect URI - Use FIXED domain as specified
  private getRedirectUri(): string {
    const redirectUri = 'https://transact-ai-nexus.lovable.app/oauth/callback';
    
    console.log('🔧 Using FIXED Redirect URI:', redirectUri);
    
    return redirectUri;
  }

  // Create auth URL for popup with FIXED redirect URI
  createAuthUrl(): string {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    const redirectUri = this.getRedirectUri();
    
    console.log('🔧 Creating auth URL with FIXED config:', {
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
    
    const finalUrl = authUrl.toString();
    console.log('🔧 Generated auth URL with FIXED domain:', finalUrl);
    
    return finalUrl;
  }

  // Popup-based authentication
  async authenticateWithPopup(): Promise<AuthResult> {
    console.log('🚀 Starting popup authentication...');
    
    // Log current environment details for debugging
    console.log('🔧 Environment Details:', {
      currentOrigin: window.location.origin,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      port: window.location.port
    });
    
    return new Promise((resolve) => {
      const authUrl = this.createAuthUrl();
      
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

      let messageReceived = false;
      let checkClosedInterval: NodeJS.Timeout;

      // Listen for messages from the popup - improved message handling
      const messageListener = (event: MessageEvent) => {
        console.log('📨 Received message event:', {
          origin: event.origin,
          type: event.data?.type,
          hasCode: !!event.data?.code,
          timestamp: event.data?.timestamp,
          rawData: event.data
        });
        
        // Accept messages with the expected structure and validate timestamp
        if (event.data && 
            typeof event.data === 'object' && 
            event.data.timestamp && 
            (event.data.type === 'OAUTH_SUCCESS' || event.data.type === 'OAUTH_ERROR')) {
          
          messageReceived = true;
          console.log(`✅ ${event.data.type} message received and processed`);
          
          // Clean up listeners and intervals
          window.removeEventListener('message', messageListener);
          if (checkClosedInterval) {
            clearInterval(checkClosedInterval);
          }
          
          // Close popup
          setTimeout(() => {
            if (popup && !popup.closed) {
              popup.close();
            }
          }, 500);
          
          if (event.data.type === 'OAUTH_SUCCESS') {
            if (event.data.code) {
              console.log('🔄 OAuth success, exchanging code for tokens...');
              this.exchangeCodeForToken(event.data.code).then(resolve);
            } else {
              console.error('❌ No authorization code received');
              resolve({ success: false, error: 'No authorization code received' });
            }
          } else if (event.data.type === 'OAUTH_ERROR') {
            console.error('❌ OAuth error:', event.data.error);
            resolve({ success: false, error: event.data.error || 'Authentication failed' });
          }
        } else {
          console.log('📨 Ignoring message - invalid structure or type:', event.data);
        }
      };

      // Add message listener
      window.addEventListener('message', messageListener);

      // Check if popup was closed manually with improved timing
      checkClosedInterval = setInterval(() => {
        if (popup.closed) {
          console.log('⚠️ Popup was closed manually');
          clearInterval(checkClosedInterval);
          window.removeEventListener('message', messageListener);
          
          if (!messageReceived) {
            console.log('❌ Authentication cancelled by user');
            resolve({ 
              success: false, 
              error: 'Authentication was cancelled. Please try again and complete the Google authorization process.' 
            });
          }
        }
      }, 500); // Check more frequently

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
            error: 'Authentication timeout. Please try again and complete the process more quickly.' 
          });
        }
      }, 5 * 60 * 1000);
    });
  }

  // Exchange auth code for tokens
  private async exchangeCodeForToken(authCode: string): Promise<AuthResult> {
    try {
      console.log('🔄 Exchanging authorization code for access token...');
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Use the FIXED redirect URI for consistency
      const redirectUri = this.getRedirectUri();
      
      console.log('🔧 Token exchange request details:', {
        hasAuthCode: !!authCode,
        redirectUri,
        scopes: this.config.scopes.join(' ')
      });
      
      const { data, error } = await supabase.functions.invoke('google-auth', {
        body: {
          authCode,
          scope: this.config.scopes.join(' '),
          redirectUri: redirectUri
        }
      });

      if (error) {
        console.error('❌ Token exchange error:', error);
        throw error;
      }

      console.log('📊 Token exchange response:', { 
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
      console.error('❌ Token exchange failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token exchange failed'
      };
    }
  }
}
