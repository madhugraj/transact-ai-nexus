
import { useEffect } from 'react';

const OAuthCallback = () => {
  useEffect(() => {
    console.log('OAuth callback page loaded');
    console.log('Current URL:', window.location.href);
    console.log('Current origin:', window.location.origin);
    console.log('Has opener:', !!window.opener);
    
    // Get the current URL and extract any parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const state = urlParams.get('state');
    
    console.log('OAuth params:', { code: code ? 'present' : 'missing', error, state });
    console.log('URL search params:', window.location.search);
    
    // Send the result back to the parent window
    if (window.opener && !window.opener.closed) {
      console.log('Opener window found, sending message...');
      
      if (code) {
        console.log('OAuth success, sending code to parent');
        const message = {
          type: 'OAUTH_SUCCESS',
          code: code,
          timestamp: Date.now()
        };
        
        console.log('Message to send:', message);
        
        // Send message with the specific origin that opened this popup
        try {
          // Try to send to the specific opener origin first
          const openerOrigin = window.opener.location.origin;
          window.opener.postMessage(message, openerOrigin);
          console.log('Successfully sent message to opener with origin:', openerOrigin);
        } catch (e) {
          console.log('Failed to send to specific origin, trying wildcard:', e);
          // Fallback to wildcard for cross-origin popup communication
          try {
            window.opener.postMessage(message, '*');
            console.log('Successfully sent message to opener with wildcard origin');
          } catch (fallbackError) {
            console.error('Failed to send message with wildcard:', fallbackError);
          }
        }
        
        // Wait a bit longer before closing to ensure message is received
        setTimeout(() => {
          console.log('Attempting to close popup window');
          try {
            window.close();
          } catch (e) {
            console.log('Could not close window automatically:', e);
          }
        }, 2000); // Increased timeout
      } else if (error) {
        console.log('OAuth error, sending error to parent');
        const message = {
          type: 'OAUTH_ERROR',
          error: error,
          timestamp: Date.now()
        };
        
        console.log('Error message to send:', message);
        
        try {
          const openerOrigin = window.opener.location.origin;
          window.opener.postMessage(message, openerOrigin);
          console.log('Successfully sent error message to opener');
        } catch (e) {
          console.log('Failed to send to specific origin, trying wildcard:', e);
          try {
            window.opener.postMessage(message, '*');
            console.log('Successfully sent error message with wildcard');
          } catch (fallbackError) {
            console.error('Failed to send error message:', fallbackError);
          }
        }
        
        setTimeout(() => {
          console.log('Attempting to close popup window (error case)');
          try {
            window.close();
          } catch (e) {
            console.log('Could not close window automatically:', e);
          }
        }, 2000);
      } else {
        console.log('No code or error found in URL parameters');
        console.log('Will attempt to close popup after delay');
        setTimeout(() => {
          console.log('Closing popup - no auth data found');
          try {
            window.close();
          } catch (e) {
            console.log('Could not close window automatically:', e);
          }
        }, 3000); // Longer delay for manual inspection
      }
    } else {
      console.log('No opener window found or opener is closed, redirecting to main app');
      // If no opener, redirect to the main app
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
          <p>Origin: {window.location.origin}</p>
          <p>Has opener: {window.opener ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;
