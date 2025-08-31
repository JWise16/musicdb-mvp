
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useOnboarding } from '../../hooks/useOnboarding';
import { useVenue } from '../../contexts/VenueContext';
import { useGetVenueEventsQuery } from '../../store/api/venuesApi';
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

  // Pre-define hooks for up to 5 venues to prevent hook order violations
  const venue1EventsQuery = useGetVenueEventsQuery(
    userVenues[0]?.id || '', 
    { skip: !userVenues[0]?.id || !hasUserVenues }
  );
  const venue2EventsQuery = useGetVenueEventsQuery(
    userVenues[1]?.id || '', 
    { skip: !userVenues[1]?.id || !hasUserVenues }
  );
  const venue3EventsQuery = useGetVenueEventsQuery(
    userVenues[2]?.id || '', 
    { skip: !userVenues[2]?.id || !hasUserVenues }
  );
  const venue4EventsQuery = useGetVenueEventsQuery(
    userVenues[3]?.id || '', 
    { skip: !userVenues[3]?.id || !hasUserVenues }
  );
  const venue5EventsQuery = useGetVenueEventsQuery(
    userVenues[4]?.id || '', 
    { skip: !userVenues[4]?.id || !hasUserVenues }
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

  // Check if user should see onboarding flow using RTK Query data
  useEffect(() => {
    if (!user || venueLoading) return;

    if (hasUserVenues && userVenues.length > 0) {
      // Use stable events count
      const eventsReported = totalEventsCount;

      console.log('AddEvent: Total events reported across venues:', eventsReported);

      // Show onboarding if user has venues but less than 3 events
      if (eventsReported < 3) {
        setIsOnboardingMode(true);
        setCurrentStep('onboarding');
        setCurrentEventNumber(eventsReported + 1);
      }
    }
  }, [user, hasUserVenues, userVenues, venueLoading, totalEventsCount]);

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
      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
        <div className="rounded-3xl bg-white shadow-soft p-4 lg:p-8 min-h-[90vh] max-w-full">
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