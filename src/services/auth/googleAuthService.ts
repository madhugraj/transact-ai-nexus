
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

  // Create auth URL for popup with EXACT redirect URI
  createAuthUrl(): string {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    
    // Use the EXACT redirect URI that's configured in Google Cloud Console
    const exactRedirectUri = 'https://79d72649-d878-4ff4-9672-26026a4d9011.lovableproject.com/oauth/callback';
    
    console.log('Auth URL Debug Info:');
    console.log('- Client ID:', this.config.clientId);
    console.log('- EXACT Redirect URI:', exactRedirectUri);
    console.log('- Scopes:', this.config.scopes);
    
    authUrl.searchParams.set('client_id', this.config.clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', this.config.scopes.join(' '));
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('redirect_uri', exactRedirectUri);
    
    const finalUrl = authUrl.toString();
    console.log('Final Auth URL:', finalUrl);
    
    return finalUrl;
  }

  // Popup-based authentication
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

      let messageReceived = false;

      // Listen for messages from the popup
      const messageListener = (event: MessageEvent) => {
        // Accept messages from our OAuth callback page - be more permissive with origins
        const allowedOrigins = [
          window.location.origin,
          'https://transact-ai-nexus.lovable.app',
          'https://preview--transact-ai-nexus.lovable.app',
          'https://79d72649-d878-4ff4-9672-26026a4d9011.lovableproject.com'
        ];
        
        if (!allowedOrigins.includes(event.origin)) {
          console.log('Message from unexpected origin:', event.origin);
          return;
        }

        console.log('Received message from popup:', event);
        
        if (event.data && event.data.type === 'OAUTH_SUCCESS') {
          messageReceived = true;
          window.removeEventListener('message', messageListener);
          
          // Don't close popup immediately, let the callback handle it
          setTimeout(() => {
            if (!popup.closed) {
              popup.close();
            }
          }, 100);
          
          if (event.data.code) {
            console.log('OAuth success received, code:', event.data.code);
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
          
          console.error('OAuth error received:', event.data.error);
          resolve({ success: false, error: event.data.error || 'Authentication failed' });
        }
      };

      window.addEventListener('message', messageListener);

      // Check if popup was closed manually - but wait longer and check for messages first
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          console.log('Popup was closed');
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          
          // Only treat as cancelled if no message was received
          if (!messageReceived) {
            console.log('Popup closed without receiving auth message');
            resolve({ success: false, error: 'Authentication was cancelled' });
          }
        }
      }, 2000); // Check every 2 seconds instead of 1 second to give more time for messages
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
          redirectUri: this.config.redirectUri
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
