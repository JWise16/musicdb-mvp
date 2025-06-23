import { useNavigate } from 'react-router-dom';

interface OnboardingCompleteProps {
  onClose: () => void;
}

export default function OnboardingComplete({ onClose }: OnboardingCompleteProps) {
  const navigate = useNavigate();

  const handleExplore = () => {
    onClose();
    navigate('/events');
  };

  const handleDashboard = () => {
    onClose();
    navigate('/dashboard');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full">
        <div className="p-8 text-center">
          {/* Celebration Animation */}
          <div className="mb-6">
            <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            {/* Confetti effect */}
            <div className="flex justify-center gap-1 mb-4">
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full animate-bounce`}
                  style={{
                    backgroundColor: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'][i % 4],
                    animationDelay: `${i * 0.1}s`
                  }}
                ></div>
              ))}
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            🎉 Congratulations!
          </h2>
          
          <p className="text-lg text-gray-600 mb-8">
            You've successfully completed your onboarding and now have full access to MusicDB!
          </p>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">What you've unlocked:</h3>
            <div className="space-y-3 text-left max-w-md mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">Full events database access</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">Advanced analytics and insights</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">Community features and networking</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">All premium features for free</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600">
              Ready to explore the full platform?
            </p>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleDashboard}
                className="btn-secondary px-6 py-3"
              >
                Go to Dashboard
              </button>
              <button
                onClick={handleExplore}
                className="btn-primary px-8 py-3"
              >
                Explore Events
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 