
import { useEffect } from 'react';

const OAuthCallback = () => {
  useEffect(() => {
    console.log('OAuth callback page loaded');
    console.log('Current URL:', window.location.href);
    console.log('Current origin:', window.location.origin);
    
    // Get the current URL and extract any parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    console.log('OAuth callback - code:', code ? 'present' : 'missing', 'error:', error);
    
    // Send the result back to the parent window
    if (window.opener) {
      if (code) {
        console.log('Sending success message to parent window');
        const message = {
          type: 'OAUTH_SUCCESS',
          code: code
        };
        
        // Send to parent window (any origin since we're in a popup)
        try {
          window.opener.postMessage(message, '*');
        } catch (e) {
          console.log('Failed to send message to parent window:', e);
        }
        
        // Wait a bit before closing to ensure message is received
        setTimeout(() => {
          window.close();
        }, 500);
      } else if (error) {
        console.log('Sending error message to parent window');
        const message = {
          type: 'OAUTH_ERROR',
          error: error
        };
        
        // Send to parent window (any origin since we're in a popup)
        try {
          window.opener.postMessage(message, '*');
        } catch (e) {
          console.log('Failed to send error message to parent window:', e);
        }
        
        setTimeout(() => {
          window.close();
        }, 500);
      } else {
        console.log('No code or error found, closing popup');
        setTimeout(() => {
          window.close();
        }, 1000);
      }
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
        <p className="text-sm text-gray-500 mt-2">This window will close automatically...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
