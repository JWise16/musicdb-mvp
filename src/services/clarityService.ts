import clarity from '@microsoft/clarity';

// Types for Clarity integration
export interface ClarityConfig {
  projectId: string;
  enabled: boolean;
  enableConsent: boolean;
  debugMode: boolean;
}

export interface UserIdentification {
  userId: string;
  userRole?: string;
  adminLevel?: string;
  hasCompleteProfile?: boolean;
  venueCount?: number;
  eventCount?: number;
}

export interface CustomEvent {
  name: string;
  properties?: Record<string, string | number | boolean>;
}

export interface CustomTag {
  key: string;
  value: string;
}

// Default configuration
const DEFAULT_CONFIG: ClarityConfig = {
  projectId: 't3qjvd5gv7',
  enabled: import.meta.env.PROD || import.meta.env.VITE_CLARITY_ENABLED === 'true',
  enableConsent: true,
  debugMode: import.meta.env.DEV,
};

class ClarityService {
  private isInitialized = false;
  private hasConsent = false;
  private config: ClarityConfig;
  private pendingEvents: CustomEvent[] = [];
  private pendingTags: CustomTag[] = [];
  private currentUser: UserIdentification | null = null;

  constructor(config?: Partial<ClarityConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (this.config.debugMode) {
      console.log('ClarityService: Initialized with config:', this.config);
    }
  }

  /**
   * Initialize Clarity tracking
   */
  public initialize(): void {
    if (!this.config.enabled) {
      console.log('ClarityService: Tracking disabled');
      return;
    }

    if (this.isInitialized) {
      console.warn('ClarityService: Already initialized');
      return;
    }

    try {
      clarity.init(this.config.projectId);
      this.isInitialized = true;
      
      if (this.config.debugMode) {
        console.log('ClarityService: Successfully initialized with project ID:', this.config.projectId);
      }

      // If consent was given before initialization, apply it now
      if (this.hasConsent) {
        this.applyConsent();
      }
    } catch (error) {
      console.error('ClarityService: Initialization failed:', error);
    }
  }

  /**
   * Set user consent for tracking
   */
  public setConsent(hasConsent: boolean): void {
    this.hasConsent = hasConsent;
    
    if (this.config.debugMode) {
      console.log('ClarityService: Consent set to:', hasConsent);
    }

    if (this.isInitialized) {
      this.applyConsent();
    }
  }

  /**
   * Apply consent to Clarity
   */
  private applyConsent(): void {
    if (!this.isInitialized) return;

    try {
      clarity.consent(this.hasConsent);
      
      // If consent is given, flush pending events and tags
      if (this.hasConsent) {
        this.flushPendingData();
      }
    } catch (error) {
      console.error('ClarityService: Failed to set consent:', error);
    }
  }

  /**
   * Identify a user for tracking
   */
  public identifyUser(userInfo: UserIdentification): void {
    if (!this.canTrack()) {
      this.currentUser = userInfo;
      return;
    }

    try {
      clarity.identify(userInfo.userId);
      this.currentUser = userInfo;

      // Set user segmentation tags
      this.setUserTags(userInfo);

      if (this.config.debugMode) {
        console.log('ClarityService: User identified:', userInfo.userId);
      }
    } catch (error) {
      console.error('ClarityService: Failed to identify user:', error);
    }
  }

  /**
   * Set user segmentation tags
   */
  private setUserTags(userInfo: UserIdentification): void {
    const tags: CustomTag[] = [];

    if (userInfo.userRole) {
      tags.push({ key: 'user_role', value: userInfo.userRole });
    }

    if (userInfo.adminLevel) {
      tags.push({ key: 'admin_level', value: userInfo.adminLevel });
    }

    if (userInfo.hasCompleteProfile !== undefined) {
      tags.push({ key: 'profile_complete', value: userInfo.hasCompleteProfile.toString() });
    }

    if (userInfo.venueCount !== undefined) {
      const venueCategory = this.categorizeCount(userInfo.venueCount);
      tags.push({ key: 'venue_count_category', value: venueCategory });
    }

    if (userInfo.eventCount !== undefined) {
      const eventCategory = this.categorizeCount(userInfo.eventCount);
      tags.push({ key: 'event_count_category', value: eventCategory });
    }

    // Apply all tags
    tags.forEach(tag => this.setTag(tag.key, tag.value));
  }

