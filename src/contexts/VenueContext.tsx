import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useGetUserVenuesQuery } from '../store/api/venuesApi';
import type { Tables } from '../database.types';

interface VenueContextType {
  currentVenue: Tables<'venues'> | null;
  userVenues: Tables<'venues'>[];
  hasUserVenues: boolean;
  isLoading: boolean;
  switchVenue: (venueId: string) => Promise<void>;
  refreshVenues: () => Promise<void>;
  setCurrentVenue: (venue: Tables<'venues'> | null) => void;
}

const VenueContext = createContext<VenueContextType | undefined>(undefined);

export const useVenue = () => {
  const context = useContext(VenueContext);
  if (context === undefined) {
    throw new Error('useVenue must be used within a VenueProvider');
  }
  return context;
};

interface VenueProviderProps {
  children: ReactNode;
}

export const VenueProvider: React.FC<VenueProviderProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [currentVenue, setCurrentVenue] = useState<Tables<'venues'> | null>(null);
  
  // Use RTK Query for venue data
  const {
    data: userVenues = [],
    isLoading: venuesLoading,
    refetch: refetchVenues
  } = useGetUserVenuesQuery(user?.id || '', {
    skip: !user?.id,
  });

  const hasUserVenues = userVenues.length > 0;
  const isLoading = authLoading || venuesLoading;

  // Debug logging for auth state changes
  useEffect(() => {
    console.log('VenueContext: Auth state changed', {
      user: user?.email,
      authLoading,
      venuesLoading,
      venueCount: userVenues.length,
      timestamp: new Date().toISOString()
    });
  }, [user, authLoading, venuesLoading, userVenues.length]);

  // Set current venue when venues are loaded
  useEffect(() => {
    if (userVenues.length > 0 && !currentVenue) {
      console.log('VenueContext: Setting current venue from loaded venues', {
        venueCount: userVenues.length,
        user: user?.email
      });

      // Get current venue from localStorage or default to first venue
      const savedVenueId = localStorage.getItem('musicdb-current-venue-id');
      let venueToSet: Tables<'venues'> | null = null;

      if (savedVenueId && userVenues.find(v => v.id === savedVenueId)) {
        venueToSet = userVenues.find(v => v.id === savedVenueId) || null;
        console.log('VenueContext: Using saved venue', savedVenueId);
      } else if (userVenues.length > 0) {
        venueToSet = userVenues[0];
        localStorage.setItem('musicdb-current-venue-id', userVenues[0].id);
        console.log('VenueContext: Using first venue as default', userVenues[0].id);
      }

      setCurrentVenue(venueToSet);
    } else if (userVenues.length === 0) {
      // Clear current venue if no venues
      setCurrentVenue(null);
    }
  }, [userVenues, currentVenue, user?.email]);

  // Switch to a different venue
  const switchVenue = async (venueId: string) => {
    const venue = userVenues.find(v => v.id === venueId);
    if (venue) {
      setCurrentVenue(venue);
      localStorage.setItem('musicdb-current-venue-id', venueId);
    }
  };

  // Refresh venues list using RTK Query
  const refreshVenues = async () => {
    console.log('VenueContext: Refreshing venues via RTK Query');
    await refetchVenues();
  };

  const value: VenueContextType = {
    currentVenue,
    userVenues,
    hasUserVenues,
    isLoading,
    switchVenue,
    refreshVenues,
    setCurrentVenue
  };

  return (
    <VenueContext.Provider value={value}>
      {children}
    </VenueContext.Provider>
  );
}; 