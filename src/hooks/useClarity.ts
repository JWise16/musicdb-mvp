import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { clarityService, trackEvent, setTag } from '../services/clarityService';

/**
 * Hook for Clarity analytics integration
 * Provides convenient methods for tracking user interactions and page views
 */
export const useClarity = () => {
  const location = useLocation();

  /**
   * Track page views with readable page names
   */
  const trackPageView = useCallback((pageName: string) => {
    trackEvent('page_view', { page: pageName });
    setTag('current_page', pageName);
  }, []);

  // Track page views automatically
  useEffect(() => {
    const pageName = getPageName(location.pathname);
    trackPageView(pageName);
  }, [location.pathname, trackPageView]);

  /**
   * Track user authentication events
   */
  const trackAuth = useCallback((action: 'login' | 'logout' | 'signup' | 'signup_attempt') => {
    trackEvent(`user_${action}`);
    
    if (action === 'login' || action === 'signup') {
      // Upgrade session for successful auth events
      clarityService.upgradeSession(`User ${action} completed`);
    }
  }, []);

  /**
   * Track onboarding flow events
   */
  const trackOnboarding = useCallback((
    step: 'welcome' | 'profile' | 'venue' | 'early-access' | 'events' | 'complete',
    action: 'started' | 'completed' | 'skipped' = 'completed'
  ) => {
    trackEvent(`onboarding_${step}_${action}`);
    
    if (action === 'completed') {
      setTag('onboarding_step_completed', step);
      
      // Upgrade session for onboarding completion
      if (step === 'complete') {
        clarityService.upgradeSession('Onboarding completed');
      }
    }
  }, []);

  /**
   * Track event management actions
   */
  const trackEventManagement = useCallback((
    action: 'create_started' | 'create_completed' | 'upload_started' | 'upload_completed' | 'manual_entry_started' | 'manual_entry_completed' | 'view_details',
    eventType?: 'upload' | 'manual'
  ) => {
    const eventName = `event_${action}`;
    const properties: Record<string, string | number | boolean> = {};
    
    if (eventType) {
      properties.event_type = eventType;
    }
    
    trackEvent(eventName, properties);
    
    // Upgrade session for event creation
    if (action === 'create_completed') {
      clarityService.upgradeSession('Event created');
    }
  }, []);

  /**
   * Track venue management actions
   */
  const trackVenueManagement = useCallback((
    action: 'create_started' | 'create_completed' | 'view_details' | 'edit_started' | 'edit_completed'
  ) => {
    trackEvent(`venue_${action}`);
    
    // Upgrade session for venue creation
    if (action === 'create_completed') {
      clarityService.upgradeSession('Venue created');
    }
  }, []);

  /**
   * Track dashboard interactions
   */
  const trackDashboard = useCallback((
    action: 'timeframe_changed' | 'analytics_viewed' | 'chart_interacted',
    details?: { timeframe?: string; chart_type?: string }
  ) => {
    const properties: Record<string, string | number | boolean> = {};
    
    if (details?.timeframe) {
      properties.timeframe = details.timeframe;
      setTag('preferred_timeframe', details.timeframe);
    }
    
    if (details?.chart_type) {
      properties.chart_type = details.chart_type;
    }
    
    trackEvent(`dashboard_${action}`, properties);
  }, []);

  /**
   * Track artist search and discovery
   */
  const trackArtistDiscovery = useCallback((
    action: 'search_started' | 'search_completed' | 'artist_viewed' | 'artist_details_viewed',
    details?: { search_term?: string; results_count?: number; artist_id?: string }
  ) => {
    const properties: Record<string, string | number | boolean> = {};
    
    if (details?.search_term) {
      properties.search_term_length = details.search_term.length;
      // Don't send actual search term for privacy
    }
    
    if (details?.results_count !== undefined) {
      properties.results_count = details.results_count;
    }
    
    if (details?.artist_id) {
      properties.has_artist_id = true;
    }
    
    trackEvent(`artist_${action}`, properties);
  }, []);

  /**
   * Track form interactions
   */
  const trackForm = useCallback((
    formName: string,
    action: 'started' | 'field_focused' | 'validation_error' | 'submitted' | 'completed',
    fieldName?: string
  ) => {
    const properties: Record<string, string | number | boolean> = {
      form_name: formName,
    };
    
    if (fieldName) {
      properties.field_name = fieldName;
    }
    
    trackEvent(`form_${action}`, properties);
  }, []);

  /**
   * Track user errors and issues
   */
  const trackError = useCallback((
    errorType: 'network' | 'validation' | 'auth' | 'upload' | 'unknown',
    errorContext?: string
  ) => {
    const properties: Record<string, string | number | boolean> = {
      error_type: errorType,
    };
    
    if (errorContext) {
      properties.context = errorContext;
    }
    
    trackEvent('user_error', properties);
    
    // Upgrade session for errors to help with debugging
    clarityService.upgradeSession(`User error: ${errorType}`);
  }, []);

  /**
   * Track feature usage
   */
  const trackFeature = useCallback((
    featureName: string,
    action: 'accessed' | 'used' | 'completed',
    details?: Record<string, string | number | boolean>
  ) => {
    const properties: Record<string, string | number | boolean> = {
      feature: featureName,
      ...details,
    };
    
    trackEvent(`feature_${action}`, properties);
  }, []);

  return {
    // Page tracking
    trackPageView,
    
    // Authentication tracking
    trackAuth,
    
    // User journey tracking
    trackOnboarding,
    trackEventManagement,
    trackVenueManagement,
    trackDashboard,
    trackArtistDiscovery,
    
    // Interaction tracking
    trackForm,
    trackError,
    trackFeature,
    
    // Direct access to service
    clarityService,
  };
};

/**
 * Convert pathname to readable page name
 */
function getPageName(pathname: string): string {
  // Remove leading slash and get first segment
  const segments = pathname.slice(1).split('/');
  const firstSegment = segments[0] || 'landing';
  
  // Handle dynamic routes
  if (segments[1] && !isNaN(Number(segments[1]))) {
    return `${firstSegment}_details`;
  }
  
  // Handle nested routes
  if (segments[1]) {
    return `${firstSegment}_${segments[1]}`;
  }
  
  // Map common routes to readable names
  const pageMap: Record<string, string> = {
    '': 'landing',
    'login': 'auth_login',
    'signup': 'auth_signup',
    'dashboard': 'dashboard',
    'onboarding': 'onboarding',
    'events': 'events_list',
    'add-event': 'event_create',
    'venues': 'venues_list',
    'add-venue': 'venue_create',
    'artist-search': 'artist_search',
    'profile': 'user_profile',
    'verification': 'verification',
    'admin': 'admin_dashboard',
    'about': 'about',
  };
  
  return pageMap[firstSegment] || firstSegment;
}

export default useClarity;
