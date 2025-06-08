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

interface StoredTokens {
  accessToken?: string;
  refreshToken?: string;
  timestamp?: number;
}

export class GoogleAuthService {
  private config: AuthConfig;
  private storageKey: string;

  constructor(config: AuthConfig, storageKey: string = 'google_auth_tokens') {
    this.config = config;
    this.storageKey = storageKey;
  }

  // Get stored tokens
  getStoredTokens(): StoredTokens {
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

  // Simplified token validity check
  hasValidTokens(): boolean {
    const tokens = this.getStoredTokens();
    const hasTokens = !!tokens.accessToken;
    
    // Check if tokens are not too old (24 hours)
    if (hasTokens && tokens.timestamp) {
      const tokenAge = Date.now() - tokens.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (tokenAge > maxAge) {
        console.log('Tokens are too old, clearing them');
        this.clearTokens();
        return false;
      }
    }
    
    console.log('Checking token validity:', { 
      hasTokens, 
      age: tokens.timestamp ? Math.round((Date.now() - tokens.timestamp) / 1000 / 60) + ' minutes' : 'unknown'
    });
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

  // Create auth URL for popup with proper redirect URI
  private createAuthUrl(): string {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    const redirectUri = `${window.location.origin}/oauth/callback`;
    
    console.log('🔧 Creating auth URL with redirect URI:', redirectUri);
    
    authUrl.searchParams.set('client_id', this.config.clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', this.config.scopes.join(' '));
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    
    authUrl.searchParams.set('state', Math.random().toString(36).substring(2, 15));
    
    const finalUrl = authUrl.toString();
    console.log('🔧 Generated auth URL:', finalUrl);
    
    return finalUrl;
  }

  // Popup-based authentication using proper redirect
  async authenticateWithPopup(): Promise<AuthResult> {
    console.log('🚀 Starting popup authentication...');
    
    return new Promise((resolve) => {
      const authUrl = this.createAuthUrl();
      
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

      const messageListener = (event: MessageEvent) => {
        console.log('📨 Message received:', {
          origin: event.origin,
          data: event.data
        });
        
        if (event.data && typeof event.data === 'object') {
          if (event.data.type === 'OAUTH_SUCCESS' && event.data.code) {
            messageReceived = true;
            console.log('✅ OAuth success message received');
            
            window.removeEventListener('message', messageListener);
            if (checkClosedInterval) {
              clearInterval(checkClosedInterval);
            }
            
            if (popup && !popup.closed) {
              popup.close();
            }
            
            this.exchangeCodeForTokens(event.data.code).then((tokenResult) => {
              if (tokenResult.success) {
                resolve(tokenResult);
              } else {
                resolve({ success: false, error: tokenResult.error });
              }
            }).catch((error) => {
              resolve({ success: false, error: error.message });
            });
            
          } else if (event.data.type === 'OAUTH_ERROR') {
            messageReceived = true;
            console.error('❌ OAuth error:', event.data.error);
            
            window.removeEventListener('message', messageListener);
            if (checkClosedInterval) {
              clearInterval(checkClosedInterval);
            }
            
            if (popup && !popup.closed) {
              popup.close();
            }
            
            resolve({ success: false, error: event.data.error || 'Authentication failed' });
          }
        }
      };

      window.addEventListener('message', messageListener);
      console.log('👂 Message listener added, waiting for popup response...');

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

  // Exchange authorization code for access tokens using Supabase edge function
  private async exchangeCodeForTokens(code: string): Promise<AuthResult> {
    try {
      console.log('🔄 Exchanging code for tokens using Supabase edge function...');
      
      const redirectUri = `${window.location.origin}/oauth/callback`;
      
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('google-auth', {
        body: {
          authCode: code,
          scope: this.config.scopes.join(' '),
          redirectUri: redirectUri
        }
      });

      if (error) {
        console.error('❌ Supabase function error:', error);
        throw new Error(`Token exchange failed: ${error.message}`);
      }

      if (!data.success) {
        console.error('❌ Token exchange failed:', data.error);
        throw new Error(data.error || 'Token exchange failed');
      }

      console.log('✅ Token exchange successful');
      
      this.storeTokens(data.accessToken, data.refreshToken);
      
      return {
        success: true,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      };
    } catch (error) {
      console.error('❌ Error exchanging code for tokens:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to exchange code for tokens'
      };
    }
  }
}
