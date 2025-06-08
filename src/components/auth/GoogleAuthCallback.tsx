
import { useEffect } from 'react';

const GoogleAuthCallback = () => {
  useEffect(() => {
    // Check if we're in a popup window and have auth data in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    // Check for access token in hash (implicit flow)
    const accessToken = hashParams.get('access_token');
    const error = urlParams.get('error') || hashParams.get('error');
    
    if (window.opener && window.opener !== window) {
      console.log('📤 Posting message to parent window');
      
      if (accessToken) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH',
          success: true,
          accessToken: accessToken,
          refreshToken: hashParams.get('refresh_token')
        }, '*');
      } else if (error) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH',
          success: false,
          error: error
        }, '*');
      } else {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH',
          success: false,
          error: 'No authentication data received'
        }, '*');
      }
      
      // Close the popup
      window.close();
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">Completing Authentication...</h2>
        <p className="text-muted-foreground">This window should close automatically.</p>
      </div>
    </div>
  );
};

export default GoogleAuthCallback;
