
import { useEffect } from 'react';

const OAuthCallback = () => {
  useEffect(() => {
    console.log('OAuth callback page loaded');
    console.log('Current URL:', window.location.href);
    
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const state = urlParams.get('state');
    
    console.log('OAuth params:', { code, error, state });
    
    if (error) {
      console.error('OAuth error:', error);
      // Send error to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'OAUTH_ERROR',
          error: error
        }, window.location.origin);
      }
      window.close();
      return;
    }
    
    if (code) {
      console.log('OAuth success, sending code to parent');
      // Send success message to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'OAUTH_SUCCESS',
          code: code,
          state: state
        }, window.location.origin);
      }
      window.close();
    } else {
      console.error('No authorization code received');
      if (window.opener) {
        window.opener.postMessage({
          type: 'OAUTH_ERROR',
          error: 'No authorization code received'
        }, window.location.origin);
      }
      window.close();
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Processing authentication...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
