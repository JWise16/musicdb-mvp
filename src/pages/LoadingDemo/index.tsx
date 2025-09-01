import { useState } from 'react';
import LoadingAnimation from '../../components/common/LoadingAnimation';

const LoadingDemo = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(6000);

  const handleStartDemo = () => {
    setIsLoading(true);
    // Auto-stop after the duration + 1 second for demo purposes
    setTimeout(() => {
      setIsLoading(false);
    }, duration + 1000);
  };

  if (isLoading) {
    return (
      <LoadingAnimation
        title="Loading Artist Details"
        subtitle="Gathering comprehensive artist insights and analytics"
        messages={[
          "Fetching artist profile information...",
          "Loading streaming platform analytics...",
          "Retrieving audience demographics...",
          "Gathering social media insights...",
          "Compiling event history...",
          "Processing fanbase data across platforms...",
          "Analyzing listening patterns and trends...",
          "Finalizing comprehensive artist report..."
        ]}
        duration={duration}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F6F3] flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Loading Animation Demo</h2>
        <p className="text-gray-600 mb-6 text-center">
          Test the new loading animation with progress bar and rotating messages
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration: {duration / 1000}s
          </label>
          <input
            type="range"
            min="3000"
            max="15000"
            step="1000"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full"
          />
        </div>
        
        <button
          onClick={handleStartDemo}
          className="w-full bg-accent-600 hover:bg-accent-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
        >
          Start Loading Demo
        </button>
        
        <p className="text-xs text-gray-500 mt-4 text-center">
          The animation will automatically stop after completion
        </p>
      </div>
    </div>
  );
};

export default LoadingDemo;
