import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { VenueService } from '../../../services/venueService';
import { EventService } from '../../../services/eventService';
import type { Tables } from '../../../types/database.types';

type OnboardingStep = 'welcome' | 'venue-verification' | 'event-reporting' | 'complete';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingProgress, setOnboardingProgress] = useState({
    hasVenues: false,
    eventsReported: 0,
    totalEventsRequired: 3
  });

  // Check onboarding progress
  useEffect(() => {
    const checkProgress = async () => {
      if (!user) return;
      
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

        setOnboardingProgress({
          hasVenues,
          eventsReported,
          totalEventsRequired: 3
        });

        // Auto-advance steps based on progress
        if (!hasVenues) {
          setCurrentStep('venue-verification');
        } else if (eventsReported < 3) {
          setCurrentStep('event-reporting');
        } else {
          setCurrentStep('complete');
        }
      } catch (error) {
        console.error('Error checking onboarding progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      checkProgress();
    }
  }, [user, isOpen]);

  const handleVenueVerification = () => {
    navigate('/verification');
    onClose();
  };

  const handleEventReporting = () => {
    navigate('/add-event');
    onClose();
  };

  const handleComplete = () => {
    onClose();
    navigate('/dashboard');
  };

  const renderWelcomeStep = () => (
    <div className="text-center">
      <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Welcome to MusicDB! 🎵
      </h2>
      
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        We're excited to have you join our community of music venues and promoters. 
        To get started and unlock all features, we need you to complete a quick setup process.
      </p>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">What you'll need to do:</h3>
        <div className="space-y-4 text-left max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-sm font-semibold">1</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Verify your venue</p>
              <p className="text-sm text-gray-600">Search for your venue or create a new one</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-sm font-semibold">2</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Report 3 events</p>
              <p className="text-sm text-gray-600">Add your past or upcoming shows to our database</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-sm font-semibold">3</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Access everything for free!</p>
              <p className="text-sm text-gray-600">Unlock all features and insights</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={onClose}
          className="btn-secondary px-6 py-3"
        >
          Maybe Later
        </button>
        <button
          onClick={() => setCurrentStep('venue-verification')}
          className="btn-primary px-6 py-3"
        >
          Let's Get Started!
        </button>
      </div>
    </div>
  );

  const renderVenueVerificationStep = () => (
    <div className="text-center">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Step 1: Verify Your Venue
      </h2>
      
      <p className="text-gray-600 mb-8 max-w-lg mx-auto">
        To start reporting events, we need to associate you with a venue. 
        You can search for your existing venue or create a new one.
      </p>

      <div className="bg-blue-50 rounded-lg p-4 mb-8">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-blue-800">
            {onboardingProgress.hasVenues 
              ? "✅ Venue verification complete!" 
              : "This step is required to continue"
            }
          </span>
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={onClose}
          className="btn-secondary px-6 py-3"
        >
          Skip for Now
        </button>
        <button
          onClick={handleVenueVerification}
          className="btn-primary px-6 py-3"
        >
          {onboardingProgress.hasVenues ? 'Manage Venues' : 'Verify Venue'}
        </button>
      </div>
    </div>
  );

  const renderEventReportingStep = () => (
    <div className="text-center">
      <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Step 2: Report Your Events
      </h2>
      
      <p className="text-gray-600 mb-8 max-w-lg mx-auto">
        Add your events to our database to unlock all features. 
        You can report past events or upcoming shows.
      </p>

      <div className="bg-purple-50 rounded-lg p-4 mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-purple-800">Progress</span>
          <span className="text-sm text-purple-600">
            {onboardingProgress.eventsReported} / {onboardingProgress.totalEventsRequired}
          </span>
        </div>
        <div className="w-full bg-purple-200 rounded-full h-2">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((onboardingProgress.eventsReported / onboardingProgress.totalEventsRequired) * 100, 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-purple-600 mt-2">
          {onboardingProgress.eventsReported >= onboardingProgress.totalEventsRequired 
            ? "✅ All events reported!" 
            : `${onboardingProgress.totalEventsRequired - onboardingProgress.eventsReported} more events needed`
          }
        </p>
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={onClose}
          className="btn-secondary px-6 py-3"
        >
          Skip for Now
        </button>
        <button
          onClick={handleEventReporting}
          className="btn-primary px-6 py-3"
        >
          {onboardingProgress.eventsReported >= onboardingProgress.totalEventsRequired 
            ? 'View All Events' 
            : 'Add an Event'
          }
        </button>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        🎉 You're All Set!
      </h2>
      
      <p className="text-gray-600 mb-8 max-w-lg mx-auto">
        Congratulations! You've completed the onboarding process and now have access to all MusicDB features.
      </p>

      <div className="bg-green-50 rounded-lg p-4 mb-8">
        <div className="space-y-3 text-left">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-green-800">Venue verification complete</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-green-800">
              {onboardingProgress.eventsReported} events reported
            </span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-green-800">Full platform access unlocked</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleComplete}
        className="btn-primary px-8 py-3"
      >
        Go to Dashboard
      </button>
    </div>
  );

  const renderCurrentStep = () => {
    if (isLoading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading onboarding progress...</p>
        </div>
      );
    }

    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'venue-verification':
        return renderVenueVerificationStep();
      case 'event-reporting':
        return renderEventReportingStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return renderWelcomeStep();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
} 