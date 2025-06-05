
import { useEffect } from 'react';

const OAuthCallback = () => {
  useEffect(() => {
    console.log('OAuth callback page loaded');
    
    // Get the current URL and extract any parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    console.log('OAuth callback - code:', code, 'error:', error);
    
    // Send the result back to the parent window
    if (window.opener) {
      if (code) {
        window.opener.postMessage({
          type: 'OAUTH_SUCCESS',
          code: code
        }, window.location.origin);
      } else if (error) {
        window.opener.postMessage({
          type: 'OAUTH_ERROR',
          error: error
        }, window.location.origin);
      }
      window.close();
    } else {
      console.log('No opener window found, redirecting to main app');
      window.location.href = '/';
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing authentication...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
