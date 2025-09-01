
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useVenue } from '../../contexts/VenueContext';
import { 
  useGetUserVenuesQuery,
  useCheckUserHasVenuesQuery,
  useGetVenueEventsQuery 
} from '../../store/api/venuesApi';

import OnboardingWizard from '../../components/features/onboarding/OnboardingWizard';
import Confetti from 'react-confetti';
import logo from '../../assets/logo.png';

type OnboardingStep = 'welcome' | 'profile' | 'venue' | 'early-access' | 'events' | 'complete';

interface OnboardingProgress {
  hasProfile: boolean;
  hasVenue: boolean;
  eventsCount: number;
  currentStep: OnboardingStep;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, refetch: refetchProfile } = useUserProfile();
  const { refreshVenues } = useVenue();

  // Immediate redirect for users who have already completed onboarding
  useEffect(() => {
    const onboardingCompleted = localStorage.getItem('musicdb-onboarding-completed') === 'true';
    if (onboardingCompleted) {
      console.log('Onboarding: User has already completed onboarding, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [navigate]);

  // Only fetch venue-related data if user has completed profile
  const hasProfile = !!(profile?.full_name && profile?.role);
  
  // RTK Query hooks for onboarding checks - only when needed
  const { data: hasVenuesData } = useCheckUserHasVenuesQuery(user?.id || '', {
    skip: !user?.id || !hasProfile, // Skip if no profile yet
  });
  const { data: userVenues = [] } = useGetUserVenuesQuery(user?.id || '', {
    skip: !user?.id || !hasProfile || !hasVenuesData, // Skip if no profile yet
  });
  
  // Pre-define hooks for up to 5 venues (should be more than enough for most users)
  // This prevents hook order violations while still supporting multiple venues
  const venue1EventsQuery = useGetVenueEventsQuery(
    userVenues[0]?.id || '', 
    { skip: !userVenues[0]?.id || !hasProfile }
  );
  const venue2EventsQuery = useGetVenueEventsQuery(
    userVenues[1]?.id || '', 
    { skip: !userVenues[1]?.id || !hasProfile }
  );
  const venue3EventsQuery = useGetVenueEventsQuery(
    userVenues[2]?.id || '', 
    { skip: !userVenues[2]?.id || !hasProfile }
  );
  const venue4EventsQuery = useGetVenueEventsQuery(
    userVenues[3]?.id || '', 
    { skip: !userVenues[3]?.id || !hasProfile }
  );
  const venue5EventsQuery = useGetVenueEventsQuery(
    userVenues[4]?.id || '', 
    { skip: !userVenues[4]?.id || !hasProfile }
  );

  // Create array of active venue event queries
  const venueEventQueries = useMemo(() => {
    const queries = [venue1EventsQuery, venue2EventsQuery, venue3EventsQuery, venue4EventsQuery, venue5EventsQuery];
    return queries.slice(0, userVenues.length); // Only return queries for actual venues
  }, [venue1EventsQuery, venue2EventsQuery, venue3EventsQuery, venue4EventsQuery, venue5EventsQuery, userVenues.length]);

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
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState<OnboardingProgress>({
    hasProfile: false,
    hasVenue: false,
    eventsCount: 0,
    currentStep: 'welcome'
  });
  const previousProgressRef = useRef<OnboardingProgress>(progress);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<'profile' | 'venue' | 'early-access' | 'events'>('profile');
  const [currentEventNumber, setCurrentEventNumber] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 0, 
    height: typeof window !== 'undefined' ? window.innerHeight : 0 
  });

  // Handle window resize for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Trigger confetti when reaching completion step
  useEffect(() => {
    if (progress.currentStep === 'complete') {
      setShowConfetti(true);
      // Stop confetti after 5 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [progress.currentStep]);

  // Check onboarding progress
  useEffect(() => {
    const checkProgress = () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Check venue using RTK Query data
      const hasVenue = hasVenuesData || false;
      
      // Use stable events count from useMemo
      const eventsCount = totalEventsCount;
      
      // Only log when there's meaningful data to avoid spam
      if (hasProfile || hasVenue || eventsCount > 0) {
        console.log('Onboarding: Progress check:', { hasProfile, hasVenue, eventsCount });
      }

      // Determine current step - always start with welcome for new users
      let currentStep: OnboardingStep = 'welcome';
      if (!hasProfile) {
        currentStep = 'welcome'; // Changed from 'profile' to 'welcome'
      } else if (!hasVenue) {
        currentStep = 'venue';
      } else if (!localStorage.getItem('musicdb-early-access-validated')) {
        currentStep = 'early-access';
      } else if (eventsCount < 3) {
        currentStep = 'events';
        setCurrentEventNumber(eventsCount + 1);
      } else {
        currentStep = 'complete';
      }

      // Only update progress if it actually changed
      const newProgress = {
        hasProfile,
        hasVenue,
        eventsCount,
        currentStep
      };

      const previousProgress = previousProgressRef.current;
      const progressChanged = 
        previousProgress.hasProfile !== newProgress.hasProfile ||
        previousProgress.hasVenue !== newProgress.hasVenue ||
        previousProgress.eventsCount !== newProgress.eventsCount ||
        previousProgress.currentStep !== newProgress.currentStep;

      if (progressChanged) {
        console.log('Onboarding: Progress updated:', currentStep, newProgress);
        setProgress(newProgress);
        previousProgressRef.current = newProgress;
      }

      // Only auto-show wizard if user has already completed welcome and needs to continue
      // For new users (no profile), they should see the welcome page first
      if (hasProfile && (currentStep === 'venue' || currentStep === 'early-access' || currentStep === 'events')) {
        setWizardStep(currentStep);
        setShowWizard(true);
      }

      setIsLoading(false);
    };

    checkProgress();
  }, [user, hasProfile, hasVenuesData, userVenues, totalEventsCount]);

  const handleStepComplete = async () => {
    setShowWizard(false);
    setIsTransitioning(true);
    
    // Add a small delay to ensure database updates are reflected and RTK Query cache is updated
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Refresh progress using RTK Query data (cache should be invalidated by mutations)
    if (user) {
      // Force refresh profile data
      if (refetchProfile) {
        await refetchProfile();
      }
      
      // Force refresh venue data
      await refreshVenues();
      
      // Force refetch venue events to ensure fresh event counts
      // Only refetch queries that are actually active (not skipped)
      console.log('Onboarding: Manually refetching venue events after step completion');
      const activeQueries = venueEventQueries.filter(query => 
        query && 
        query.refetch && 
        typeof query.refetch === 'function' &&
        !query.isUninitialized && 
        !query.isError && 
        query.data !== undefined &&
        !query.isLoading
      );
      
      console.log('Onboarding: Active queries found:', activeQueries.length, 'of', venueEventQueries.length);
      
      if (activeQueries.length > 0) {
        try {
          await Promise.all(
            activeQueries.map(async (query) => {
              try {
                console.log('Onboarding: Refetching query for venue events');
                return await query.refetch();
              } catch (error) {
                console.warn('Onboarding: Failed to refetch individual query:', error);
                return Promise.resolve(); // Continue with other queries
              }
            })
          );
          console.log('Onboarding: All active queries refetched successfully');
        } catch (error) {
          console.warn('Onboarding: Error during venue events refetch:', error);
        }
      } else {
        console.log('Onboarding: No active venue event queries to refetch');
      }
      
      // Small delay to ensure cache updates are reflected
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // The RTK Query hooks will automatically have fresh data due to cache invalidation
      // Use the same logic as checkProgress but with fresh data
      const hasProfile = !!(profile?.full_name && profile?.role);
      const hasVenue = hasVenuesData || false;
      
      // Use stable events count from useMemo
      const eventsCount = totalEventsCount;
      if (hasVenue && userVenues.length > 0) {
        console.log('Onboarding: Found user venues:', userVenues.length);
      }
      console.log('Onboarding: Total events count for user venues:', eventsCount);

      // Determine next step
      let nextStep: OnboardingStep = 'welcome';
      let nextEventNumber = 1;
      
      if (!hasProfile) {
        nextStep = 'profile';
      } else if (!hasVenue) {
        nextStep = 'venue';
      } else if (!localStorage.getItem('musicdb-early-access-validated')) {
        nextStep = 'early-access';
      } else if (eventsCount < 3) {
        nextStep = 'events';
        nextEventNumber = eventsCount + 1;
      } else {
        nextStep = 'complete';
      }

      console.log('Onboarding: Step completed, next step:', nextStep, {
        hasProfile,
        hasVenue,
        eventsCount,
        nextEventNumber
      });

      setProgress({
        hasProfile,
        hasVenue,
        eventsCount,
        currentStep: nextStep
      });

      // Show wizard for next step
      if (nextStep === 'profile' || nextStep === 'venue' || nextStep === 'early-access' || nextStep === 'events') {
        setWizardStep(nextStep);
        setCurrentEventNumber(nextEventNumber);
        setShowWizard(true);
      }
    }
    
    setIsTransitioning(false);
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    
    // Force refresh both profile and venue data to ensure Redux state is current
    try {
      // Refresh profile data in Redux
      if (user && refetchProfile) {
        await refetchProfile();
      }
      
      // Refresh venue context to ensure new venue data is loaded
      await refreshVenues();
    } catch (error) {
      console.log('Error refreshing data:', error);
    }
    
    // Mark onboarding as completed in localStorage to prevent future checks
    localStorage.setItem('musicdb-onboarding-completed', 'true');
    localStorage.setItem('musicdb-onboarding-complete-seen', 'true');
    
    // Longer delay to ensure all data is properly cached and context updates
    setTimeout(() => {
      navigate('/dashboard');
    }, 500);
  };

  const renderWelcomeStep = () => (
    <div className="text-center max-w-2xl mx-auto">
      <div className="mb-8">
        <img src={logo} alt="MusicDB Logo" className="w-32 h-32 mx-auto" />
      </div>
      
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to MusicDB!</h1>
      <p className="text-xl text-gray-600 mb-8">
       Thanks for being an early supporter. To get started, let’s set up your venue and log a few shows so your account is ready to use.
      </p>
      
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">What we'll set up together:</h2>
        <div className="space-y-3 text-left">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">1</div>
            <span className="text-gray-700">Complete your profile</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">2</div>
            <span className="text-gray-700">Add your venue</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">3</div>
            <span className="text-gray-700">Log 3 events</span>
          </div>
        </div>
      </div>
      
      <button
        onClick={() => {
          setWizardStep('profile');
          setShowWizard(true);
        }}
        className="btn-primary text-lg px-8 py-3"
      >
        Let's Get Started
      </button>
    </div>
  );

  const renderCompleteStep = () => (
    <>
      {showConfetti && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
          colors={['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899']}
        />
      )}
      <div className="text-center max-w-2xl mx-auto">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">🎉 You're All Set! 🎉</h1>
        <p className="text-xl text-gray-600 mb-8">
          Congratulations! You've completed your MusicDB setup and are ready to start tracking your venue's success.
        </p>
      
      <div className="bg-green-50 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-green-900 mb-4">What you've accomplished:</h2>
        <div className="space-y-3 text-left">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">✓</div>
            <span className="text-green-700">Profile information completed</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">✓</div>
            <span className="text-green-700">Venue added successfully</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">✓</div>
            <span className="text-green-700">{progress.eventsCount} events added</span>
          </div>
        </div>
      </div>
      
      <button
        onClick={handleComplete}
        className="btn-primary text-lg px-8 py-3"
      >
        Go to Dashboard
      </button>
    </div>
    </>
  );

  const renderProgressBar = () => {
    const steps = [
      { key: 'profile', label: 'Profile', completed: progress.hasProfile },
      { key: 'venue', label: 'Venue', completed: progress.hasVenue },
      { key: 'events', label: 'Events', completed: progress.eventsCount >= 3 }
    ];

    const currentStepIndex = steps.findIndex(step => !step.completed);
    const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(progressPercentage)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((step, index) => (
            <div key={step.key} className="text-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mx-auto mb-1 ${
                step.completed ? 'bg-green-500 text-white' : 
                index === currentStepIndex ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {step.completed ? '✓' : index + 1}
              </div>
              <span className="text-xs text-gray-600">{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F6F3] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  if (isCompleting) {
    return (
      <div className="min-h-screen bg-[#F6F6F3] flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto">
          <div className="mb-8">
            <img src={logo} alt="MusicDB Logo" className="w-32 h-32 mx-auto" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Setting up your dashboard...</h1>
          <p className="text-xl text-gray-600 mb-8">
            We're preparing your MusicDB dashboard with all your venue and event data.
          </p>
          
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (isTransitioning) {
    return (
      <div className="min-h-screen bg-[#F6F6F3] flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto">
          <div className="mb-16">
            <img src={logo} alt="MusicDB Logo" className="w-48 h-48 mx-auto" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Setting up next step...</h1>
          <p className="text-xl text-gray-600 mb-8">
            We're preparing your next onboarding step.
          </p>
          
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#F6F6F3] flex items-center justify-center p-8">
        {showWizard ? (
          // Show background content when wizard is open
          <div className="text-center max-w-2xl mx-auto">
            <div className="mb-16">
              <img src={logo} alt="MusicDB Logo" className="w-48 h-48 mx-auto" />
            </div>
            
            {wizardStep === 'profile' && (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Profile Setup</h1>
                <p className="text-xl text-gray-600">
                  Let's get to know you better. This information helps us personalize your MusicDB experience.
                </p>
              </>
            )}
            
            {wizardStep === 'venue' && (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Venue Setup</h1>
                <p className="text-xl text-gray-600">
                  Tell us about your venue. This is where all your events and analytics will be tracked.
                </p>
              </>
            )}
            
            {wizardStep === 'early-access' && (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Early Access</h1>
                <p className="text-xl text-gray-600">
                  Welcome to MusicDB's early access! Enter your code to unlock the platform and start building your music database.
                </p>
              </>
            )}
            
            {wizardStep === 'events' && (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Event {currentEventNumber} of 3</h1>
                <p className="text-xl text-gray-600">
                  {currentEventNumber === 1 && "Let's add your first event to get started with tracking."}
                  {currentEventNumber === 2 && "Great! Now let's add your second event to build your database."}
                  {currentEventNumber === 3 && "Almost there! This is your final event to complete the setup."}
                </p>
              </>
            )}
          </div>
        ) : (
          // Show normal onboarding content when wizard is closed
          <div className="rounded-3xl bg-white shadow-soft p-8 w-full max-w-4xl">
            {/* Progress Bar */}
            {progress.currentStep !== 'welcome' && progress.currentStep !== 'complete' && renderProgressBar()}
            
            {/* Content */}
            {progress.currentStep === 'welcome' && renderWelcomeStep()}
            {progress.currentStep === 'complete' && renderCompleteStep()}
          </div>
        )}
      </div>

      {/* Onboarding Wizard */}
      <OnboardingWizard 
        isOpen={showWizard} 
        onClose={handleStepComplete}
        step={wizardStep}
        eventNumber={currentEventNumber}
        prefillData={{
          full_name: profile?.full_name || user?.user_metadata?.full_name || '',
          email: user?.email || ''
        }}
      />
    </>
  );
} 