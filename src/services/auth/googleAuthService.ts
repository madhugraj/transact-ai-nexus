
interface GoogleAuthConfig {
  clientId: string;
  scopes: string[];
  redirectUri: string;
}

interface AuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
}

interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  timestamp: number;
}

export class GoogleAuthService {
  private config: GoogleAuthConfig;
  private storageKey: string;

  constructor(config: GoogleAuthConfig, storageKey: string = 'google_auth_tokens') {
    this.config = config;
    this.storageKey = storageKey;
  }

  async authenticateWithPopup(): Promise<AuthResult> {
    try {
      console.log('🔗 Starting Google authentication...');
      
      // Build the auth URL with proper parameters
      const authUrl = this.buildAuthUrl();
      console.log('🔗 Auth URL:', authUrl);
      
      const result = await this.openPopupAndWaitForResult(authUrl);
      
      if (result.success && result.code) {
        // Exchange code for tokens
        const tokenResult = await this.exchangeCodeForTokens(result.code);
        
        if (tokenResult.success) {
          this.storeTokens({
            accessToken: tokenResult.accessToken!,
            refreshToken: tokenResult.refreshToken,
            expiresAt: Date.now() + (tokenResult.expiresIn! * 1000),
            timestamp: Date.now()
          });
        }
        
        return tokenResult;
      } else {
        return { success: false, error: result.error || 'Authentication failed' };
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Authentication failed' };
    }
  }

  private buildAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true'
    });
    
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  private async openPopupAndWaitForResult(authUrl: string): Promise<{ success: boolean; code?: string; error?: string }> {
    return new Promise((resolve) => {
      const popup = window.open(
        authUrl,
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        resolve({ success: false, error: 'Failed to open popup. Please allow popups and try again.' });
        return;
      }

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          resolve({ success: false, error: 'Authentication was cancelled' });
        }
      }, 1000);

      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data?.type === 'OAUTH_SUCCESS' && event.data?.code) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup.close();
          resolve({ success: true, code: event.data.code });
        } else if (event.data?.type === 'OAUTH_ERROR') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup.close();
          resolve({ success: false, error: event.data.error });
        }
      };

      window.addEventListener('message', messageListener);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
        if (!popup.closed) {
          popup.close();
        }
        resolve({ success: false, error: 'Authentication timeout' });
      }, 300000);
    });
  }

  private async exchangeCodeForTokens(code: string): Promise<AuthResult> {
    try {
      console.log('🔄 Exchanging code for tokens...');
      
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: '', // This should be handled by backend in production
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Token exchange failed:', error);
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Token exchange successful');

      return {
        success: true,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      console.error('❌ Token exchange error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token exchange failed'
      };
    }
  }

  hasValidTokens(): boolean {
    const tokens = this.getStoredTokens();
    if (!tokens) return false;
    
    // Check if token is expired (with 5 minute buffer)
    const isExpired = Date.now() >= (tokens.expiresAt - 5 * 60 * 1000);
    return !isExpired;
  }

  getStoredTokens(): StoredTokens | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;
      
      const tokens = JSON.parse(stored);
      return tokens;
    } catch (error) {
      console.error('❌ Error reading stored tokens:', error);
      return null;
    }
  }

  private storeTokens(tokens: StoredTokens): void {
    localStorage.setItem(this.storageKey, JSON.stringify(tokens));
    console.log('✅ Tokens stored successfully');
  }

  clearTokens(): void {
    localStorage.removeItem(this.storageKey);
    console.log('🗑️ Tokens cleared');
  }
}
