import type { EventWithDetails, EventFilters } from '../../services/eventService';

/**
 * Client-side filtering utility for events
 * This allows us to cache all events and filter them locally,
 * eliminating the need for repeated API calls
 */

export const filterEventsLocally = (
  events: EventWithDetails[],
  filters: EventFilters
): EventWithDetails[] => {
  let filteredEvents = [...events];

  // Search query filter
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filteredEvents = filteredEvents.filter(event => {
      // Search in venue name
      const venueMatch = event.venues?.name?.toLowerCase().includes(query);
      
      // Search in artist names
      const artistMatch = event.event_artists?.some(ea => 
        ea.artists?.name?.toLowerCase().includes(query)
      );
      
      // Search in event name
      const eventMatch = event.name?.toLowerCase().includes(query);
      
      return venueMatch || artistMatch || eventMatch;
    });
  }

  // Genre filter
  if (filters.genre) {
    filteredEvents = filteredEvents.filter(event =>
      event.event_artists?.some(ea => ea.artists?.genre === filters.genre)
    );
  }

  // City filter
  if (filters.city) {
    filteredEvents = filteredEvents.filter(event =>
      event.venues?.location === filters.city
    );
  }

  // Venue size range filter
  if (filters.venueSizeRange) {
    const [min, max] = filters.venueSizeRange;
    filteredEvents = filteredEvents.filter(event => {
      const capacity = event.venues?.capacity;
      return capacity !== null && capacity !== undefined && capacity >= min && capacity <= max;
    });
  }

  // Percentage sold range filter
  if (filters.percentageSoldRange) {
    const [min, max] = filters.percentageSoldRange;
    filteredEvents = filteredEvents.filter(event => {
      const percentSold = event.percentage_sold;
      return percentSold >= min && percentSold <= max;
    });
  }

  // Date range filters
  if (filters.dateFrom || filters.dateTo) {
    filteredEvents = filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        if (eventDate < fromDate) return false;
      }
      
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        if (eventDate > toDate) return false;
      }
      
      return true;
    });
  }

  // Time frame filter (past/upcoming/all)
  if (filters.timeFrame && filters.timeFrame !== 'all') {
    const now = new Date();
    filteredEvents = filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      
      if (filters.timeFrame === 'past') {
        return eventDate < now;
      } else if (filters.timeFrame === 'upcoming') {
        return eventDate >= now;
      }
      
      return true;
    });
  }

  // Sorting
  if (filters.sortBy) {
    filteredEvents.sort((a, b) => {
      switch (filters.sortBy) {
        case 'date_asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'date_desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'percent_sold_desc':
          return b.percentage_sold - a.percentage_sold;
        case 'percent_sold_asc':
          return a.percentage_sold - b.percentage_sold;
        case 'capacity_desc':
          return (b.venues?.capacity || 0) - (a.venues?.capacity || 0);
        case 'capacity_asc':
          return (a.venues?.capacity || 0) - (b.venues?.capacity || 0);
        case 'price_desc':
          return (b.ticket_price || b.ticket_price_max || 0) - (a.ticket_price || a.ticket_price_max || 0);
        case 'price_asc':
          return (a.ticket_price || a.ticket_price_max || 0) - (b.ticket_price || b.ticket_price_max || 0);
        default:
          return 0;
      }
    });
  }

  return filteredEvents;
};

/**
 * Check if two filter objects are equivalent
 * Used to avoid unnecessary re-filtering
 */
export const areFiltersEqual = (
  filters1: EventFilters,
  filters2: EventFilters
): boolean => {
  const keys1 = Object.keys(filters1) as (keyof EventFilters)[];
  const keys2 = Object.keys(filters2) as (keyof EventFilters)[];
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    const val1 = filters1[key];
    const val2 = filters2[key];
    
    // Handle array comparisons (for range filters)
    if (Array.isArray(val1) && Array.isArray(val2)) {
      if (val1.length !== val2.length) return false;
      for (let i = 0; i < val1.length; i++) {
        if (val1[i] !== val2[i]) return false;
      }
    } else if (val1 !== val2) {
      return false;
    }
  }
  
  return true;
};
