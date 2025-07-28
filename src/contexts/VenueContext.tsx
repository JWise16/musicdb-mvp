import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { VenueService } from '../services/venueService';
import type { Tables } from '../types/database.types';

interface VenueContextType {
  currentVenue: Tables<'venues'> | null;
  userVenues: Tables<'venues'>[];
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
  const [userVenues, setUserVenues] = useState<Tables<'venues'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user venues and set current venue
  const loadVenues = useCallback(async () => {
    // Don't load venues if auth is still loading or if there's no user
    if (authLoading || !user) {
      setUserVenues([]);
      setCurrentVenue(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const venues = await VenueService.getUserVenues(user.id);
      setUserVenues(venues);

      // Get current venue from localStorage or default to first venue
      const savedVenueId = localStorage.getItem('musicdb-current-venue-id');
      let venueToSet: Tables<'venues'> | null = null;

      if (savedVenueId && venues.find(v => v.id === savedVenueId)) {
        venueToSet = venues.find(v => v.id === savedVenueId) || null;
      } else if (venues.length > 0) {
        venueToSet = venues[0];
        localStorage.setItem('musicdb-current-venue-id', venues[0].id);
      }

      setCurrentVenue(venueToSet);
    } catch (error) {
      console.error('Error loading venues:', error);
      setUserVenues([]);
      setCurrentVenue(null);
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, user]);

  // Switch to a different venue
  const switchVenue = async (venueId: string) => {
    const venue = userVenues.find(v => v.id === venueId);
    if (venue) {
      setCurrentVenue(venue);
      localStorage.setItem('musicdb-current-venue-id', venueId);
    }
  };

  // Refresh venues list
  const refreshVenues = async () => {
    await loadVenues();
  };

  // Load venues when user changes or auth loading completes
  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  const value: VenueContextType = {
    currentVenue,
    userVenues,
    isLoading: authLoading || isLoading,
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