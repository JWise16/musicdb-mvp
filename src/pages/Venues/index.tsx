import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VenueService } from '../../services/venueService';
import { type Tables } from '../../database.types';
import Sidebar from '../../components/layout/Sidebar';

const Venues = () => {
  const navigate = useNavigate();
  const [venues, setVenues] = useState<Tables<'venues'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVenues = async () => {
      setIsLoading(true);
      try {
        const venuesData = await VenueService.getAllVenues();
        setVenues(venuesData);
      } catch (error) {
        console.error('Error loading venues:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVenues();
  }, []);

  const handleVenueClick = (venueId: string) => {
    navigate(`/venue/${venueId}`);
  };

  const getVenueSizeLabel = (capacity: number | null) => {
    if (!capacity) return 'Unknown';
    if (capacity <= 200) return 'Small';
    if (capacity <= 1000) return 'Medium';
    return 'Large';
  };

  const getVenueSizeColor = (capacity: number | null) => {
    if (!capacity) return 'bg-gray-100 text-gray-600';
    if (capacity <= 200) return 'bg-blue-100 text-blue-700';
    if (capacity <= 1000) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  return (
    <div className="min-h-screen bg-[#F6F6F3] flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="rounded-3xl bg-white shadow-soft p-8 min-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">Venues</h2>
              <p className="text-gray-600">
                Discover music venues across the country
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {venues.length} venue{venues.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Venues Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading venues...</p>
              </div>
            </div>
          ) : venues.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No venues found</h3>
              <p className="text-gray-600">
                There are no venues in the database yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map(venue => (
                <div 
                  key={venue.id}
                  className="card hover:shadow-medium transition-all duration-200 cursor-pointer group"
                  onClick={() => handleVenueClick(venue.id)}
                >
                  {/* Venue Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-accent-600 transition-colors line-clamp-2">
                        {venue.name}
                      </h3>
                      <div className={`px-2 py-1 text-xs rounded-full ${getVenueSizeColor(venue.capacity)}`}>
                        {getVenueSizeLabel(venue.capacity)}
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {venue.location}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {venue.capacity ? `${venue.capacity.toLocaleString()} capacity` : 'Capacity unknown'}
                    </div>
                  </div>

                  {/* Venue Description */}
                  {venue.description && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {venue.description}
                      </p>
                    </div>
                  )}

                  {/* Contact Info */}
                  {(venue.contact_email || venue.contact_phone) && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs font-medium text-gray-500 mb-2">Contact Information</div>
                      {venue.contact_email && (
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {venue.contact_email}
                        </div>
                      )}
                      {venue.contact_phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {venue.contact_phone}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Address */}
                  <div className="mt-4 text-sm text-gray-600">
                    <div className="flex items-start">
                      <svg className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="line-clamp-2">{venue.address}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Venues; 