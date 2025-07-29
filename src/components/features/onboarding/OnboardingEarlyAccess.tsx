import React, { useState, useEffect } from 'react';

interface OnboardingEarlyAccessProps {
  onValidCode: () => void;
  onError: (message: string) => void;
}

export default function OnboardingEarlyAccess({ onValidCode, onError }: OnboardingEarlyAccessProps) {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Auto-save key for localStorage
  const STORAGE_KEY = 'onboarding-early-access-draft';

  // Load saved data on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const { code: savedCode } = JSON.parse(savedData);
        if (savedCode) {
          console.log('Restoring early access code:', savedCode);
          setCode(savedCode);
        }
      }
    } catch (error) {
      console.warn('Failed to restore early access form data:', error);
    }
  }, []);

  // Auto-save code (save any changes)
  useEffect(() => {
    if (code.trim()) {
      console.log('Auto-saving early access code:', code);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ code }));
    }
  }, [code]);

  // Save on page unload and tab changes
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (code.trim()) {
        console.log('Page unloading - saving early access code');
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ code }));
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && code.trim()) {
        console.log('Tab hidden - saving early access code');
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ code }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [code]);

  // Clear saved data when successfully submitted
  const clearSavedData = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      onError('Please enter an access code');
      return;
    }

    setIsValidating(true);
    
    // Simulate validation delay
    setTimeout(() => {
      const normalizedCode = code.trim().toLowerCase();
      const validCode = 'freemusicdb';
      
      if (normalizedCode === validCode) {
        // Clear saved data on successful validation
        clearSavedData();
        onValidCode();
      } else {
        onError('Invalid access code. Please try again.');
      }
      
      setIsValidating(false);
    }, 500);
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="text-center">
        <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Early Access</h3>
        <p className="text-sm lg:text-base text-gray-600">Enter your early access code to continue</p>
      </div>
      
      <div className="max-w-xs sm:max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-4">
          <div>
            <label className="block text-xs lg:text-sm font-bold text-gray-700 mb-2">
              Access Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 lg:px-4 py-2 lg:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-base lg:text-lg font-mono"
              placeholder="Enter access code"
              disabled={isValidating}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isValidating || !code.trim()}
            className={`w-full py-2 lg:py-3 rounded-lg font-medium transition-all text-sm lg:text-base ${
              isValidating || !code.trim()
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {isValidating ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-3 w-3 lg:h-4 lg:w-4 border-b-2 border-white mr-2"></div>
                <span className="text-xs lg:text-sm">Validating...</span>
              </div>
            ) : (
              'Continue'
            )}
          </button>
        </form>
        
        <div className="mt-4 lg:mt-6 text-center">
          <p className="text-xs lg:text-sm text-gray-500">
            Don't have an access code? Contact us for early access.
          </p>
        </div>
      </div>
    </div>
  );
} 