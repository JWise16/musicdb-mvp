import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useOnboarding } from '../../hooks/useOnboarding';
import { useVenue } from '../../contexts/VenueContext';
import { VenueService } from '../../services/venueService';
import Sidebar from '../../components/layout/Sidebar';
import ReportTypeSelection from './ReportTypeSelection';
import ManualEventForm from './ManualEventForm';
import FileUpload from './FileUpload';
import OnboardingEventForm from '../../components/features/onboarding/OnboardingEventForm';

type Step = 'selection' | 'manual' | 'upload' | 'onboarding';

const AddEvent = () => {
  const { user } = useAuth();
  const { refreshProgress } = useOnboarding();
  const { hasUserVenues, userVenues, isLoading: venueLoading } = useVenue();
  const [currentStep, setCurrentStep] = useState<Step>('selection');
  const [isOnboardingMode, setIsOnboardingMode] = useState(false);
  const [currentEventNumber, setCurrentEventNumber] = useState(1);
  const navigate = useNavigate();

  // Check if user should see onboarding flow using venue context
  useEffect(() => {
    const checkOnboardingMode = async () => {
      if (!user || venueLoading) return;

      try {
        if (hasUserVenues) {
          // Use userVenues from context instead of making API call
          const venueEvents = await Promise.all(
            userVenues.map(venue => VenueService.getVenueEvents(venue.id))
          );
          const eventsReported = venueEvents.reduce((total, events) => 
            total + events.upcoming.length + events.past.length, 0
          );

          // Show onboarding if user has venues but less than 3 events
          if (eventsReported < 3) {
            setIsOnboardingMode(true);
            setCurrentStep('onboarding');
            setCurrentEventNumber(eventsReported + 1);
          }
        }
      } catch (error) {
        console.error('Error checking onboarding mode:', error);
      }
    };

    checkOnboardingMode();
  }, [user, hasUserVenues, userVenues, venueLoading]);

  const handleReportTypeSelect = (type: 'manual' | 'upload') => {
    setCurrentStep(type);
  };

  const handleBack = () => {
    if (currentStep === 'manual' || currentStep === 'upload') {
      setCurrentStep('selection');
    } else if (currentStep === 'onboarding') {
      navigate('/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleComplete = () => {
    navigate('/dashboard');
  };

  const handleOnboardingEventAdded = () => {
    setCurrentEventNumber(prev => prev + 1);
    refreshProgress();
    
    // If we've added all required events, go to dashboard
    if (currentEventNumber >= 3) {
      navigate('/dashboard');
    }
  };

  const handleOnboardingSkip = () => {
    navigate('/dashboard');
  };

  const renderStep = () => {
    if (isOnboardingMode && currentStep === 'onboarding') {
      return (
        <OnboardingEventForm
          onEventAdded={handleOnboardingEventAdded}
          onSkip={handleOnboardingSkip}
          currentEventNumber={currentEventNumber}
          totalEventsRequired={3}
        />
      );
    }

    switch (currentStep) {
      case 'selection':
        return (
          <ReportTypeSelection
            onSelect={handleReportTypeSelect}
            onBack={handleBack}
          />
        );
      case 'manual':
        return (
          <ManualEventForm
            onEventCreated={(eventId) => {
              console.log('Event created:', eventId);
              handleComplete();
            }}
            onCancel={handleBack}
          />
        );
      case 'upload':
        return (
          <FileUpload
            onBack={handleBack}
            onComplete={handleComplete}
          />
        );
      default:
        return null;
    }
  };

  const getHeaderContent = () => {
    if (isOnboardingMode && currentStep === 'onboarding') {
      return {
        title: `Add Event ${currentEventNumber} of 3`,
        subtitle: 'Complete your onboarding by adding your events'
      };
    }

    return {
      title: 'Add Event',
      subtitle: currentStep === 'selection' && 'Choose how you would like to report your event' ||
                currentStep === 'manual' && 'Enter event details manually' ||
                currentStep === 'upload' && 'Upload event file' ||
                ''
    };
  };

  const headerContent = getHeaderContent();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F6F6F3] flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="rounded-3xl bg-white shadow-soft p-8 min-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">{headerContent.title}</h2>
              <p className="text-gray-600">{headerContent.subtitle}</p>
            </div>
          </div>

          {/* Step Content */}
          {renderStep()}
        </div>
      </main>
    </div>
  );
};

export default AddEvent; 