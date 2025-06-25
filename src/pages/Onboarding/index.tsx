import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useVenue } from '../../contexts/VenueContext';
import { VenueService } from '../../services/venueService';
import { EventService } from '../../services/eventService';
import { UserProfileService } from '../../services/userProfileService';
import OnboardingWizard from '../../components/features/onboarding/OnboardingWizard';
import Sidebar from '../../components/layout/Sidebar';
import { supabase } from '../../supabaseClient';

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
  const { currentVenue } = useVenue();
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<OnboardingProgress>({
    hasProfile: false,
    hasVenue: false,
    eventsCount: 0,
    currentStep: 'welcome'
  });
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<'profile' | 'venue' | 'events'>('profile');

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

        // Check events count
        let eventsCount = 0;
        if (hasVenue && currentVenue) {
          const events = await VenueService.getVenueEvents(currentVenue.id);
          eventsCount = events.upcoming.length + events.past.length;
          console.log('Onboarding: Events check:', { eventsCount, currentVenue: currentVenue.id });
        }

        // Determine current step
        let currentStep: OnboardingStep = 'welcome';
        if (!hasProfile) {
          currentStep = 'profile';
        } else if (!hasVenue) {
          currentStep = 'venue';
        } else if (eventsCount < 3) {
          currentStep = 'events';
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

        // Auto-show wizard for current step
        if (currentStep === 'profile' || currentStep === 'venue' || currentStep === 'events') {
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

  const handleStepComplete = async (step: OnboardingStep) => {
    setShowWizard(false);
    
    // Add a small delay to ensure database updates are reflected
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Refresh progress
    if (user) {
      // Force refresh profile data from database
      const { data: refreshedProfile } = await UserProfileService.getUserProfile(user.id);
      
      const hasProfile = !!(refreshedProfile?.full_name && refreshedProfile?.role);
      const hasVenue = await VenueService.hasUserVenues(user.id);
      let eventsCount = 0;
      if (hasVenue && currentVenue) {
        const events = await VenueService.getVenueEvents(currentVenue.id);
        eventsCount = events.upcoming.length + events.past.length;
      }

      // Determine next step
      let nextStep: OnboardingStep = 'welcome';
      if (!hasProfile) {
        nextStep = 'profile';
      } else if (!hasVenue) {
        nextStep = 'venue';
      } else if (eventsCount < 3) {
        nextStep = 'events';
      } else {
        nextStep = 'complete';
      }

      console.log('Onboarding: Step completed, next step:', nextStep, {
        hasProfile,
        hasVenue,
        eventsCount,
        refreshedProfile
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
        setShowWizard(true);
      }
    }
  };

  const handleComplete = () => {
    navigate('/dashboard');
  };

  const renderWelcomeStep = () => (
    <div className="text-center max-w-2xl mx-auto">
      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to MusicDB!</h1>
      <p className="text-xl text-gray-600 mb-8">
        Let's get you set up to start tracking your music venue's success.
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
            <span className="text-gray-700">Add at least 3 events to get started</span>
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

  return (
    <>
      <div className="min-h-screen bg-[#F6F6F3] flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="rounded-3xl bg-white shadow-soft p-8 min-h-[90vh]">
            {/* Progress Bar */}
            {progress.currentStep !== 'welcome' && progress.currentStep !== 'complete' && renderProgressBar()}
            
            {/* Content */}
            {progress.currentStep === 'welcome' && renderWelcomeStep()}
            {progress.currentStep === 'complete' && renderCompleteStep()}
          </div>
        </main>
      </div>

      {/* Onboarding Wizard */}
      <OnboardingWizard 
        isOpen={showWizard} 
        onClose={() => handleStepComplete(progress.currentStep)}
        step={wizardStep}
        prefillData={{
          full_name: profile?.full_name || user?.user_metadata?.full_name || '',
          email: user?.email || ''
        }}
      />
    </>
  );
} 