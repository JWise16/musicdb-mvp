import { useState, useEffect } from 'react';
import { clarityService } from '../../services/clarityService';

interface PrivacyBannerProps {
  onConsentGiven?: () => void;
  onConsentDenied?: () => void;
}

interface AnalyticsPreferences {
  essential: boolean;
  analytics: boolean;
  performance: boolean;
  userExperience: boolean;
}

const PrivacyBanner = ({ onConsentGiven, onConsentDenied }: PrivacyBannerProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<AnalyticsPreferences>({
    essential: true, // Always required
    analytics: true,
    performance: true,
    userExperience: true,
  });

  useEffect(() => {
    // Check if user has already given consent
    const hasConsent = localStorage.getItem('musicdb-analytics-consent');
    const savedPreferences = localStorage.getItem('musicdb-analytics-preferences');
    
    if (savedPreferences) {
      try {
        const parsedPreferences = JSON.parse(savedPreferences);
        setPreferences(parsedPreferences);
      } catch (error) {
        console.warn('Failed to parse saved preferences:', error);
      }
    }
    
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

  const handleAcceptAll = () => {
    const allAcceptedPreferences = {
      essential: true,
      analytics: true,
      performance: true,
      userExperience: true,
    };
    savePreferences(allAcceptedPreferences);
    closeWithAnimation();
    onConsentGiven?.();
  };

  const handleManagePreferences = () => {
    setShowPreferences(true);
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
    closeWithAnimation();
    
    // Determine if any analytics are enabled
    const hasAnyAnalytics = preferences.analytics || preferences.performance || preferences.userExperience;
    if (hasAnyAnalytics) {
      onConsentGiven?.();
    } else {
      onConsentDenied?.();
    }
  };

  const savePreferences = (prefs: AnalyticsPreferences) => {
    localStorage.setItem('musicdb-analytics-preferences', JSON.stringify(prefs));
    
    // For Clarity service, enable if any analytics options are selected
    const hasAnyAnalytics = prefs.analytics || prefs.performance || prefs.userExperience;
    localStorage.setItem('musicdb-analytics-consent', hasAnyAnalytics.toString());
    clarityService.setConsent(hasAnyAnalytics);
  };

  const handlePreferenceChange = (key: keyof AnalyticsPreferences, value: boolean) => {
    if (key === 'essential') return; // Essential cookies cannot be disabled
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const closeWithAnimation = () => {
    setIsClosing(true);
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  const preferenceItems = [
    {
      key: 'essential' as keyof AnalyticsPreferences,
      title: 'Essential Cookies',
      description: 'Required for basic website functionality and security.',
      required: true
    },
    {
      key: 'analytics' as keyof AnalyticsPreferences,
      title: 'Analytics Cookies',
      description: 'Help us understand how you use the site to improve performance.',
      required: false
    },
    {
      key: 'performance' as keyof AnalyticsPreferences,
      title: 'Performance Cookies',
      description: 'Collect information about site performance and user experience.',
      required: false
    },
    {
      key: 'userExperience' as keyof AnalyticsPreferences,
      title: 'User Experience Cookies',
      description: 'Remember your preferences and settings for a better experience.',
      required: false
    }
  ];

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg transition-transform duration-300 ${
        isClosing ? 'transform translate-y-full' : 'transform translate-y-0'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {!showPreferences ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Privacy Notice:</span> We use analytics to improve your experience. 
                We collect anonymized usage data to understand how you interact with MusicDB and make improvements.
              </p>
            </div>
            
            <div className="flex gap-3 shrink-0">
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-md transition-colors"
              >
                OK, Got it
              </button>
              <button
                onClick={handleManagePreferences}
                className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 underline transition-colors"
              >
                Manage Preferences
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Manage Your Privacy Preferences</h3>
              <button
                onClick={() => setShowPreferences(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-sm text-gray-600">
              Choose which types of cookies and tracking you're comfortable with. You can change these settings at any time.
            </p>
            
            <div className="space-y-3">
              {preferenceItems.map((item) => (
                <div key={item.key} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center mt-1">
                    <input
                      type="checkbox"
                      id={item.key}
                      checked={preferences[item.key]}
                      onChange={(e) => handlePreferenceChange(item.key, e.target.checked)}
                      disabled={item.required}
                      className="w-4 h-4 text-black bg-gray-100 border-gray-300 rounded focus:ring-black focus:ring-2 disabled:opacity-50"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor={item.key} className="text-sm font-medium text-gray-900 cursor-pointer">
                      {item.title}
                      {item.required && <span className="text-gray-500 ml-1">(Required)</span>}
                    </label>
                    <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSavePreferences}
                className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-md transition-colors"
              >
                Save Preferences
              </button>
              <button
                onClick={() => {
                  setPreferences({
                    essential: true,
                    analytics: false,
                    performance: false,
                    userExperience: false,
                  });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Reject All Optional
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivacyBanner;
