import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useVenue } from '../../contexts/VenueContext';
import { VenueService } from '../../services/venueService';
import { UserProfileService } from '../../services/userProfileService';
import OnboardingWizard from '../../components/features/onboarding/OnboardingWizard';
import logo from '../../assets/logo.png';

type OnboardingStep = 'welcome' | 'profile' | 'venue' | 'events' | 'complete';

interface OnboardingProgress {
  hasProfile: boolean;
  hasVenue: boolean;
  eventsCount: number;
  currentStep: OnboardingStep;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { currentVenue, refreshVenues } = useVenue();
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState<OnboardingProgress>({
    hasProfile: false,
    hasVenue: false,
    eventsCount: 0,
    currentStep: 'welcome'
  });
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<'profile' | 'venue' | 'events'>('profile');
  const [currentEventNumber, setCurrentEventNumber] = useState(1);

  // Check onboarding progress
  useEffect(() => {
    const checkProgress = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        // Check profile completion
        const hasProfile = !!(profile?.full_name && profile?.role);
        console.log('Onboarding: Profile check:', { hasProfile, profile });

        // Check venue
        const hasVenue = await VenueService.hasUserVenues(user.id);
        console.log('Onboarding: Venue check:', { hasVenue });

        // Get all user venues and count all events
        let eventsCount = 0;
        if (hasVenue) {
          const userVenues = await VenueService.getUserVenues(user.id);
          console.log('Onboarding: Found user venues:', userVenues.length);
          
          for (const venue of userVenues) {
            const events = await VenueService.getVenueEvents(venue.id);
            const venueEventCount = events.upcoming.length + events.past.length;
            eventsCount += venueEventCount;
            console.log(`Onboarding: Venue ${venue.name} (${venue.id}) has ${venueEventCount} events`);
          }
        }

        console.log('Onboarding: Total events count for user venues:', eventsCount);

        // Determine current step - always start with welcome for new users
        let currentStep: OnboardingStep = 'welcome';
        if (!hasProfile) {
          currentStep = 'welcome'; // Changed from 'profile' to 'welcome'
        } else if (!hasVenue) {
          currentStep = 'venue';
        } else if (eventsCount < 3) {
          currentStep = 'events';
          setCurrentEventNumber(eventsCount + 1);
        } else {
          currentStep = 'complete';
        }

        console.log('Onboarding: Determined step:', currentStep, { hasProfile, hasVenue, eventsCount });

        setProgress({
          hasProfile,
          hasVenue,
          eventsCount,
          currentStep
        });

        // Only auto-show wizard if user has already completed welcome and needs to continue
        // For new users (no profile), they should see the welcome page first
        if (hasProfile && (currentStep === 'venue' || currentStep === 'events')) {
          setWizardStep(currentStep);
          setShowWizard(true);
        }

      } catch (error) {
        console.error('Error checking onboarding progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkProgress();
  }, [user, profile, currentVenue]);

  const handleStepComplete = async () => {
    setShowWizard(false);
    setIsTransitioning(true);
    
    // Add a small delay to ensure database updates are reflected
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Refresh progress
    if (user) {
      // Force refresh profile data from database
      const { data: refreshedProfile } = await UserProfileService.getUserProfile(user.id);
      
      const hasProfile = !!(refreshedProfile?.full_name && refreshedProfile?.role);
      const hasVenue = await VenueService.hasUserVenues(user.id);
      
      // Get all user venues and count all events
      let eventsCount = 0;
      if (hasVenue) {
        const userVenues = await VenueService.getUserVenues(user.id);
        console.log('Onboarding: Found user venues:', userVenues.length);
        
        for (const venue of userVenues) {
          const events = await VenueService.getVenueEvents(venue.id);
          const venueEventCount = events.upcoming.length + events.past.length;
          eventsCount += venueEventCount;
          console.log(`Onboarding: Venue ${venue.name} (${venue.id}) has ${venueEventCount} events`);
        }
      }

      console.log('Onboarding: Total events count for user venues:', eventsCount);

      // Determine next step
      let nextStep: OnboardingStep = 'welcome';
      let nextEventNumber = 1;
      
      if (!hasProfile) {
        nextStep = 'profile';
      } else if (!hasVenue) {
        nextStep = 'venue';
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
        refreshedProfile,
        nextEventNumber
      });

      setProgress({
        hasProfile,
        hasVenue,
        eventsCount,
        currentStep: nextStep
      });

      // Show wizard for next step
      if (nextStep === 'profile' || nextStep === 'venue' || nextStep === 'events') {
        setWizardStep(nextStep);
        setCurrentEventNumber(nextEventNumber);
        setShowWizard(true);
      }
    }
    
    setIsTransitioning(false);
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    
    // Refresh venue context to ensure new venue data is loaded
    try {
      await refreshVenues();
    } catch (error) {
      console.log('Error refreshing venues:', error);
    }
    
    // Small delay to ensure context updates
    setTimeout(() => {
      navigate('/dashboard');
    }, 100);
  };

  const renderWelcomeStep = () => (
    <div className="text-center max-w-2xl mx-auto">
      <div className="mb-8">
        <img src={logo} alt="MusicDB Logo" className="w-32 h-32 mx-auto" />
      </div>
      
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to MusicDB!</h1>
      <p className="text-xl text-gray-600 mb-8">
        Since you're an early supporter, MusicDB is free! But to make the tool as useful as possible for you and others using it, we'll need to setup your venue & get some shows logged.
      </p>
      
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">What we'll set up together:</h2>
        <div className="space-y-3 text-left">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">1</div>
            <span className="text-gray-700">Your profile information</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">2</div>
            <span className="text-gray-700">Add your venue</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">3</div>
            <span className="text-gray-700">Add 3 events to get started</span>
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
    <div className="text-center max-w-2xl mx-auto">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h1 className="text-4xl font-bold text-gray-900 mb-4">You're All Set!</h1>
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