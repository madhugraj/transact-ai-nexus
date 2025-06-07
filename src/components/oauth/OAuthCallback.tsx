
import { useEffect } from 'react';

const OAuthCallback = () => {
  useEffect(() => {
    console.log('OAuth callback page loaded');
    console.log('Current URL:', window.location.href);
    console.log('Current origin:', window.location.origin);
    console.log('Has opener:', !!window.opener);
    console.log('Opener origin:', window.opener ? window.opener.location.origin : 'No opener');
    
    // Get the current URL and extract any parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    console.log('OAuth callback - code:', code ? 'present' : 'missing', 'error:', error);
    console.log('Full search params:', window.location.search);
    
    // Send the result back to the parent window
    if (window.opener) {
      if (code) {
        console.log('Sending success message to parent window');
        const message = {
          type: 'OAUTH_SUCCESS',
          code: code
        };
        
        console.log('Message to send:', message);
        
        // Get the actual opener origin and send to that + wildcard as fallback
        const openerOrigin = window.opener.location.origin;
        console.log('Detected opener origin:', openerOrigin);
        
        try {
          console.log('Sending message to opener origin:', openerOrigin);
          window.opener.postMessage(message, openerOrigin);
        } catch (e) {
          console.log('Failed to send to opener origin, trying wildcard:', e);
          try {
            window.opener.postMessage(message, '*');
          } catch (e2) {
            console.log('Failed to send message with wildcard:', e2);
          }
        }
        
        // Wait a bit before closing to ensure message is received
        setTimeout(() => {
          console.log('Attempting to close popup window');
          window.close();
        }, 1000);
      } else if (error) {
        console.log('Sending error message to parent window');
        const message = {
          type: 'OAUTH_ERROR',
          error: error
        };
        
        console.log('Error message to send:', message);
        
        // Get the actual opener origin and send to that + wildcard as fallback
        const openerOrigin = window.opener.location.origin;
        console.log('Detected opener origin for error:', openerOrigin);
        
        try {
          console.log('Sending error message to opener origin:', openerOrigin);
          window.opener.postMessage(message, openerOrigin);
        } catch (e) {
          console.log('Failed to send error to opener origin, trying wildcard:', e);
          try {
            window.opener.postMessage(message, '*');
          } catch (e2) {
            console.log('Failed to send error message with wildcard:', e2);
          }
        }
        
        setTimeout(() => {
          console.log('Attempting to close popup window (error case)');
          window.close();
        }, 1000);
      } else {
        console.log('No code or error found in URL parameters');
        console.log('Will attempt to close popup after delay');
        setTimeout(() => {
          console.log('Closing popup - no auth data found');
          window.close();
        }, 2000);
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
        <p className="text-xs text-gray-400 mt-4">
          If this page doesn't close automatically, please close it manually.
        </p>
        <div className="mt-4 text-xs text-gray-400">
          <p>Debug info (check console for details):</p>
          <p>URL: {window.location.href}</p>
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;
