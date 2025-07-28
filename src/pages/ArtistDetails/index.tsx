import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../../components/layout/Sidebar';
import { formatEventDate } from '../../utils/dateUtils';
import { VibrateService, type VibrateArtist, type VibrateArtistLink, type VibrateEvent, type VibrateAudienceData, type VibrateBioData, type VibrateSpotifyListenersData, type VibrateInstagramAudienceData, type VibrateTikTokAudienceData, type VibrateYouTubeAudienceData } from '../../services/vibrateService';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';

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

// Helper function to get channel styling
const getChannelStyle = (channel: string): string => {
  const styles: { [key: string]: string } = {
    spotify: 'bg-green-500 text-white',
    youtube: 'bg-red-500 text-white',
    instagram: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    facebook: 'bg-blue-600 text-white',
    twitter: 'bg-black text-white',
    tiktok: 'bg-black text-white',
    soundcloud: 'bg-orange-500 text-white',
    bandcamp: 'bg-blue-700 text-white',
    apple_music: 'bg-gray-900 text-white',
    itunes: 'bg-gray-900 text-white',
    deezer: 'bg-purple-600 text-white',
    tidal: 'bg-black text-white',
    beatport: 'bg-green-600 text-white',
    mixcloud: 'bg-blue-500 text-white',
    home_page: 'bg-gray-600 text-white',
    bandsintown: 'bg-blue-500 text-white',
    songkick: 'bg-pink-500 text-white',
    shazam: 'bg-blue-600 text-white',
    amazon_music: 'bg-blue-900 text-white',
    napster: 'bg-orange-600 text-white'
  };
  
  return styles[channel] || 'bg-gray-400 text-white';
};

// Helper function to get channel icons
const getChannelIcon = (channel: string) => {
  const iconProps = { className: "w-3 h-3", fill: "currentColor", viewBox: "0 0 24 24" };
  
  switch (channel) {
    case 'spotify':
      return <svg {...iconProps}><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.6 0-.359.24-.66.54-.719 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.242 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/></svg>;
    case 'youtube':
      return <svg {...iconProps}><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
    case 'instagram':
      return <svg {...iconProps}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>;
    case 'facebook':
      return <svg {...iconProps}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
    case 'twitter':
      return <svg {...iconProps}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
    case 'soundcloud':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path d="M17.5 10.5a3.5 3.5 0 0 1 3.5 3.5c0 1.933-1.567 3.5-3.5 3.5H6.75A3.25 3.25 0 0 1 6.7 11.5a.75.75 0 0 1 .8.75v4.25h.75v-5.5a.75.75 0 0 1 1.5 0v5.5h.75v-6.25a.75.75 0 0 1 1.5 0v6.25h.75v-7a.75.75 0 0 1 1.5 0v7h.75v-5.5a.75.75 0 0 1 1.5 0v5.5h.75v-3.5a.75.75 0 0 1 1.5 0v3.5H17.5a2 2 0 1 0 0-4z" fill="currentColor"/>
        </svg>
      );
    case 'tiktok':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path d="M21 8.306c-.638 0-1.262-.062-1.863-.182V14.5A6.5 6.5 0 1 1 12 8v2.02a4.5 4.5 0 1 0 4.5 4.48V2h2.02c.12.601.182 1.225.182 1.863 0 2.37 1.92 4.293 4.293 4.443V8.306z" fill="currentColor"/>
        </svg>
      );
    case 'bandsintown':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path d="M3 3h3v18H3V3zm5 0h3v18H8V3zm5 0h3v18h-3V3zm5 0h3v18h-3V3z" fill="currentColor"/>
        </svg>
      );
    case 'home_page':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path d="M3 12l9-9 9 9h-3v9a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-5H8v5a1 1 0 0 1-1 1H3v-9H3z" fill="currentColor"/>
        </svg>
      );
    default:
      return <svg {...iconProps}><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h.5c.28 0 .5.22.5.5s-.22.5-.5.5H7c-1.16 0-2.1.94-2.1 2.1s.94 2.1 2.1 2.1h.5c.28 0 .5.22.5.5s-.22.5-.5.5H7c-1.71 0-3.1-1.39-3.1-3.1zM14 8.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5h.5c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1H14c-.28 0-.5-.22-.5-.5s.22-.5.5-.5h.5c1.16 0 2.1-.94 2.1-2.1S15.66 9.9 14.5 9.9H14c-.28 0-.5-.22-.5-.5z"/></svg>;
  }
};

const ArtistDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<ArtistWithEvents | null>(null);
  const [vibrateArtist, setVibrateArtist] = useState<VibrateArtist | null>(null);
  const [artistLinks, setArtistLinks] = useState<VibrateArtistLink[]>([]);
  const [vibrateUpcomingEvents, setVibrateUpcomingEvents] = useState<VibrateEvent[]>([]);
  const [vibratePastEvents, setVibratePastEvents] = useState<VibrateEvent[]>([]);
  const [vibrateAudience, setVibrateAudience] = useState<VibrateAudienceData>({});
  const [vibrateBio, setVibrateBio] = useState<VibrateBioData>({ BIO: [], FAQ: [] });
  const [spotifyListeners, setSpotifyListeners] = useState<VibrateSpotifyListenersData>({ byCity: [], byCountry: {} });
  const [instagramAudience, setInstagramAudience] = useState<VibrateInstagramAudienceData>({ byCity: [], byCountry: [], byGender: {} as any, byAge: {} });
  const [tiktokAudience, setTiktokAudience] = useState<VibrateTikTokAudienceData>({ byCountry: [], byGender: {} as any, byAge: {} });
  const [youtubeAudience, setYoutubeAudience] = useState<VibrateYouTubeAudienceData>({ byCountry: {}, byGender: {} as any, byAge: {} });
  const [showAllCities, setShowAllCities] = useState(false);
  const [showAllInstagramCities, setShowAllInstagramCities] = useState(false);
  const [showAllTiktokCountries, setShowAllTiktokCountries] = useState(false);
  const [showAllYoutubeCountries, setShowAllYoutubeCountries] = useState(false);
  const [showAllAudienceCountries, setShowAllAudienceCountries] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [citiesToShow, setCitiesToShow] = useState(10);
  const [countriesToShow, setCountriesToShow] = useState(10);
  const [instagramCitiesToShow, setInstagramCitiesToShow] = useState(10);
  const [tiktokCountriesToShow, setTiktokCountriesToShow] = useState(10);
  const [upcomingEventsToShow, setUpcomingEventsToShow] = useState(5);
  const [pastEventsToShow, setPastEventsToShow] = useState(5);

  useEffect(() => {
    const loadArtistDetails = async () => {
      if (!id || !user) return;

      setIsLoading(true);
      setError(null);
      
      try {
        // Import ArtistService dynamically
        const { ArtistService } = await import('../../services/artistService');
        const artistData = await ArtistService.getArtistWithEvents(id);
        
        // If we found a local artist, use it
        if (artistData) {
          setArtist(artistData);
          
          // Fetch additional data from Viberate API using the local artist's name
          try {
            const { artist: vibrateData, links, upcomingEvents, pastEvents, audience, bio, spotifyListeners: spotifyListenersData, instagramAudience: instagramAudienceData, tiktokAudience: tiktokAudienceData, youtubeAudience: youtubeAudienceData } = await VibrateService.getArtistWithAllData(artistData.name);
            if (vibrateData) {
              setVibrateArtist(vibrateData);
              setArtistLinks(links);
              setVibrateUpcomingEvents(upcomingEvents);
              setVibratePastEvents(pastEvents);
              setVibrateAudience(audience);
              setVibrateBio(bio);
              setSpotifyListeners(spotifyListenersData);
              setInstagramAudience(instagramAudienceData);
              setTiktokAudience(tiktokAudienceData);
              setYoutubeAudience(youtubeAudienceData);
              console.log('Found Viberate data for local artist:', vibrateData);
            }
          } catch (vibrateError) {
            console.warn('Could not fetch Viberate data for local artist:', vibrateError);
          }
        } else {
          // No local artist found - this might be a Vibrate UUID from search results
          // Try to fetch directly by UUID from Vibrate API
          console.log('No local artist found, attempting to fetch Vibrate data by UUID:', id);
          
          try {
            // Get Vibrate data directly by UUID using individual method calls
            const [linksResponse, eventsResponse, audienceResponse, bioResponse, spotifyListenersResponse, instagramAudienceResponse, tiktokAudienceResponse, youtubeAudienceResponse] = await Promise.all([
              VibrateService.getArtistLinks(id),
              VibrateService.getArtistEvents(id),
              VibrateService.getArtistAudience(id),
              VibrateService.getArtistBio(id),
              VibrateService.getArtistSpotifyListeners(id),
              VibrateService.getArtistInstagramAudience(id),
              VibrateService.getArtistTikTokAudience(id),
              VibrateService.getArtistYouTubeAudience(id)
            ]);
            
            // If we got at least one successful response, we can proceed
            if (linksResponse || eventsResponse || audienceResponse || bioResponse) {
              // Create a minimal artist object from the UUID - we'll get the name from other data
              const artistName = bioResponse?.artist?.name || 'Unknown Artist';
              
              setArtist({
                id: id,
                name: artistName,
                genre: null,
                description: null,
                contact_info: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_admin_added: false,
                social_media: {},
                events: [] // No local events for external artists
              });
              
              // Get full artist data (including image) by searching with the artist name
              let fullArtistData = null;
              if (artistName !== 'Unknown Artist') {
                try {
                  const searchResponse = await VibrateService.searchArtists(artistName);
                  if (searchResponse?.artists && searchResponse.artists.length > 0) {
                    // Find the artist with matching UUID
                    fullArtistData = searchResponse.artists.find(artist => artist.uuid === id);
                    if (!fullArtistData) {
                      // If no exact UUID match, use the first result as it's likely the same artist
                      fullArtistData = searchResponse.artists[0];
                    }
                  }
                } catch (searchError) {
                  console.warn('Could not search for full artist data:', searchError);
                }
              }
              
                              // Set the full vibrate artist data if we found it (this includes the image)
                if (fullArtistData) {
                  setVibrateArtist(fullArtistData);
                  // Update the local artist genre from the full data
                  setArtist(prev => prev ? { ...prev, genre: fullArtistData?.genre?.name || null } : prev);
                }
              
              setArtistLinks(linksResponse?.links || []);
              setVibrateUpcomingEvents(eventsResponse?.upcoming || []);
              setVibratePastEvents(eventsResponse?.past || []);
              setVibrateAudience(audienceResponse?.audience || {});
              setVibrateBio(bioResponse?.bio || { BIO: [], FAQ: [] });
              setSpotifyListeners(spotifyListenersResponse?.listeners || { byCity: [], byCountry: {} });
              setInstagramAudience(instagramAudienceResponse?.audience || { byCity: [], byCountry: [], byGender: {} as any, byAge: {} });
              setTiktokAudience(tiktokAudienceResponse?.audience || { byCountry: [], byGender: {} as any, byAge: {} });
              setYoutubeAudience(youtubeAudienceResponse?.audience || { byCountry: {}, byGender: {} as any, byAge: {} });
              console.log('Found Vibrate data by UUID:', id, 'with full artist data:', !!fullArtistData);
            } else {
              setError('Artist not found');
            }
          } catch (vibrateError) {
            console.error('Could not fetch Vibrate data by UUID:', vibrateError);
            setError('Artist not found');
          }
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
                onClick={() => navigate(-1)}
                className="btn-primary"
              >
                Go Back
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Calculate dynamic YAxis width for city chart
  const getCityYAxisWidth = () => {
    const maxLabelLength = Math.max(...spotifyListeners.byCity.slice(0, citiesToShow).map(cityData => {
      const label = cityData.country_code ? `${cityData.city} (${cityData.country_code})` : cityData.city;
      return label.length;
    }), 0);
    return Math.min(160, maxLabelLength * 9);
  };

  return (
    <div className="min-h-screen bg-[#F6F6F3] flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="rounded-3xl bg-white shadow-soft p-8 min-h-[90vh]">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate(-1)}
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
              <div className="bg-white rounded-2xl shadow p-8 flex flex-col items-center gap-6 border border-gray-100">
                {/* Artist Image */}
                {vibrateArtist?.image && (
                  <img
                    src={vibrateArtist.image}
                    alt={artist.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow mb-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}

                {/* Name & Meta */}
                <div className="w-full text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{artist.name}</h1>
                  {vibrateArtist?.verified && (
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-blue-600 font-medium">Verified Artist</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {(vibrateArtist?.genre?.name || artist.genre) && (
                      <span className="px-3 py-1 bg-accent-100 text-accent-700 rounded-full text-xs">
                        {vibrateArtist?.genre?.name || artist.genre}
                      </span>
                    )}
                    {vibrateArtist?.country?.name && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        {vibrateArtist.country.name}
                      </span>
                    )}
                    {vibrateArtist?.subgenres?.slice(0, 2).map((subgenre) => (
                      <span
                        key={subgenre.id}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                      >
                        {subgenre.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Description */}
                {artist.description && (
                  <div className="w-full">
                    <div className="text-xs font-medium text-gray-500 mb-1">Description</div>
                    <p className="text-gray-800 text-sm leading-relaxed mb-2">{artist.description}</p>
                  </div>
                )}

                                 {/* Contact Info */}
                 {(artist.contact_info) && (
                   <div className="w-full">
                     <div className="text-xs font-medium text-gray-500 mb-1">Contact</div>
                     <p className="text-gray-800 text-sm mb-2">{artist.contact_info}</p>
                   </div>
                 )}

                 {/* Artist Links */}
                 {artistLinks.length > 0 && (
                   <div className="w-full">
                     <div className="text-xs font-medium text-gray-500 mb-2">Links</div>
                     <div className="flex flex-col gap-2">
                       {artistLinks
                         .filter(link => ![
                           'tidal',
                           'amazon_music',
                           'deezer',
                           'tumblr',
                           'itunes',
                           'shazam',
                           'songkick',
                           'bandcamp',
                           'napster',
                           'bandsintown',
                           'facebook'
                         ].includes(link.channel.toLowerCase()))
                         .map((link) => (
                           <a
                             key={link.channel_id}
                             href={link.link}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                           >
                             {/* Channel Icon */}
                             <div className={`w-5 h-5 rounded flex items-center justify-center ${getChannelStyle(link.channel)}`}>
                               {getChannelIcon(link.channel)}
                             </div>
                             <span className="capitalize">
                               {link.channel.toLowerCase() === 'twitter' ? 'X' : link.channel.replace('_', ' ')}
                             </span>
                           </a>
                         ))}
                     </div>
                   </div>
                 )}

                 {/* Audience % By-Country (Top 5) - moved to left column */}
                 {Object.keys(vibrateAudience).length > 0 && Array.isArray(vibrateAudience['by-country']) && vibrateAudience['by-country'].length > 0 && (
                   <div className="w-full mt-6">
                     <div className="text-xs font-medium text-gray-500 mb-2">Audience % By-Country (Top 5)</div>
                     <div className="space-y-1">
                       {(showAllAudienceCountries ? vibrateAudience['by-country'] : vibrateAudience['by-country'].slice(0, 5)).map((country: any, index: number) => (
                         <div key={country.country_code} className="flex justify-between items-center">
                           <span className="text-xs text-gray-700 flex items-center gap-1">
                             <span className="text-gray-400">#{index + 1}</span>
                             {country.country_code}
                           </span>
                           <span className="text-xs font-medium text-gray-900">
                             {country.audience_pct.toFixed(1)}%
                           </span>
                         </div>
                       ))}
                     </div>
                     {vibrateAudience['by-country'].length > 5 && (
                       <div className="text-xs text-gray-500 mt-1">
                         <button
                           className="underline text-blue-600 hover:text-blue-800 transition-colors text-xs font-medium"
                           onClick={() => setShowAllAudienceCountries(v => !v)}
                         >
                           {showAllAudienceCountries ? 'Show Top 5 Only' : `See More (${vibrateAudience['by-country'].length - 5} more)`}
                         </button>
                       </div>
                     )}
                   </div>
                 )}

                 {/* Bio Overview (moved under links, only first section) */}
                 {vibrateBio.BIO.length > 0 && (
                   <div className="w-full mt-6">
                     <div className="text-xs font-medium text-gray-500 mb-2">Biography</div>
                     <div className="space-y-4">
                       <div className="bg-gray-50 rounded-lg p-4">
                         <div className="text-sm font-semibold text-gray-900 mb-1">{vibrateBio.BIO[0].question}</div>
                         <div
                           className="text-xs text-gray-700 leading-relaxed prose prose-xs max-w-none"
                           dangerouslySetInnerHTML={{
                             __html: vibrateBio.BIO[0].answer.replace(/<br><br>/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>')
                           }}
                         />
                       </div>
                     </div>
                   </div>
                 )}
              </div>
            </div>

            {/* Right Column - Analytics and Events List */}
            <div className="lg:col-span-9">
              {/* Events Section */}
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Events</h3>
                
                {/* Local Events Section */}
                {artist.events.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <span className="inline-block w-3 h-3 bg-purple-500 rounded-full"></span>
                      Your Database Events ({artist.events.length})
                    </h4>
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
                  </div>
                )}

                {/* Vibrate Upcoming Events Section */}
                {vibrateUpcomingEvents.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <span className="inline-block w-3 h-3 bg-orange-500 rounded-full"></span>
                      Upcoming Events via Viberate 
                      {upcomingEventsToShow >= vibrateUpcomingEvents.length
                        ? ` (${vibrateUpcomingEvents.length})`
                        : ` (${upcomingEventsToShow} of ${vibrateUpcomingEvents.length})`}
                    </h4>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                                Location
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Genres
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {vibrateUpcomingEvents.slice(0, upcomingEventsToShow).map((event: VibrateEvent) => {
                            // Helper function to format date from ISO string
                            const formatVibrateDate = (dateString: string) => {
                              try {
                                const date = new Date(dateString);
                                return date.toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                });
                              } catch {
                                return dateString;
                              }
                            };

                            // Get location info (venue for events, city for festivals)
                            const getLocationInfo = () => {
                              if (event.venue) {
                                return {
                                  name: event.venue.name,
                                  city: event.venue.city.name,
                                  country: event.venue.country.name
                                };
                              } else if (event.city && event.country) {
                                return {
                                  name: 'Festival',
                                  city: event.city.name,
                                  country: event.country.name
                                };
                              }
                              return { name: 'TBA', city: '', country: '' };
                            };

                            const location = getLocationInfo();

                            return (
                              <tr
                                key={`vibrate-upcoming-${event.uuid}`}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {event.name}
                                  </div>
                                  {event.image && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Has image
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {formatVibrateDate(event.start)}
                                  </div>
                                  {event.end && (
                                    <div className="text-xs text-gray-500">
                                      - {formatVibrateDate(event.end)}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {location.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {location.city}{location.country && `, ${location.country}`}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    event.type === 'event' ? 'bg-blue-100 text-blue-700' :
                                    'bg-purple-100 text-purple-700'
                                  }`}>
                                    {event.type}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {event.genres?.[0]?.name || event.subgenres?.[0]?.name || 'N/A'}
                                  </div>
                                  {event.subgenres && event.subgenres.length > 0 && (
                                    <div className="text-xs text-gray-500">
                                      {event.subgenres.slice(0, 2).map((sg: any) => sg.name).join(', ')}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {vibrateUpcomingEvents.length > 5 && (
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (upcomingEventsToShow >= vibrateUpcomingEvents.length) {
                                setUpcomingEventsToShow(5);
                              } else {
                                setUpcomingEventsToShow(Math.min(upcomingEventsToShow + 5, vibrateUpcomingEvents.length));
                              }
                            }}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                          >
                            {upcomingEventsToShow >= vibrateUpcomingEvents.length
                              ? 'Show First 5 Only'
                              : `Show ${Math.min(5, vibrateUpcomingEvents.length - upcomingEventsToShow)} More Events`}
                          </button>
                          {upcomingEventsToShow > 5 && (
                            <button
                              onClick={() => setUpcomingEventsToShow(5)}
                              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            >
                              Show Less
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  </div>
                )}

                {/* Vibrate Past Events Section */}
                {vibratePastEvents.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <span className="inline-block w-3 h-3 bg-gray-500 rounded-full"></span>
                      Past Events via Viberate 
                      {pastEventsToShow >= vibratePastEvents.length
                        ? ` (${vibratePastEvents.length})`
                        : ` (${pastEventsToShow} of ${vibratePastEvents.length})`}
                    </h4>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                                Location
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {vibratePastEvents.slice(0, pastEventsToShow).map((event: VibrateEvent) => {
                            // Helper function to format date from ISO string
                            const formatVibrateDate = (dateString: string) => {
                              try {
                                const date = new Date(dateString);
                                return date.toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                });
                              } catch {
                                return dateString;
                              }
                            };

                            // Get location info (venue for events, city for festivals)
                            const getLocationInfo = () => {
                              if (event.venue) {
                                return {
                                  name: event.venue.name,
                                  city: event.venue.city.name,
                                  country: event.venue.country.name
                                };
                              } else if (event.city && event.country) {
                                return {
                                  name: 'Festival',
                                  city: event.city.name,
                                  country: event.country.name
                                };
                              }
                              return { name: 'TBA', city: '', country: '' };
                            };

                            const location = getLocationInfo();

                            return (
                              <tr
                                key={`vibrate-past-${event.uuid}`}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {event.name}
                                  </div>
                                  {event.image && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Has image
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {formatVibrateDate(event.start)}
                                  </div>
                                  {event.end && (
                                    <div className="text-xs text-gray-500">
                                      - {formatVibrateDate(event.end)}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {location.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {location.city}{location.country && `, ${location.country}`}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {vibratePastEvents.length > 5 && (
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (pastEventsToShow >= vibratePastEvents.length) {
                                setPastEventsToShow(5);
                              } else {
                                setPastEventsToShow(Math.min(pastEventsToShow + 5, vibratePastEvents.length));
                              }
                            }}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                          >
                            {pastEventsToShow >= vibratePastEvents.length
                              ? 'Show First 5 Only'
                              : `Show ${Math.min(5, vibratePastEvents.length - pastEventsToShow)} More Events`}
                          </button>
                          {pastEventsToShow > 5 && (
                            <button
                              onClick={() => setPastEventsToShow(5)}
                              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            >
                              Show Less
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  </div>
                )}
              {/* --- BEGIN: Analytics Sections (moved above events) --- */}
              {/* Spotify Listeners by City */}
              {spotifyListeners.byCity.length > 0 && (
                <div className="w-full">
                  <div className="text-base font-medium text-black mb-2">
                    Spotify Listeners by City
                    {citiesToShow >= spotifyListeners.byCity.length
                      ? ` (${spotifyListeners.byCity.length} cities)`
                      : `(Top ${citiesToShow} of ${spotifyListeners.byCity.length})`}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <div className="w-full flex justify-start">
                      <ResponsiveContainer width="100%" height={citiesToShow * 40}>
                          <BarChart
                            data={spotifyListeners.byCity
                              .slice(0, citiesToShow)
                              .map(cityData => ({
                                name: cityData.country_code ? `${cityData.city} (${cityData.country_code})` : cityData.city,
                                listeners: cityData.listeners_1m
                              }))}
                            layout="vertical"
                            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                          >
                            <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <YAxis
                              dataKey="name"
                              type="category"
                              tick={{ fontSize: 12, fill: '#6B7280' }}
                              width={getCityYAxisWidth()}
                              interval={0}
                              tickFormatter={name => name.length > 20 ? name.slice(0, 18) + '…' : name}
                            />
                            <Tooltip formatter={value => value.toLocaleString()} cursor={{ fill: '#e5e7eb', opacity: 0.2 }} />
                            <Bar dataKey="listeners" fill="#1DB954" radius={[4, 4, 4, 4]} />
                          </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                      Total: {spotifyListeners.byCity.reduce((sum, city) => sum + city.listeners_1m, 0).toLocaleString()} monthly listeners
                    </div>
                    {spotifyListeners.byCity.length > 10 && (
                      <div className="mt-3 flex flex-row gap-2">
                        <button
                          style={{ width: '50%' }}
                          onClick={() => {
                            if (citiesToShow >= spotifyListeners.byCity.length) {
                              setCitiesToShow(10);
                            } else {
                              setCitiesToShow(Math.min(citiesToShow + 10, spotifyListeners.byCity.length));
                            }
                          }}
                          className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                          {citiesToShow >= spotifyListeners.byCity.length
                            ? 'Show Top 10 Only'
                            : `See 10 More Cities`}
                        </button>
                        {citiesToShow > 10 && (
                          <button
                            style={{ width: '50%' }}
                            onClick={() => setCitiesToShow(10)}
                            className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                          >
                            See Less Cities
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}


              {instagramAudience.byCity.length > 0 && (
                <div className="w-full">
                  <div className="text-base font-medium text-black mb-2 mt-8">
                    Instagram Audience by City
                    {instagramCitiesToShow >= instagramAudience.byCity.length
                      ? ` (${instagramAudience.byCity.length} cities)`
                      : `(Top ${instagramCitiesToShow} of ${instagramAudience.byCity.length})`}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm" style={{ height: instagramCitiesToShow * 40 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={instagramAudience.byCity
                          .slice(0, instagramCitiesToShow)
                          .map(cityData => ({
                            name: cityData.country_code ? `${cityData.city} (${cityData.country_code})` : cityData.city,
                            followers: cityData.instagram_followers
                          }))}
                        layout="vertical"
                        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                      >
                        <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tick={{ fontSize: 12, fill: '#6B7280' }}
                          width={(() => {
                            const maxLabelLength = Math.max(...instagramAudience.byCity.slice(0, instagramCitiesToShow).map(cityData => {
                              const label = cityData.country_code ? `${cityData.city} (${cityData.country_code})` : cityData.city;
                              return label.length;
                            }), 0);
                            return Math.min(160, maxLabelLength * 9);
                          })()}
                          interval={0}
                          tickFormatter={name => name.length > 20 ? name.slice(0, 18) + '…' : name}
                        />
                        <Tooltip formatter={value => value.toLocaleString()} cursor={{ fill: '#e5e7eb', opacity: 0.2 }} />
                        <Bar dataKey="followers" fill="#E1306C" radius={[4, 4, 4, 4]} />
                      </BarChart>
                    </ResponsiveContainer>
                    {instagramAudience.byCity.length > 10 && (
                      <div className="mt-3 flex flex-row gap-2">
                        <button
                          style={{ width: '50%' }}
                          onClick={() => {
                            if (instagramCitiesToShow >= instagramAudience.byCity.length) {
                              setInstagramCitiesToShow(10);
                            } else {
                              setInstagramCitiesToShow(Math.min(instagramCitiesToShow + 10, instagramAudience.byCity.length));
                            }
                          }}
                          className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                          {instagramCitiesToShow >= instagramAudience.byCity.length
                            ? 'Show Top 10 Only'
                            : `See 10 More Cities`}
                        </button>
                        {instagramCitiesToShow > 10 && (
                          <button
                            style={{ width: '50%' }}
                            onClick={() => setInstagramCitiesToShow(10)}
                            className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                          >
                            See Less Cities
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {Object.keys(instagramAudience.byGender).length > 0 && Object.keys(instagramAudience.byAge).length > 0 ? (
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Gender Distribution */}
                  <div className="w-full flex-1">
                    <div className="text-base font-medium text-black mb-2 mt-14">Instagram Gender Distribution</div>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm flex items-center justify-center pt-4" style={{ height: Math.max(320, Object.keys(instagramAudience.byAge).length * 48) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries(instagramAudience.byGender).map(([gender, data]) => ({
                              name: gender.charAt(0).toUpperCase() + gender.slice(1),
                              value: data.pct,
                            }))}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="60%"
                            outerRadius={75}
                          >
                            {Object.entries(instagramAudience.byGender).map(([gender], idx) => (
                              <Cell
                                key={gender}
                                fill={gender === 'male' ? '#3B82F6' : gender === 'female' ? '#EC4899' : '#A3A3A3'}
                              />
                            ))}
                          </Pie>
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            content={() => {
                              const data = Object.entries(instagramAudience.byGender).map(([gender, d]) => ({
                                name: gender.charAt(0).toUpperCase() + gender.slice(1),
                                value: d.pct
                              }));
                              return (
                                <ul className="flex justify-center gap-6 mt-4">
                                  {data.map((entry, idx) => (
                                    <li key={entry.name} className="flex items-center gap-2 text-sm">
                                      <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: idx === 0 ? '#3B82F6' : idx === 1 ? '#EC4899' : '#A3A3A3' }}></span>
                                      <span>{entry.name}: {entry.value.toFixed(1)}%</span>
                                    </li>
                                  ))}
                                </ul>
                              );
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  {/* Age Distribution */}
                  <div className="w-full flex-1 mt-8 lg:mt-0">
                    <div className="text-base font-medium text-black mb-2 mt-8 lg:mt-14">Instagram Age Distribution</div>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm" style={{ height: Math.max(320, Object.keys(instagramAudience.byAge).length * 48) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={Object.entries(instagramAudience.byAge)
                            .filter(([, data]) => (data.male.total + data.female.total) > 0)
                            .sort(([a, b]) => {
                              const getAgeOrder = (age: string) => {
                                if (age === '13-17') return 1;
                                if (age === '18-24') return 2;
                                if (age === '25-34') return 3;
                                if (age === '35-44') return 4;
                                if (age === '45-64') return 5;
                                if (age === '65-') return 6;
                                return 7;
                              };
                              return getAgeOrder(String(a)) - getAgeOrder(String(b));
                            })
                            .map(([ageGroup, data]) => ({
                              age: ageGroup,
                              Male: data.male.pct,
                              Female: data.female.pct
                            }))}
                          layout="vertical"
                          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                        >
                          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={v => `${v}%`} />
                          <YAxis dataKey="age" type="category" tick={{ fontSize: 12, fill: '#6B7280' }} width={80} interval={0} />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const male = payload.find(p => p.dataKey === 'Male')?.value || 0;
                                const female = payload.find(p => p.dataKey === 'Female')?.value || 0;
                                const total = Number(male) + Number(female);
                                return (
                                  <div className="bg-white p-3 rounded shadow text-xs text-gray-900">
                                    <div className="font-semibold mb-1">{label}</div>
                                    <div><span className="font-medium text-blue-600">Male:</span> {Number(male).toFixed(1)}%</div>
                                    <div><span className="font-medium text-pink-600">Female:</span> {Number(female).toFixed(1)}%</div>
                                    <div className="mt-1 font-semibold">Total: {total.toFixed(1)}%</div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="Male" stackId="a" fill="#3B82F6" />
                          <Bar dataKey="Female" stackId="a" fill="#EC4899" />
                          <Legend verticalAlign="bottom" height={36} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Fallback: render as before if only one is present */}
                  {Object.keys(instagramAudience.byGender).length > 0 && (
                    <div className="w-full">
                      <div className="text-base font-medium text-black mb-2 mt-14">Instagram Gender Distribution</div>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm flex items-center justify-center pt-4" style={{ height: 320 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={Object.entries(instagramAudience.byGender).map(([gender, data]) => ({
                                name: gender.charAt(0).toUpperCase() + gender.slice(1),
                                value: data.pct,
                              }))}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="60%"
                              outerRadius={75}
                            >
                              {Object.entries(instagramAudience.byGender).map(([gender], idx) => (
                                <Cell
                                  key={gender}
                                  fill={gender === 'male' ? '#3B82F6' : gender === 'female' ? '#EC4899' : '#A3A3A3'}
                                />
                              ))}
                            </Pie>
                            <Legend
                              verticalAlign="bottom"
                              height={36}
                              content={() => {
                                const data = Object.entries(instagramAudience.byGender).map(([gender, d]) => ({
                                  name: gender.charAt(0).toUpperCase() + gender.slice(1),
                                  value: d.pct
                                }));
                                return (
                                  <ul className="flex justify-center gap-6 mt-4">
                                    {data.map((entry, idx) => (
                                      <li key={entry.name} className="flex items-center gap-2 text-sm">
                                        <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: idx === 0 ? '#3B82F6' : idx === 1 ? '#EC4899' : '#A3A3A3' }}></span>
                                        <span>{entry.name}: {entry.value.toFixed(1)}%</span>
                                      </li>
                                    ))}
                                  </ul>
                                );
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                  {Object.keys(instagramAudience.byAge).length > 0 && (
                    <div className="w-full">
                      <div className="text-base font-medium text-black mb-2 mt-8">Instagram Age Distribution</div>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm" style={{ height: Math.max(320, Object.keys(instagramAudience.byAge).length * 48) }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={Object.entries(instagramAudience.byAge)
                              .filter(([, data]) => (data.male.total + data.female.total) > 0)
                              .sort(([a, b]) => {
                                const getAgeOrder = (age: string) => {
                                  if (age === '13-17') return 1;
                                  if (age === '18-24') return 2;
                                  if (age === '25-34') return 3;
                                  if (age === '35-44') return 4;
                                  if (age === '45-64') return 5;
                                  if (age === '65-') return 6;
                                  return 7;
                                };
                                return getAgeOrder(String(a)) - getAgeOrder(String(b));
                              })
                              .map(([ageGroup, data]) => ({
                                age: ageGroup,
                                Male: data.male.pct,
                                Female: data.female.pct
                              }))}
                            layout="vertical"
                            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                          >
                            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={v => `${v}%`} />
                            <YAxis dataKey="age" type="category" tick={{ fontSize: 12, fill: '#6B7280' }} width={80} interval={0} />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  const male = payload.find(p => p.dataKey === 'Male')?.value || 0;
                                  const female = payload.find(p => p.dataKey === 'Female')?.value || 0;
                                  const total = Number(male) + Number(female);
                                  return (
                                    <div className="bg-white p-3 rounded shadow text-xs text-gray-900">
                                      <div className="font-semibold mb-1">{label}</div>
                                      <div><span className="font-medium text-blue-600">Male:</span> {Number(male).toFixed(1)}%</div>
                                      <div><span className="font-medium text-pink-600">Female:</span> {Number(female).toFixed(1)}%</div>
                                      <div className="mt-1 font-semibold">Total: {total.toFixed(1)}%</div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="Male" stackId="a" fill="#3B82F6" />
                            <Bar dataKey="Female" stackId="a" fill="#EC4899" />
                            <Legend verticalAlign="bottom" height={36} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </>
              )}

              {Object.keys(tiktokAudience.byGender).length > 0 && Object.keys(tiktokAudience.byAge).length > 0 ? (
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Gender Distribution */}
                  <div className="w-full flex-1">
                    <div className="text-base font-medium text-black mb-2 mt-14">TikTok Gender Distribution</div>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm flex items-center justify-center pt-4" style={{ height: Math.max(320, Object.keys(tiktokAudience.byAge).length * 48) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries(tiktokAudience.byGender).map(([gender, data]) => ({
                              name: gender.charAt(0).toUpperCase() + gender.slice(1),
                              value: data.pct,
                            }))}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="60%"
                            outerRadius={75}
                          >
                            {Object.entries(tiktokAudience.byGender).map(([gender], idx) => (
                              <Cell
                                key={gender}
                                fill={gender === 'male' ? '#3B82F6' : gender === 'female' ? '#EC4899' : '#A3A3A3'}
                              />
                            ))}
                          </Pie>
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            content={() => {
                              const data = Object.entries(tiktokAudience.byGender).map(([gender, d]) => ({
                                name: gender.charAt(0).toUpperCase() + gender.slice(1),
                                value: d.pct
                              }));
                              return (
                                <ul className="flex justify-center gap-6 mt-4">
                                  {data.map((entry, idx) => (
                                    <li key={entry.name} className="flex items-center gap-2 text-sm">
                                      <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: idx === 0 ? '#3B82F6' : idx === 1 ? '#EC4899' : '#A3A3A3' }}></span>
                                      <span>{entry.name}: {entry.value.toFixed(1)}%</span>
                                    </li>
                                  ))}
                                </ul>
                              );
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  {/* Age Distribution */}
                  <div className="w-full flex-1 mt-8 lg:mt-0">
                    <div className="text-base font-medium text-black mb-2 mt-8 lg:mt-14">TikTok Age Distribution</div>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm" style={{ height: Math.max(320, Object.keys(tiktokAudience.byAge).length * 48) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={Object.entries(tiktokAudience.byAge)
                            .filter(([, data]) => (data.male.total + data.female.total) > 0)
                            .sort(([a, b]) => {
                              const getAgeOrder = (age: string) => {
                                if (age === '13-17') return 1;
                                if (age === '18-24') return 2;
                                if (age === '25-34') return 3;
                                if (age === '35-44') return 4;
                                if (age === '45-64') return 5;
                                if (age === '65-') return 6;
                                return 7;
                              };
                              return getAgeOrder(String(a)) - getAgeOrder(String(b));
                            })
                            .map(([ageGroup, data]) => ({
                              age: ageGroup,
                              Male: data.male.pct,
                              Female: data.female.pct
                            }))}
                          layout="vertical"
                          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                        >
                          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={v => `${v}%`} />
                          <YAxis dataKey="age" type="category" tick={{ fontSize: 12, fill: '#6B7280' }} width={80} interval={0} />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const male = payload.find(p => p.dataKey === 'Male')?.value || 0;
                                const female = payload.find(p => p.dataKey === 'Female')?.value || 0;
                                const total = Number(male) + Number(female);
                                return (
                                  <div className="bg-white p-3 rounded shadow text-xs text-gray-900">
                                    <div className="font-semibold mb-1">{label}</div>
                                    <div><span className="font-medium text-blue-600">Male:</span> {Number(male).toFixed(1)}%</div>
                                    <div><span className="font-medium text-pink-600">Female:</span> {Number(female).toFixed(1)}%</div>
                                    <div className="mt-1 font-semibold">Total: {total.toFixed(1)}%</div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="Male" stackId="a" fill="#3B82F6" />
                          <Bar dataKey="Female" stackId="a" fill="#EC4899" />
                          <Legend verticalAlign="bottom" height={36} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Fallback: render as before if only one is present */}
                  {Object.keys(tiktokAudience.byGender).length > 0 && (
                    <div className="w-full">
                      <div className="text-base font-medium text-black mb-2 mt-14">TikTok Gender Distribution</div>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm flex items-center justify-center pt-4" style={{ height: 320 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={Object.entries(tiktokAudience.byGender).map(([gender, data]) => ({
                                name: gender.charAt(0).toUpperCase() + gender.slice(1),
                                value: data.pct,
                              }))}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="60%"
                              outerRadius={75}
                            >
                              {Object.entries(tiktokAudience.byGender).map(([gender], idx) => (
                                <Cell
                                  key={gender}
                                  fill={gender === 'male' ? '#3B82F6' : gender === 'female' ? '#EC4899' : '#A3A3A3'}
                                />
                              ))}
                            </Pie>
                            <Legend
                              verticalAlign="bottom"
                              height={36}
                              content={() => {
                                const data = Object.entries(tiktokAudience.byGender).map(([gender, d]) => ({
                                  name: gender.charAt(0).toUpperCase() + gender.slice(1),
                                  value: d.pct
                                }));
                                return (
                                  <ul className="flex justify-center gap-6 mt-4">
                                    {data.map((entry, idx) => (
                                      <li key={entry.name} className="flex items-center gap-2 text-sm">
                                        <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: idx === 0 ? '#3B82F6' : idx === 1 ? '#EC4899' : '#A3A3A3' }}></span>
                                        <span>{entry.name}: {entry.value.toFixed(1)}%</span>
                                      </li>
                                    ))}
                                  </ul>
                                );
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                  {Object.keys(tiktokAudience.byAge).length > 0 && (
                    <div className="w-full">
                      <div className="text-base font-medium text-black mb-2 mt-8">TikTok Age Distribution</div>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm" style={{ height: Math.max(320, Object.keys(tiktokAudience.byAge).length * 48) }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={Object.entries(tiktokAudience.byAge)
                              .filter(([, data]) => (data.male.total + data.female.total) > 0)
                              .sort(([a, b]) => {
                                const getAgeOrder = (age: string) => {
                                  if (age === '13-17') return 1;
                                  if (age === '18-24') return 2;
                                  if (age === '25-34') return 3;
                                  if (age === '35-44') return 4;
                                  if (age === '45-64') return 5;
                                  if (age === '65-') return 6;
                                  return 7;
                                };
                                return getAgeOrder(String(a)) - getAgeOrder(String(b));
                              })
                              .map(([ageGroup, data]) => ({
                                age: ageGroup,
                                Male: data.male.pct,
                                Female: data.female.pct
                              }))}
                            layout="vertical"
                            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                          >
                            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={v => `${v}%`} />
                            <YAxis dataKey="age" type="category" tick={{ fontSize: 12, fill: '#6B7280' }} width={80} interval={0} />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  const male = payload.find(p => p.dataKey === 'Male')?.value || 0;
                                  const female = payload.find(p => p.dataKey === 'Female')?.value || 0;
                                  const total = Number(male) + Number(female);
                                  return (
                                    <div className="bg-white p-3 rounded shadow text-xs text-gray-900">
                                      <div className="font-semibold mb-1">{label}</div>
                                      <div><span className="font-medium text-blue-600">Male:</span> {Number(male).toFixed(1)}%</div>
                                      <div><span className="font-medium text-pink-600">Female:</span> {Number(female).toFixed(1)}%</div>
                                      <div className="mt-1 font-semibold">Total: {total.toFixed(1)}%</div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="Male" stackId="a" fill="#3B82F6" />
                            <Bar dataKey="Female" stackId="a" fill="#EC4899" />
                            <Legend verticalAlign="bottom" height={36} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </>
              )}

              {Object.keys(youtubeAudience.byGender).length > 0 && Object.keys(youtubeAudience.byAge).length > 0 ? (
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Gender Distribution */}
                  <div className="w-full flex-1">
                    <div className="text-base font-medium text-black mb-2 mt-14">YouTube Gender Distribution</div>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm flex items-center justify-center pt-4" style={{ height: Math.max(320, Object.keys(youtubeAudience.byAge).length * 48) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries(youtubeAudience.byGender).map(([gender, data]) => ({
                              name: gender.charAt(0).toUpperCase() + gender.slice(1),
                              value: data.pct,
                            }))}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="60%"
                            outerRadius={75}
                          >
                            {Object.entries(youtubeAudience.byGender).map(([gender], idx) => (
                              <Cell
                                key={gender}
                                fill={gender === 'male' ? '#3B82F6' : gender === 'female' ? '#EC4899' : '#A3A3A3'}
                              />
                            ))}
                          </Pie>
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            content={() => {
                              const data = Object.entries(youtubeAudience.byGender).map(([gender, d]) => ({
                                name: gender.charAt(0).toUpperCase() + gender.slice(1),
                                value: d.pct
                              }));
                              return (
                                <ul className="flex justify-center gap-6 mt-4">
                                  {data.map((entry, idx) => (
                                    <li key={entry.name} className="flex items-center gap-2 text-sm">
                                      <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: idx === 0 ? '#3B82F6' : idx === 1 ? '#EC4899' : '#A3A3A3' }}></span>
                                      <span>{entry.name}: {entry.value.toFixed(1)}%</span>
                                    </li>
                                  ))}
                                </ul>
                              );
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  {/* Age Distribution */}
                  <div className="w-full flex-1 mt-8 lg:mt-0">
                    <div className="text-base font-medium text-black mb-2 mt-8 lg:mt-14">YouTube Age Distribution</div>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm" style={{ height: Math.max(320, Object.keys(youtubeAudience.byAge).length * 48) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={Object.entries(youtubeAudience.byAge)
                            .filter(([, data]) => (data.male.total + data.female.total) > 0)
                            .sort(([a, b]) => {
                              const getAgeOrder = (age: string) => {
                                if (age === '13-17') return 1;
                                if (age === '18-24') return 2;
                                if (age === '25-34') return 3;
                                if (age === '35-44') return 4;
                                if (age === '45-64') return 5;
                                if (age === '65-') return 6;
                                return 7;
                              };
                              return getAgeOrder(String(a)) - getAgeOrder(String(b));
                            })
                            .map(([ageGroup, data]) => ({
                              age: ageGroup,
                              Male: data.male.pct,
                              Female: data.female.pct
                            }))}
                          layout="vertical"
                          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                        >
                          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={v => `${v}%`} />
                          <YAxis dataKey="age" type="category" tick={{ fontSize: 12, fill: '#6B7280' }} width={80} interval={0} />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const male = payload.find(p => p.dataKey === 'Male')?.value || 0;
                                const female = payload.find(p => p.dataKey === 'Female')?.value || 0;
                                const total = Number(male) + Number(female);
                                return (
                                  <div className="bg-white p-3 rounded shadow text-xs text-gray-900">
                                    <div className="font-semibold mb-1">{label}</div>
                                    <div><span className="font-medium text-blue-600">Male:</span> {Number(male).toFixed(1)}%</div>
                                    <div><span className="font-medium text-pink-600">Female:</span> {Number(female).toFixed(1)}%</div>
                                    <div className="mt-1 font-semibold">Total: {total.toFixed(1)}%</div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="Male" stackId="a" fill="#3B82F6" />
                          <Bar dataKey="Female" stackId="a" fill="#EC4899" />
                          <Legend verticalAlign="bottom" height={36} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Fallback: render as before if only one is present */}
                  {Object.keys(youtubeAudience.byGender).length > 0 && (
                    <div className="w-full">
                      <div className="text-base font-medium text-black mb-2 mt-8">YouTube Gender Distribution</div>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm flex items-center justify-center pt-4" style={{ height: 320 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={Object.entries(youtubeAudience.byGender).map(([gender, data]) => ({
                                name: gender.charAt(0).toUpperCase() + gender.slice(1),
                                value: data.pct,
                              }))}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="60%"
                              outerRadius={75}
                            >
                              {Object.entries(youtubeAudience.byGender).map(([gender], idx) => (
                                <Cell
                                  key={gender}
                                  fill={gender === 'male' ? '#3B82F6' : gender === 'female' ? '#EC4899' : '#A3A3A3'}
                                />
                              ))}
                            </Pie>
                            <Legend
                              verticalAlign="bottom"
                              height={36}
                              content={() => {
                                const data = Object.entries(youtubeAudience.byGender).map(([gender, d]) => ({
                                  name: gender.charAt(0).toUpperCase() + gender.slice(1),
                                  value: d.pct
                                }));
                                return (
                                  <ul className="flex justify-center gap-6 mt-4">
                                    {data.map((entry, idx) => (
                                      <li key={entry.name} className="flex items-center gap-2 text-sm">
                                        <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: idx === 0 ? '#3B82F6' : idx === 1 ? '#EC4899' : '#A3A3A3' }}></span>
                                        <span>{entry.name}: {entry.value.toFixed(1)}%</span>
                                      </li>
                                    ))}
                                  </ul>
                                );
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                  {Object.keys(youtubeAudience.byAge).length > 0 && (
                    <div className="w-full">
                      <div className="text-base font-medium text-black mb-2 mt-8">YouTube Age Distribution</div>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm" style={{ height: Math.max(320, Object.keys(youtubeAudience.byAge).length * 48) }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={Object.entries(youtubeAudience.byAge)
                              .filter(([, data]) => (data.male.total + data.female.total) > 0)
                              .sort(([a, b]) => {
                                const getAgeOrder = (age: string) => {
                                  if (age === '13-17') return 1;
                                  if (age === '18-24') return 2;
                                  if (age === '25-34') return 3;
                                  if (age === '35-44') return 4;
                                  if (age === '45-64') return 5;
                                  if (age === '65-') return 6;
                                  return 7;
                                };
                                return getAgeOrder(String(a)) - getAgeOrder(String(b));
                              })
                              .map(([ageGroup, data]) => ({
                                age: ageGroup,
                                Male: data.male.pct,
                                Female: data.female.pct
                              }))}
                            layout="vertical"
                            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                          >
                            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={v => `${v}%`} />
                            <YAxis dataKey="age" type="category" tick={{ fontSize: 12, fill: '#6B7280' }} width={80} interval={0} />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  const male = payload.find(p => p.dataKey === 'Male')?.value || 0;
                                  const female = payload.find(p => p.dataKey === 'Female')?.value || 0;
                                  const total = Number(male) + Number(female);
                                  return (
                                    <div className="bg-white p-3 rounded shadow text-xs text-gray-900">
                                      <div className="font-semibold mb-1">{label}</div>
                                      <div><span className="font-medium text-blue-600">Male:</span> {Number(male).toFixed(1)}%</div>
                                      <div><span className="font-medium text-pink-600">Female:</span> {Number(female).toFixed(1)}%</div>
                                      <div className="mt-1 font-semibold">Total: {total.toFixed(1)}%</div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="Male" stackId="a" fill="#3B82F6" />
                            <Bar dataKey="Female" stackId="a" fill="#EC4899" />
                            <Legend verticalAlign="bottom" height={36} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </>
              )}
              {/* --- END: Analytics Sections --- */}

              <div className="card p-6">

                {/* Artist Bio Section */}
                {(vibrateBio.BIO.length > 0 || vibrateBio.FAQ.length > 0) && (
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Artist Bio & Information</h3>

                    {/* FAQ Section */}
                    {vibrateBio.FAQ.length > 0 && (
                      <div className="mb-8">
                        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                          <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                          Frequently Asked Questions
                        </h4>
                        <div className="space-y-4">
                          {vibrateBio.FAQ.slice(0, 10).map((item, index) => (
                            <details key={index} className="bg-white border border-gray-200 rounded-lg">
                              <summary className="px-4 py-3 cursor-pointer hover:bg-gray-50 font-medium text-gray-900 text-sm">
                                {item.question}
                              </summary>
                              <div className="px-4 pb-3 text-sm text-gray-700 leading-relaxed border-t border-gray-100 pt-3">
                                {item.answer}
                              </div>
                            </details>
                          ))}
                          {vibrateBio.FAQ.length > 10 && (
                            <div className="text-center">
                              <p className="text-sm text-gray-500">
                                Showing 10 of {vibrateBio.FAQ.length} questions
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* No Events Message */}
                {artist.events.length === 0 && vibrateUpcomingEvents.length === 0 && vibratePastEvents.length === 0 && (
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