  /**
   * Categorize counts for analytics
   */
  private categorizeCount(count: number): string {
    if (count === 0) return '0';
    if (count === 1) return '1';
    if (count <= 5) return '2-5';
    if (count <= 10) return '6-10';
    if (count <= 50) return '11-50';
    return '50+';
  }

  /**
   * Set a custom tag
   */
  public setTag(key: string, value: string): void {
    if (!this.canTrack()) {
      this.pendingTags.push({ key, value });
      return;
    }

    try {
      clarity.setTag(key, value);
      
      if (this.config.debugMode) {
        console.log('ClarityService: Tag set:', key, '=', value);
      }
    } catch (error) {
      console.error('ClarityService: Failed to set tag:', error);
    }
  }

  /**
   * Track a custom event
   */
  public trackEvent(name: string, properties?: Record<string, string | number | boolean>): void {
    const event: CustomEvent = { name, properties };

    if (!this.canTrack()) {
      this.pendingEvents.push(event);
      return;
    }

    try {
      clarity.event(name);
      
      // Log properties for debugging (Clarity doesn't support event properties directly)
      if (this.config.debugMode && properties) {
        console.log('ClarityService: Event tracked:', name, 'with properties:', properties);
      } else if (this.config.debugMode) {
        console.log('ClarityService: Event tracked:', name);
      }
    } catch (error) {
      console.error('ClarityService: Failed to track event:', error);
    }
  }

  /**
   * Upgrade current session (prioritize recording)
   */
  public upgradeSession(reason: string): void {
    if (!this.canTrack()) return;

    try {
      clarity.upgrade(reason);
      
      if (this.config.debugMode) {
        console.log('ClarityService: Session upgraded:', reason);
      }
    } catch (error) {
      console.error('ClarityService: Failed to upgrade session:', error);
    }
  }

  /**
   * Clear user identification (for logout)
   */
  public clearUser(): void {
    this.currentUser = null;
    
    if (this.config.debugMode) {
      console.log('ClarityService: User cleared');
    }
  }

  /**
   * Check if tracking is possible
   */
  private canTrack(): boolean {
    return this.isInitialized && this.hasConsent && this.config.enabled;
  }

  /**
   * Flush pending events and tags when consent is given
   */
  private flushPendingData(): void {
    // Apply pending tags
    this.pendingTags.forEach(tag => {
      try {
        clarity.setTag(tag.key, tag.value);
      } catch (error) {
        console.error('ClarityService: Failed to flush pending tag:', error);
      }
    });
    this.pendingTags = [];

    // Apply pending events
    this.pendingEvents.forEach(event => {
      try {
        clarity.event(event.name);
      } catch (error) {
        console.error('ClarityService: Failed to flush pending event:', error);
      }
    });
    this.pendingEvents = [];

    // Re-identify user if available
    if (this.currentUser) {
      try {
        clarity.identify(this.currentUser.userId);
        this.setUserTags(this.currentUser);
      } catch (error) {
        console.error('ClarityService: Failed to re-identify user after consent:', error);
      }
    }

    if (this.config.debugMode) {
      console.log('ClarityService: Pending data flushed');
    }
  }

  /**
   * Get current tracking status
   */
  public getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasConsent: this.hasConsent,
      enabled: this.config.enabled,
      currentUser: this.currentUser,
      pendingEvents: this.pendingEvents.length,
      pendingTags: this.pendingTags.length,
    };
  }
}

// Export singleton instance
export const clarityService = new ClarityService();

// Export common tracking functions for convenience
export const trackEvent = (name: string, properties?: Record<string, string | number | boolean>) => 
  clarityService.trackEvent(name, properties);

export const setTag = (key: string, value: string) => 
  clarityService.setTag(key, value);

export const identifyUser = (userInfo: UserIdentification) => 
  clarityService.identifyUser(userInfo);

export const setConsent = (hasConsent: boolean) => 
  clarityService.setConsent(hasConsent);

export const upgradeSession = (reason: string) => 
  clarityService.upgradeSession(reason);

export default clarityService;
