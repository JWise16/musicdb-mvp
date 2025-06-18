import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabaseClient';
import { VenueService } from '../../services/venueService';
import Sidebar from '../../components/layout/Sidebar';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasVenues, setHasVenues] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserVenues = async () => {
      console.log('Dashboard: checkUserVenues called', { user: user?.email, user_id: user?.id });
      if (!user) {
        console.log('Dashboard: No user, returning');
        return;
      }
      
      try {
        console.log('Dashboard: Calling VenueService.hasUserVenues');
        const hasUserVenues = await VenueService.hasUserVenues(user.id);
        console.log('Dashboard: hasUserVenues result:', hasUserVenues);
        setHasVenues(hasUserVenues);
      } catch (error) {
        console.error('Dashboard: Error checking user venues:', error);
        setHasVenues(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserVenues();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F6F6F3] flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="rounded-3xl bg-white shadow-soft p-8 min-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">Venue Dashboard</h2>
              {/* You can add a subtitle here if needed */}
            </div>
            {!isLoading && (
              hasVenues ? (
                <Link to="/add-event" className="btn-primary flex items-center gap-2 text-lg px-6 py-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Add an event
                </Link>
              ) : (
                <button 
                  onClick={() => {
                    console.log('Dashboard: Complete Verification button clicked');
                    navigate('/verification');
                  }}
                  className="btn-primary flex items-center gap-2 text-lg px-6 py-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Complete Verification
                </button>
              )
            )}
          </div>

          {/* Main Content (rest of dashboard cards, analytics, etc.) */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h2>
            <p className="text-gray-600">
              {hasVenues 
                ? "Explore your music database and discover new venues and events."
                : "Complete your venue verification to start adding events to our database."
              }
            </p>
          </div>

          {!hasVenues && !isLoading && (
            <div className="mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-blue-900">
                      Venue Verification Required
                    </h3>
                    <div className="mt-2 text-blue-800">
                      <p className="text-sm">
                        To add events to our database, you need to be associated with a venue. 
                        Click "Complete Verification" to search for your venue or create a new one.
                      </p>
                    </div>
                    <div className="mt-4">
                      <Link to="/verification" className="btn-primary">
                        Complete Verification
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="card hover:shadow-medium transition-shadow duration-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Venues</h3>
                  <p className="text-gray-600">Browse music venues</p>
                </div>
              </div>
              <div className="mt-4">
                <Link to="/venue/1" className="btn-primary w-full text-center">
                  View Venues
                </Link>
              </div>
            </div>

            <div className="card hover:shadow-medium transition-shadow duration-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Events</h3>
                  <p className="text-gray-600">Check upcoming events</p>
                </div>
              </div>
              <div className="mt-4">
                <Link to="/event/1" className="btn-primary w-full text-center">
                  View Events
                </Link>
              </div>
            </div>

            <div className="card hover:shadow-medium transition-shadow duration-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Artists</h3>
                  <p className="text-gray-600">Discover musicians</p>
                </div>
              </div>
              <div className="mt-4">
                <button className="btn-secondary w-full text-center">
                  Coming Soon
                </button>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card text-center">
              <div className="text-3xl font-bold text-accent-600 mb-2">12</div>
              <div className="text-gray-600">Active Venues</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-accent-600 mb-2">8</div>
              <div className="text-gray-600">Upcoming Events</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-accent-600 mb-2">24</div>
              <div className="text-gray-600">Featured Artists</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;