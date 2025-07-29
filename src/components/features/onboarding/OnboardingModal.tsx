import { useState, useEffect } from 'react';
import { useOnboarding } from '../../../hooks/useOnboarding';
import OnboardingEventForm from './OnboardingEventForm';
import OnboardingComplete from './OnboardingComplete';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const { progress, refreshProgress } = useOnboarding();
  const [currentStep, setCurrentStep] = useState<'form' | 'complete'>('form');

  // Reset to form step when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('form');
    }
  }, [isOpen]);

  const handleEventAdded = async () => {
    await refreshProgress();
    
    if (progress.eventsReported + 1 >= progress.totalEventsRequired) {
      setCurrentStep('complete');
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleComplete = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl lg:rounded-3xl shadow-soft w-full max-w-[95vw] lg:max-w-5xl xl:max-w-6xl max-h-[95vh] overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          {currentStep === 'form' ? (
            <OnboardingEventForm
              onEventAdded={handleEventAdded}
              onSkip={handleSkip}
              currentEventNumber={progress.eventsReported + 1}
              totalEventsRequired={progress.totalEventsRequired}
            />
          ) : (
            <OnboardingComplete onClose={handleComplete} />
          )}
        </div>
      </div>
    </div>
  );
} 