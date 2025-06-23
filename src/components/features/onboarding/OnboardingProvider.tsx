import { ReactNode } from 'react';
import { useOnboarding } from '../../../hooks/useOnboarding';
import OnboardingModal from './OnboardingModal';
import OnboardingComplete from './OnboardingComplete';

interface OnboardingProviderProps {
  children: ReactNode;
}

export default function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { showOnboarding, showCompletion, closeOnboarding, closeCompletion } = useOnboarding();

  return (
    <>
      {children}
      
      {/* Onboarding Modal */}
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={closeOnboarding} 
      />

      {/* Onboarding Completion Celebration */}
      {showCompletion && (
        <OnboardingComplete
          onClose={closeCompletion}
        />
      )}
    </>
  );
} 