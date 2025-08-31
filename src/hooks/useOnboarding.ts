import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useLocation } from 'react-router-dom';
import { 
  useCheckUserHasVenuesQuery,
  useGetUserVenuesQuery,
  useGetVenueEventsQuery 
} from '../store/api/venuesApi';

export interface OnboardingProgress {
  hasVenues: boolean;
  eventsReported: number;
  totalEventsRequired: number;
  isComplete: boolean;
}

// List of public routes where onboarding should not show
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/about', '/verification', '/add-event', '/add-venue'];

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
  const [previousProgress, setPreviousProgress] = useState<OnboardingProgress | null>(null);

  // RTK Query hooks for onboarding checks
  const { data: hasVenuesData, isLoading: hasVenuesLoading } = useCheckUserHasVenuesQuery(user?.id || '', {
    skip: !user?.id,
  });
  const { data: userVenues = [], isLoading: venuesLoading } = useGetUserVenuesQuery(user?.id || '', {
    skip: !user?.id || !hasVenuesData,
  });
  
  // Pre-define hooks for up to 5 venues to prevent hook order violations
  const venue1EventsQuery = useGetVenueEventsQuery(
    userVenues[0]?.id || '', 
    { skip: !userVenues[0]?.id }
  );
  const venue2EventsQuery = useGetVenueEventsQuery(
    userVenues[1]?.id || '', 
    { skip: !userVenues[1]?.id }
  );
  const venue3EventsQuery = useGetVenueEventsQuery(
    userVenues[2]?.id || '', 
    { skip: !userVenues[2]?.id }
  );
  const venue4EventsQuery = useGetVenueEventsQuery(
    userVenues[3]?.id || '', 
    { skip: !userVenues[3]?.id }
  );
  const venue5EventsQuery = useGetVenueEventsQuery(
    userVenues[4]?.id || '', 
    { skip: !userVenues[4]?.id }
  );

  // Create array of active venue event queries
  const venueEventQueries = useMemo(() => {
    const queries = [venue1EventsQuery, venue2EventsQuery, venue3EventsQuery, venue4EventsQuery, venue5EventsQuery];
    return queries.slice(0, userVenues.length); // Only return queries for actual venues
  }, [venue1EventsQuery, venue2EventsQuery, venue3EventsQuery, venue4EventsQuery, venue5EventsQuery, userVenues.length]);

  // Determine if we're still loading any data
  const isLoading = hasVenuesLoading || venuesLoading || venueEventQueries.some(query => query.isLoading);

  // Stable calculation of total events count
  const totalEventsCount = useMemo(() => {
    let count = 0;
    venueEventQueries.forEach((query) => {
      if (query.data) {
        count += query.data.upcoming.length + query.data.past.length;
      }
    });
    return count;
  }, [venueEventQueries.map(q => q.data ? `${q.data.upcoming.length}-${q.data.past.length}` : 'loading').join(',')]);

  // Check if current route is public
  const isPublicRoute = useCallback(() => {
    return PUBLIC_ROUTES.includes(location.pathname);
  }, [location.pathname]);

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

  // Check onboarding progress using RTK Query data
  const checkProgress = useCallback(() => {
    if (!user || isLoading) {
      return;
    }

    // Use RTK Query data instead of direct service calls
    const hasVenues = hasVenuesData || false;
    
    // Use stable events count
    const eventsReported = totalEventsCount;

    const isComplete = hasVenues && eventsReported >= 3;

    const newProgress = {
      hasVenues,
      eventsReported,
      totalEventsRequired: 3,
      isComplete
    };

    // Only update progress if it actually changed (deep comparison for objects)
    const progressChanged = !previousProgress || 
      previousProgress.hasVenues !== newProgress.hasVenues ||
      previousProgress.eventsReported !== newProgress.eventsReported ||
      previousProgress.isComplete !== newProgress.isComplete;

    if (progressChanged) {
      setProgress(newProgress);
      setPreviousProgress(newProgress);

      // Check if user just completed onboarding
      if (previousProgress && !previousProgress.isComplete && isComplete && !hasSeenCompletion()) {
        setShowCompletion(true);
      }

      // Show onboarding if:
      // 1. User is on a protected route (not public)
      // 2. User hasn't seen it before, OR
      // 3. User has seen it but hasn't completed the requirements AND hasn't seen completion
      const shouldShow = !isPublicRoute() && (
        !hasSeenOnboarding() || 
        (!isComplete && hasSeenOnboarding() && !hasSeenCompletion())
      );
      setShowOnboarding(shouldShow);
    }
  }, [user, isLoading, hasVenuesData, totalEventsCount, isPublicRoute]);

  // Check progress when user changes or location changes
  useEffect(() => {
    checkProgress();
  }, [checkProgress, location.pathname]);

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
  // Note: With RTK Query, cache invalidation should handle most updates automatically
  const refreshProgress = useCallback(() => {
    // Force re-check progress with current data
    checkProgress();
  }, [checkProgress]);

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