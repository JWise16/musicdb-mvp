import { useState, useEffect } from 'react';

interface LoadingAnimationProps {
  title?: string;
  subtitle?: string;
  messages?: string[];
  duration?: number; // Total duration for progress bar
  className?: string;
}

const LoadingAnimation = ({
  title = "Loading Artist Details",
  subtitle = "Gathering comprehensive artist data",
  messages = [
    "Fetching artist profile information...",
    "Loading streaming platform analytics...",
    "Retrieving audience demographics...",
    "Gathering social media insights...",
    "Compiling event history...",
    "Processing fanbase data...",
    "Analyzing listening patterns...",
    "Finalizing comprehensive report..."
  ],
  duration = 8000, // 8 seconds
  className = ""
}: LoadingAnimationProps) => {
  const [progress, setProgress] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const messageInterval = duration / messages.length;
    
    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      
      setProgress(newProgress);
      
      // Update message based on progress
      const newMessageIndex = Math.min(
        Math.floor(elapsed / messageInterval),
        messages.length - 1
      );
      setCurrentMessageIndex(newMessageIndex);
      
      if (newProgress >= 100) {
        setIsComplete(true);
        clearInterval(progressTimer);
      }
    }, 50); // Update every 50ms for smooth animation

    return () => clearInterval(progressTimer);
  }, [duration, messages.length]);

  return (
    <div className={`min-h-screen bg-[#F6F6F3] flex items-center justify-center ${className}`}>
      <div className="max-w-md w-full mx-4">
        {/* Logo/Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            {/* Animated music note icon */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 animate-pulse"></div>
            <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
              <svg className="w-8 h-8 text-accent-600 animate-bounce" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600 text-sm">{subtitle}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-medium text-accent-600">{Math.round(progress)}%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-accent-500 to-accent-600 h-3 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* Animated shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
            </div>
          </div>
        </div>

        {/* Rotating Messages */}
        <div className="text-center mb-8">
          <div className="relative h-12 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center">
              <p 
                key={currentMessageIndex}
                className="text-gray-700 text-sm animate-fade-in-up px-4"
              >
                {messages[currentMessageIndex]}
              </p>
            </div>
          </div>
        </div>

        {/* Loading Dots */}
        <div className="flex justify-center space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 bg-accent-600 rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            ></div>
          ))}
        </div>

        {/* Fun facts or tips (optional) */}
        <div className="mt-8 text-center">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">💡 Did you know?</p>
            <p className="text-sm text-gray-700">
              We analyze data from multiple platforms to give you the most comprehensive artist insights
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;
