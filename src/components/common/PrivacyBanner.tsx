import { useState, useEffect } from 'react';
import { clarityService } from '../../services/clarityService';

interface PrivacyBannerProps {
  onConsentGiven?: () => void;
  onConsentDenied?: () => void;
}

const PrivacyBanner = ({ onConsentGiven, onConsentDenied }: PrivacyBannerProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const hasConsent = localStorage.getItem('musicdb-analytics-consent');
    
    if (!hasConsent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      // Apply existing consent
      const consentValue = hasConsent === 'true';
      clarityService.setConsent(consentValue);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('musicdb-analytics-consent', 'true');
    clarityService.setConsent(true);
    closeWithAnimation();
    onConsentGiven?.();
  };

  const handleDecline = () => {
    localStorage.setItem('musicdb-analytics-consent', 'false');
    clarityService.setConsent(false);
    closeWithAnimation();
    onConsentDenied?.();
  };

  const closeWithAnimation = () => {
    setIsClosing(true);
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg transition-transform duration-300 ${
        isClosing ? 'transform translate-y-full' : 'transform translate-y-0'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Privacy Notice:</span> We use analytics to improve your experience. 
              We collect anonymized usage data to understand how you interact with MusicDB and make improvements. 
              <button 
                className="text-black underline hover:no-underline ml-1"
                onClick={() => {
                  // You can add a link to your privacy policy here
                  window.open('/privacy-policy', '_blank');
                }}
              >
                Learn more
              </button>
            </p>
          </div>
          
          <div className="flex gap-3 shrink-0">
            <button
              onClick={handleDecline}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-md transition-colors"
            >
              Accept Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyBanner;
