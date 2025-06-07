
import { useEffect } from 'react';

const OAuthCallback = () => {
  useEffect(() => {
    console.log('OAuth callback page loaded');
    console.log('Current URL:', window.location.href);
    console.log('Current origin:', window.location.origin);
    console.log('Has opener:', !!window.opener);
    console.log('Opener closed:', window.opener ? window.opener.closed : 'no opener');
    
    // Get the current URL and extract any parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const state = urlParams.get('state');
    
    console.log('OAuth params:', { code: code ? 'present' : 'missing', error, state });
    console.log('URL search params:', window.location.search);
    console.log('Full URL for debugging:', window.location.href);
    
    // Send the result back to the parent window
    if (window.opener && !window.opener.closed) {
      console.log('Opener window found and not closed, preparing to send message...');
      
      // Get the opener's origin to send messages to the correct target
      let targetOrigin = '*';
      try {
        if (window.opener.location && window.opener.location.origin) {
          targetOrigin = window.opener.location.origin;
          console.log('Using opener origin as target:', targetOrigin);
        }
      } catch (e) {
        console.log('Could not access opener origin, using wildcard');
      }
      
      if (code) {
        console.log('OAuth success, sending code to parent');
        const message = {
          type: 'OAUTH_SUCCESS',
          code: code,
          timestamp: Date.now(),
          source: 'oauth-callback'
        };
        
        console.log('Message to send:', message);
        console.log('Target origin:', targetOrigin);
        
        // Send message multiple times to ensure delivery
        const sendMessage = () => {
          try {
            window.opener.postMessage(message, targetOrigin);
            console.log('✅ Successfully sent success message to opener');
          } catch (error) {
            console.error('❌ Failed to send message:', error);
            // Fallback to wildcard if specific origin fails
            try {
              window.opener.postMessage(message, '*');
              console.log('✅ Fallback: sent message with wildcard origin');
            } catch (fallbackError) {
              console.error('❌ Fallback also failed:', fallbackError);
            }
          }
        };
        
        // Send immediately
        sendMessage();
        
        // Send again after small delays
        setTimeout(sendMessage, 100);
        setTimeout(sendMessage, 500);
        setTimeout(sendMessage, 1000);
        
        // Wait longer before closing to ensure message is received
        setTimeout(() => {
          console.log('Attempting to close popup window after success');
          try {
            window.close();
          } catch (e) {
            console.log('Could not close window automatically:', e);
          }
        }, 3000);
      } else if (error) {
        console.log('OAuth error detected:', error);
        const message = {
          type: 'OAUTH_ERROR',
          error: error,
          timestamp: Date.now(),
          source: 'oauth-callback'
        };
        
        console.log('Error message to send:', message);
        
        const sendErrorMessage = () => {
          try {
            window.opener.postMessage(message, targetOrigin);
            console.log('✅ Successfully sent error message to opener');
          } catch (error) {
            console.error('❌ Failed to send error message:', error);
            // Fallback to wildcard
            try {
              window.opener.postMessage(message, '*');
              console.log('✅ Fallback: sent error message with wildcard origin');
            } catch (fallbackError) {
              console.error('❌ Fallback error message also failed:', fallbackError);
            }
          }
        };
        
        // Send error message multiple times
        sendErrorMessage();
        setTimeout(sendErrorMessage, 100);
        setTimeout(sendErrorMessage, 500);
        setTimeout(sendErrorMessage, 1000);
        
        setTimeout(() => {
          console.log('Attempting to close popup window after error');
          try {
            window.close();
          } catch (e) {
            console.log('Could not close window automatically:', e);
          }
        }, 3000);
      } else {
        console.log('No code or error found in URL parameters');
        
        const message = {
          type: 'OAUTH_ERROR',
          error: 'No authorization code or error received',
          timestamp: Date.now(),
          source: 'oauth-callback'
        };
        
        try {
          window.opener.postMessage(message, targetOrigin);
          console.log('Sent no-data message to opener');
        } catch (e) {
          console.error('Failed to send no-data message:', e);
          try {
            window.opener.postMessage(message, '*');
            console.log('Fallback: sent no-data message with wildcard');
          } catch (fallbackError) {
            console.error('Fallback no-data message also failed:', fallbackError);
          }
        }
        
        setTimeout(() => {
          console.log('Closing popup - no auth data found');
          try {
            window.close();
          } catch (e) {
            console.log('Could not close window automatically:', e);
          }
        }, 4000);
      }
    } else {
      console.log('No opener window found or opener is closed');
      console.log('Redirecting to main app...');
      // If no opener, redirect to the main app
      window.location.href = '/';
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-6"></div>
        <h2 className="text-xl font-semibold mb-4">Processing Authentication...</h2>
        <p className="text-gray-600 mb-4">Please wait while we complete your Google Drive connection.</p>
        <p className="text-sm text-gray-500 mb-6">This window will close automatically when finished.</p>
        
        <div className="mt-6 p-4 bg-gray-50 rounded text-left text-xs text-gray-600">
          <p className="font-medium mb-2">Debug Information:</p>
          <p>URL: {window.location.href}</p>
          <p>Origin: {window.location.origin}</p>
          <p>Has opener: {window.opener ? 'Yes' : 'No'}</p>
          <p>Opener closed: {window.opener ? (window.opener.closed ? 'Yes' : 'No') : 'N/A'}</p>
        </div>
        
        <p className="text-xs text-gray-400 mt-4">
          If this page doesn't close automatically after 30 seconds, please close it manually and try again.
        </p>
      </div>
    </div>
  );
};

export default OAuthCallback;
