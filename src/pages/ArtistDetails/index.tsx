import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../../components/layout/Sidebar';
import { formatEventDate } from '../../utils/dateUtils';

// Import types from the database
import type { Tables } from '../../types/database.types';

// Define the ArtistWithEvents type locally for now
type ArtistWithEvents = Tables<'artists'> & {
  events: Array<Tables<'events'> & {
    venues: Tables<'venues'>;
    is_headliner: boolean;
    performance_order: number;
  }>;
};

const ArtistDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<ArtistWithEvents | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadArtistDetails = async () => {
      if (!id || !user) return;

      setIsLoading(true);
      setError(null);
      
      try {
        // Import ArtistService dynamically
        const { ArtistService } = await import('../../services/artistService');
        const artistData = await ArtistService.getArtistWithEvents(id);
        if (artistData) {
          setArtist(artistData);
        } else {
          setError('Artist not found');
        }
      } catch (error) {
        console.error('Error loading artist details:', error);
        setError('Failed to load artist details');
      } finally {
        setIsLoading(false);
      }
    };

    loadArtistDetails();
  }, [id, user]);

  const handleEventClick = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F6F3] flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="rounded-3xl bg-white shadow-soft p-8 min-h-[90vh]">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading artist details...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen bg-[#F6F6F3] flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="rounded-3xl bg-white shadow-soft p-8 min-h-[90vh]">
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Artist Not Found</h3>
              <p className="text-gray-600 mb-6">
                {error || 'The artist you are looking for could not be found.'}
              </p>
              <button 
                onClick={() => navigate('/events')}
                className="btn-primary"
              >
                Back to Events
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F6F3] flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="rounded-3xl bg-white shadow-soft p-8 min-h-[90vh]">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate('/events')}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Artist Details</h2>
              <p className="text-gray-600">
                View artist information and performance history
              </p>
            </div>
          </div>

          {/* Main Content - Left/Right Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Artist Info */}
            <div className="lg:col-span-3">
              <div className="space-y-6">
                {/* Artist Name */}
                <div className="card p-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{artist.name}</h1>
                  {artist.genre && (
                    <div className="mb-4">
                      <span className="px-3 py-1 bg-accent-100 text-accent-700 rounded-full text-sm">
                        {artist.genre}
                      </span>
                    </div>
                  )}
                </div>

                {/* Artist Information */}
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Artist Information</h3>
                  <div className="space-y-4">
                    {artist.description && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Description</span>
                        <p className="mt-1 text-gray-900 text-sm leading-relaxed">{artist.description}</p>
                      </div>
                    )}

                    {artist.contact_info && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Contact Information</span>
                        <p className="mt-1 text-gray-900 text-sm">{artist.contact_info}</p>
                      </div>
                    )}

                    {/* Performance Stats */}
                    <div className="pt-4 border-t border-gray-200">
                      <span className="text-sm font-medium text-gray-500 mb-3 block">Performance Stats</span>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Events</span>
                          <span className="font-semibold">{artist.events.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Headliner Events</span>
                          <span className="font-semibold">
                            {artist.events.filter((e: any) => e.is_headliner).length}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Supporting Events</span>
                          <span className="font-semibold">
                            {artist.events.filter((e: any) => !e.is_headliner).length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Events List */}
            <div className="lg:col-span-9">
              <div className="card p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Event History</h3>
            {artist.events.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Venue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendance
                      </th>
                    </tr>
                  </thead>
                                     <tbody className="bg-white divide-y divide-gray-200">
                     {artist.events.map((event: any) => (
                      <tr
                        key={event.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleEventClick(event.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {event.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatEventDate(event.date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {event.venues?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {event.venues?.location}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            event.is_headliner 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {event.is_headliner ? 'Headliner' : 'Supporting'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {event.tickets_sold ? (
                              <>
                                {event.tickets_sold.toLocaleString()} / {event.total_tickets.toLocaleString()}
                                <div className="text-xs text-gray-500">
                                  ({Math.round((event.tickets_sold / event.total_tickets) * 100)}% sold)
                                </div>
                              </>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No events found</h4>
                <p className="text-gray-600">This artist hasn't performed at any events yet.</p>
              </div>
            )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ArtistDetails; 