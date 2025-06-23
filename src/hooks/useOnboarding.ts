import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useLocation } from 'react-router-dom';
import { VenueService } from '../services/venueService';

export interface OnboardingProgress {
  hasVenues: boolean;
  eventsReported: number;
  totalEventsRequired: number;
  isComplete: boolean;
}

// List of public routes where onboarding should not show
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/about', '/verification', '/add-event'];

export const useOnboarding = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [progress, setProgress] = useState<OnboardingProgress>({
    hasVenues: false,
    eventsReported: 0,
    totalEventsRequired: 3,
    isComplete: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [previousProgress, setPreviousProgress] = useState<OnboardingProgress | null>(null);

  // Check if current route is public
  const isPublicRoute = () => {
    return PUBLIC_ROUTES.includes(location.pathname);
  };

  // Check if user has seen onboarding before
  const hasSeenOnboarding = () => {
    return localStorage.getItem('musicdb-onboarding-seen') === 'true';
  };

  // Mark onboarding as seen
  const markOnboardingSeen = () => {
    localStorage.setItem('musicdb-onboarding-seen', 'true');
  };

  // Check if user has seen completion celebration
  const hasSeenCompletion = () => {
    return localStorage.getItem('musicdb-onboarding-complete-seen') === 'true';
  };

  // Mark completion as seen
  const markCompletionSeen = () => {
    localStorage.setItem('musicdb-onboarding-complete-seen', 'true');
  };

  // Check onboarding progress
  const checkProgress = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Check if user has venues
      const hasVenues = await VenueService.hasUserVenues(user.id);
      
      // Count user's reported events
      let eventsReported = 0;
      if (hasVenues) {
        const userVenues = await VenueService.getUserVenues(user.id);
        const venueEvents = await Promise.all(
          userVenues.map(venue => VenueService.getVenueEvents(venue.id))
        );
        eventsReported = venueEvents.reduce((total, events) => 
          total + events.upcoming.length + events.past.length, 0
        );
      }

      const isComplete = hasVenues && eventsReported >= 3;

      const newProgress = {
        hasVenues,
        eventsReported,
        totalEventsRequired: 3,
        isComplete
      };

      setProgress(newProgress);

      // Check if user just completed onboarding
      if (previousProgress && !previousProgress.isComplete && isComplete && !hasSeenCompletion()) {
        setShowCompletion(true);
      }

      // Show onboarding if:
      // 1. User is on a protected route (not public)
      // 2. User hasn't seen it before, OR
      // 3. User has seen it but hasn't completed the requirements
      const shouldShow = !isPublicRoute() && (!hasSeenOnboarding() || (!isComplete && hasSeenOnboarding()));
      setShowOnboarding(shouldShow);

      setPreviousProgress(newProgress);

    } catch (error) {
      console.error('Error checking onboarding progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check progress when user changes or location changes
  useEffect(() => {
    checkProgress();
  }, [user, location.pathname]);

  // Function to close onboarding
  const closeOnboarding = () => {
    setShowOnboarding(false);
    markOnboardingSeen();
  };

  // Function to close completion celebration
  const closeCompletion = () => {
    setShowCompletion(false);
    markCompletionSeen();
  };

  // Function to refresh progress (call after completing actions)
  const refreshProgress = () => {
    checkProgress();
  };

  return {
    showOnboarding,
    showCompletion,
    closeOnboarding,
    closeCompletion,
    progress,
    isLoading,
    refreshProgress
  };
}; 