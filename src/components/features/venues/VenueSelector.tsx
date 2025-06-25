import { useState } from 'react';
import { useVenue } from '../../../contexts/VenueContext';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function VenueSelector() {
  const { currentVenue, userVenues, switchVenue, isLoading } = useVenue();
  const { loading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Don't show anything while auth is loading
  if (authLoading) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
        <span className="text-sm text-gray-600">Loading venues...</span>
      </div>
    );
  }

  if (userVenues.length === 0) {
    return (
      <button
        onClick={() => navigate('/verification')}
        className="btn-primary text-sm px-4 py-2"
      >
        Add Your First Venue
      </button>
    );
  }

  return (
    <div className="relative">
      {/* Current Venue Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="font-medium text-gray-900">
            {currentVenue?.name || 'Select Venue'}
          </span>
          <span className="text-sm text-gray-500">
            ({userVenues.length} venue{userVenues.length !== 1 ? 's' : ''})
          </span>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-64">
          <div className="p-2">
            {/* Current Venue */}
            {currentVenue && (
              <div className="px-3 py-2 bg-blue-50 rounded-md mb-2">
                <div className="text-sm font-medium text-blue-900">
                  {currentVenue.name}
                </div>
                <div className="text-xs text-blue-700">
                  {currentVenue.location}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  ✓ Currently selected
                </div>
              </div>
            )}

            {/* Other Venues */}
            {userVenues
              .filter(venue => venue.id !== currentVenue?.id)
              .map(venue => (
                <button
                  key={venue.id}
                  onClick={() => {
                    switchVenue(venue.id);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <div className="text-sm font-medium text-gray-900">
                    {venue.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {venue.location}
                  </div>
                </button>
              ))}

            {/* Divider */}
            {userVenues.length > 0 && (
              <div className="border-t border-gray-200 my-2"></div>
            )}

            {/* Add Another Venue */}
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/add-venue');
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-md transition-colors text-sm text-blue-600 font-medium"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Another Venue
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 