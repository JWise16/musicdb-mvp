/**
 * Clarity Debug Utility
 * Add this to help diagnose Clarity integration issues
 */

export const debugClarity = () => {
  console.log('=== CLARITY DEBUG INFO ===');
  
  // Check if Clarity is loaded
  console.log('1. Clarity object available:', typeof (window as any).clarity !== 'undefined');
  
  // Check environment variables
  console.log('2. Environment variables:');
  console.log('   - PROJECT_ID:', import.meta.env.VITE_CLARITY_PROJECT_ID);
  console.log('   - ENABLED:', import.meta.env.VITE_CLARITY_ENABLED);
  console.log('   - DEBUG:', import.meta.env.VITE_CLARITY_DEBUG);
  console.log('   - NODE_ENV:', import.meta.env.NODE_ENV);
  console.log('   - PROD:', import.meta.env.PROD);
  
  // Check consent status
  const consent = localStorage.getItem('musicdb-analytics-consent');
  console.log('3. Consent status:', consent);
  
  // Check if Clarity script is in DOM
  const clarityScripts = document.querySelectorAll('script[src*="clarity"]');
  console.log('4. Clarity scripts found:', clarityScripts.length);
  
  // Check for Clarity cookies
  const cookies = document.cookie.split(';').filter(cookie => 
    cookie.toLowerCase().includes('clarity') || 
    cookie.toLowerCase().includes('_clck') || 
    cookie.toLowerCase().includes('_clsk')
  );
  console.log('5. Clarity cookies:', cookies);
  
  // Check network requests (if available)
  if ('performance' in window && 'getEntriesByType' in performance) {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const clarityRequests = resources.filter(resource => 
      resource.name.includes('clarity') || 
      resource.name.includes('claritybt') ||
      resource.name.includes('freshpaint')
    );
    console.log('6. Clarity network requests:', clarityRequests.length, clarityRequests);
  }
  
  // Try to get Clarity version/status
  try {
    const clarityGlobal = (window as any).clarity;
    if (clarityGlobal) {
      console.log('7. Clarity global object:', clarityGlobal);
      console.log('8. Clarity methods available:', Object.keys(clarityGlobal));
    }
  } catch (error) {
    console.log('7. Error accessing Clarity global:', error);
  }
  
  console.log('=== END CLARITY DEBUG ===');
};

// Auto-run in development
if (import.meta.env.DEV) {
  setTimeout(debugClarity, 2000); // Run after 2 seconds to allow Clarity to load
}

export default debugClarity;
