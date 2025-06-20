import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import ReportTypeSelection from './ReportTypeSelection';
import ManualEventForm from './ManualEventForm';
import FileUpload from './FileUpload';

type Step = 'selection' | 'manual' | 'upload';

const AddEvent = () => {
  const [currentStep, setCurrentStep] = useState<Step>('selection');
  const navigate = useNavigate();

  const handleReportTypeSelect = (type: 'manual' | 'upload') => {
    setCurrentStep(type);
  };

  const handleBack = () => {
    if (currentStep === 'manual' || currentStep === 'upload') {
      setCurrentStep('selection');
    } else {
      navigate('/dashboard');
    }
  };

  const handleComplete = () => {
    navigate('/dashboard');
  };

  const renderStep = () => {
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
            onBack={handleBack}
            onComplete={handleComplete}
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

  return (
    <div className="min-h-screen bg-[#F6F6F3] flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="rounded-3xl bg-white shadow-soft p-8 min-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">Add Event</h2>
              <p className="text-gray-600">
                {currentStep === 'selection' && 'Choose how you would like to report your event'}
                {currentStep === 'manual' && 'Enter event details manually'}
                {currentStep === 'upload' && 'Upload event file'}
              </p>
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