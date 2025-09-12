/**
 * Booking Intelligence Types
 * 
 * These types define the data structures for the Booking Intelligence component,
 * which displays venue-specific artist analytics as averages of all artists
 * the venue has booked, using historical social media data from around
 * each artist's booking date.
 */

// Core metrics for booking intelligence display
export interface BookingIntelligenceMetrics {
  /** Average Spotify followers across all venue's artists */
  spotifyFollowers: number;
  
  /** Average YouTube subscribers across all venue's artists */
  youtubeSubscribers: number;
  
  /** Average Instagram followers across all venue's artists */
  instagramFollowers: number;
  
  /** Average TikTok followers across all venue's artists */
  tiktokFollowers: number;
  
  /** Average Spotify listeners in venue's city across all venue's artists */
  spotifyListenersLocal: number;
  
  /** Total number of performances at this venue */
  totalPerformances: number;
  
  /** Number of performances specifically in the venue's city */
  localPerformances: number;
}

// Filters for booking intelligence data
export interface BookingIntelligenceFilters {
  /** Percentage sold range filter [min, max] */
  percentSoldRange: [number, number];
  
  /** Array of genre names to filter by */
  genres: string[];
  
  /** Time frame for events to include */
  timeFrame: 'month' | '3months' | '6months' | '12months' | 'all';
}

// Complete data structure returned by the API
export interface BookingIntelligenceData {
  /** The calculated metrics */
  metrics: BookingIntelligenceMetrics;
  
  /** Number of unique artists that contributed to these averages */
  artistCount: number;
  
  /** Number of events that were included in the calculation */
  eventCount: number;
  
  /** Date range of events included in calculation */
  dateRange: {
    from: string;  // ISO date string
    to: string;    // ISO date string
  } | null;
  
  /** Venue information for context */
  venue: {
    id: string;
    name: string;
    city: string;
  };
  
  /** Timestamp when this data was calculated */
  lastUpdated: string;  // ISO date string
  
  /** Applied filters that generated this data */
  appliedFilters: BookingIntelligenceFilters;
}

// Individual artist data point for service layer calculations
export interface ArtistBookingDataPoint {
  /** Artist ID */
  artistId: string;
  
  /** Artist name */
  artistName: string;
  
  /** Event ID where artist performed */
  eventId: string;
  
  /** Date when artist performed at venue */
  bookingDate: string;  // ISO date string
  
  /** Artist's genre */
  genre: string | null;
  
  /** Event's percentage sold */
  percentageSold: number;
  
  /** Social media metrics from around the booking date */
  socialMetrics: {
    spotifyFollowers: number | null;
    youtubeSubscribers: number | null;
    instagramFollowers: number | null;
    tiktokFollowers: number | null;
    spotifyListenersLocal: number | null;
  };
  
  /** Whether this artist was a headliner */
  isHeadliner: boolean;
}

// Service method parameters
export interface GetBookingIntelligenceParams {
  /** Venue ID to get intelligence for */
  venueId: string;
  
  /** Filters to apply */
  filters: BookingIntelligenceFilters;
  
  /** Optional: Force refresh of cached data */
  forceRefresh?: boolean;
}

// Error types for booking intelligence
export interface BookingIntelligenceError {
  /** Error code */
  code: 'NO_VENUE' | 'NO_EVENTS' | 'NO_ARTISTS' | 'API_ERROR' | 'UNKNOWN';
  
  /** Human-readable error message */
  message: string;
  
  /** Additional error details */
  details?: Record<string, any>;
}

// Result wrapper for service methods
export interface BookingIntelligenceResult {
  /** The data (null if error) */
  data: BookingIntelligenceData | null;
  
  /** Error information (null if success) */
  error: BookingIntelligenceError | null;
  
  /** Whether the operation was successful */
  success: boolean;
}

// Props for the main component
export interface BookingIntelligenceProps {
  /** Optional: Override venue ID (defaults to current venue from context) */
  venueId?: string;
  
  /** Optional: Custom CSS classes */
  className?: string;
  
  /** Optional: Callback when data changes */
  onDataChange?: (data: BookingIntelligenceData | null) => void;
}

// Chart data for pie chart visualization
export interface PieChartDataPoint {
  /** Platform name */
  name: string;
  
  /** Follower/subscriber count */
  value: number;
  
  /** Color for this segment */
  color: string;
  
  /** Percentage of total */
  percentage: number;
}

// Table row data for metrics display
export interface MetricRowData {
  /** Platform name (e.g., "Spotify Followers") */
  platform: string;
  
  /** Formatted fanbase number */
  fanbase: number;
  
  /** Raw value for sorting */
  rawValue: number;
  
  /** Platform type for icon selection */
  platformType: 'spotify' | 'youtube' | 'instagram' | 'tiktok' | 'performances' | 'local_performances';
}

// Redux/RTK Query cache key structure
export interface BookingIntelligenceCacheKey {
  venueId: string;
  filters: BookingIntelligenceFilters;
}
