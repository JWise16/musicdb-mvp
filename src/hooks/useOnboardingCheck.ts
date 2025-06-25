import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';

export const useOnboardingCheck = () => {
  const { user } = useAuth();
  const { profile, loading } = useUserProfile();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!user) {
      setNeedsOnboarding(false);
      setShowOnboarding(false);
      return;
    }

    if (loading) {
      return; // Still loading profile
    }

    // Check if user needs onboarding (missing essential profile info)
    const hasEssentialInfo = profile?.full_name && profile?.role;
    const needsSetup = !hasEssentialInfo;

    setNeedsOnboarding(needsSetup);
    
    // Auto-show onboarding if needed
    if (needsSetup) {
      setShowOnboarding(true);
    }
  }, [user, profile, loading]);

  const completeOnboarding = () => {
    setShowOnboarding(false);
    setNeedsOnboarding(false);
  };

  return {
    needsOnboarding,
    showOnboarding,
    setShowOnboarding,
    completeOnboarding,
    profile
  };
}; 