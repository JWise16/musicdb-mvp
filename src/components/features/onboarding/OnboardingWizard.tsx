import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { UserProfileService } from '../../../services/userProfileService';
import { VenueService } from '../../../services/venueService';
import { EventService } from '../../../services/eventService';

import Avatar from '../../common/Avatar';
import OnboardingEarlyAccess from './OnboardingEarlyAccess';
import logo from '../../../assets/logo.png';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  prefillData?: {
    full_name?: string;
    email?: string;
  };
  step?: 'profile' | 'venue' | 'early-access' | 'events';
  eventNumber?: number; // Track which event we're creating (1, 2, or 3)
}

interface UserProfile {
  full_name: string;
  email: string;
  avatar_url?: string;
  role?: string;
  custom_role?: string;
}

interface VenueData {
  name: string;
  location: string;
  address: string;
  capacity?: number;
  contact_email?: string;
  contact_phone?: string;
  description?: string;
  image_url: string;
}

interface EventData {
  name: string;
  date: string;
  ticket_price?: number;
  ticket_price_min?: number;
  ticket_price_max?: number;
  total_ticket_revenue?: number;
  total_tickets?: number;
  tickets_sold?: number;
  bar_sales?: number;
  notes?: string;
  artists: Array<{
    name: string;
    genre?: string;
    is_headliner: boolean;
    is_opener: boolean;
    performance_order: number;
    contact_info?: string;
    social_media?: any;
  }>;
}

export default function OnboardingWizard({ isOpen, onClose, prefillData, step = 'profile', eventNumber = 1 }: OnboardingWizardProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: boolean}>({});
  const [hasAttemptedValidation, setHasAttemptedValidation] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save keys for localStorage
  const STORAGE_KEYS = {
    profile: 'onboarding-profile-draft',
    venue: 'onboarding-venue-draft', 
    event: 'onboarding-event-draft'
  };

  //console.log('OnboardingWizard: isOpen =', isOpen, 'user =', user?.email, 'prefillData =', prefillData, 'step =', step, 'eventNumber =', eventNumber);
  
  const [profile, setProfile] = useState<UserProfile>({
    full_name: '',
    email: '',
    role: '',
    custom_role: ''
  });

  const [venue, setVenue] = useState<VenueData>({
    name: '',
    location: '',
    address: '',
    capacity: undefined,
    image_url: ''
  });

  const [event, setEvent] = useState<EventData>({
    name: `Event ${eventNumber}`,
    date: '',
    ticket_price: undefined,
    ticket_price_min: undefined,
    ticket_price_max: undefined,
    total_ticket_revenue: undefined,
    total_tickets: undefined,
    tickets_sold: undefined,
    bar_sales: undefined,
    notes: '',
    artists: [{ name: '', is_headliner: true, is_opener: false, performance_order: 1 }]
  });

  const [priceType, setPriceType] = useState<'single' | 'range'>('single');

  // Load saved data on mount
  useEffect(() => {
    if (isOpen) {
      try {
        let dataRestored = false;

        // Restore profile data
        const savedProfile = localStorage.getItem(STORAGE_KEYS.profile);
        if (savedProfile) {
          const profileData = JSON.parse(savedProfile);
          console.log('Restoring profile data:', profileData);
          setProfile(profileData); // Use direct assignment instead of spread
          dataRestored = true;
        }

        // Restore venue data
        const savedVenue = localStorage.getItem(STORAGE_KEYS.venue);
        if (savedVenue) {
          const venueData = JSON.parse(savedVenue);
          console.log('Restoring venue data:', venueData);
          setVenue(venueData); // Use direct assignment instead of spread
          dataRestored = true;
        }

        // Restore event data
        const savedEvent = localStorage.getItem(STORAGE_KEYS.event);
        if (savedEvent) {
          const eventData = JSON.parse(savedEvent);
          console.log('Restoring event data:', eventData);
          // Clean up any display values before restoring
          const cleanEventData = { ...eventData };
          Object.keys(cleanEventData).forEach(key => {
            if (key.includes('_display')) {
              delete cleanEventData[key];
            }
          });
          setEvent(cleanEventData); // Use direct assignment instead of spread
          
          // Restore price type
          if (eventData.ticket_price) {
            setPriceType('single');
          } else if (eventData.ticket_price_min || eventData.ticket_price_max) {
            setPriceType('range');
          }
          dataRestored = true;
        }

        // Log if any data was restored
        if (dataRestored) {
          console.log('Data restored from localStorage');
          
          // Force a re-render after a small delay to ensure state updates are applied
          setTimeout(() => {
            console.log('Current state after restoration:');
            console.log('Profile state:', profile);
            console.log('Venue state:', venue);
            console.log('Event state:', event);
          }, 200);
        }
      } catch (error) {
        console.warn('Failed to restore onboarding data:', error);
      }
    }
  }, [isOpen]);

  // Auto-save profile data (save any changes, not just when full_name exists)
  useEffect(() => {
    if (isOpen) {
      const hasProfileData = profile.full_name || profile.email || profile.role;
      if (hasProfileData) {
        console.log('Auto-saving profile data:', profile);
        localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
      }
    }
  }, [profile, isOpen]);

  // Auto-save venue data (save any changes, not just when name exists)
  useEffect(() => {
    if (isOpen) {
      const hasVenueData = venue.name || venue.location || venue.address;
      if (hasVenueData) {
        console.log('Auto-saving venue data:', venue);
        localStorage.setItem(STORAGE_KEYS.venue, JSON.stringify(venue));
      }
    }
  }, [venue, isOpen]);

  // Auto-save event data (save any changes, not just when date exists)
  useEffect(() => {
    if (isOpen) {
      const hasEventData = event.date || event.total_tickets || event.ticket_price || 
                           event.ticket_price_min || event.ticket_price_max || 
                           event.total_ticket_revenue || event.bar_sales || 
                           event.notes || (event.artists && event.artists[0]?.name);
      if (hasEventData) {
        console.log('Auto-saving event data:', event);
        localStorage.setItem(STORAGE_KEYS.event, JSON.stringify(event));
      }
    }
  }, [event, isOpen]);

  // Save on page unload (always save current state)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isOpen) {
        console.log('Page unloading - saving all data');
        localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
        localStorage.setItem(STORAGE_KEYS.venue, JSON.stringify(venue));
        localStorage.setItem(STORAGE_KEYS.event, JSON.stringify(event));
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isOpen) {
        console.log('Tab hidden - saving all data');
        localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
        localStorage.setItem(STORAGE_KEYS.venue, JSON.stringify(venue));
        localStorage.setItem(STORAGE_KEYS.event, JSON.stringify(event));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [profile, venue, event, isOpen]);

  // Clear saved data when onboarding is completed successfully
  const clearSavedData = () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  };

  // Update profile when prefillData changes or component mounts (but don't override restored data)
  useEffect(() => {
    //console.log('OnboardingWizard: useEffect triggered with prefillData =', prefillData);
    
    // Check for saved data directly instead of relying on hasRestoredData flag
    const savedProfile = localStorage.getItem(STORAGE_KEYS.profile);
    const hasSavedProfileData = savedProfile && JSON.parse(savedProfile);
    
    // Add a small delay to ensure localStorage restoration happens first
    const timer = setTimeout(() => {
      if (prefillData && !hasSavedProfileData) {
        console.log('Applying prefillData (no localStorage data found):', prefillData);
        setProfile(prev => {
          const updated = {
            ...prev,
            full_name: prefillData.full_name || prev.full_name,
            email: prefillData.email || prev.email
          };
          //console.log('OnboardingWizard: Updated profile =', updated);
          return updated;
        });
      } else if (prefillData && hasSavedProfileData) {
        console.log('Skipping prefillData application - localStorage data exists');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [prefillData]); // Remove hasRestoredData dependency

  // Reset event form when eventNumber changes (but don't override restored data)
  useEffect(() => {
    // Check for saved data directly instead of relying on hasRestoredData flag
    const savedEvent = localStorage.getItem(STORAGE_KEYS.event);
    const hasSavedEventData = savedEvent && JSON.parse(savedEvent);
    
    if (step === 'events' && !hasSavedEventData) {
      console.log('Resetting event form for new event number:', eventNumber);
      setEvent({
        name: `Event ${eventNumber}`,
        date: '',
        ticket_price: undefined,
        ticket_price_min: undefined,
        ticket_price_max: undefined,
        total_ticket_revenue: undefined,
        total_tickets: undefined,
        tickets_sold: undefined,
        bar_sales: undefined,
        notes: '',
        artists: [{ name: '', is_headliner: true, is_opener: false, performance_order: 1 }]
      });
    } else if (step === 'events' && hasSavedEventData) {
      console.log('Skipping event form reset - localStorage data exists');
    }
  }, [eventNumber, step]); // Remove hasRestoredData dependency

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [venueImageFile, setVenueImageFile] = useState<File | null>(null);
  const [venueImagePreview, setVenueImagePreview] = useState<string>('');
  const venueImageInputRef = useRef<HTMLInputElement>(null);

  const handleProfileChange = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors for this field when user starts typing
    if (field === 'full_name' && value.trim()) {
      setValidationErrors(prev => ({ ...prev, profile_full_name: false }));
    }
    if (field === 'email' && value.trim()) {
      setValidationErrors(prev => ({ ...prev, profile_email: false }));
    }
    if (field === 'role' && value) {
      setValidationErrors(prev => ({ ...prev, profile_role: false }));
    }
    if (field === 'custom_role' && value.trim()) {
      setValidationErrors(prev => ({ ...prev, profile_custom_role: false }));
    }
  };

  const handleVenueChange = (field: keyof VenueData, value: any) => {
    setVenue(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors for this field when user starts typing
    if (field === 'name' && value.trim()) {
      setValidationErrors(prev => ({ ...prev, venue_name: false }));
    }
    if (field === 'location' && value.trim()) {
      setValidationErrors(prev => ({ ...prev, venue_location: false }));
    }
    if (field === 'address' && value.trim()) {
      setValidationErrors(prev => ({ ...prev, venue_address: false }));
    }
    if (field === 'capacity' && value && value > 0) {
      setValidationErrors(prev => ({ ...prev, venue_capacity: false }));
    }
  };

  const handleEventChange = (field: keyof EventData, value: any) => {
    setEvent(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors for this field when user starts typing
    if (field === 'date' && value) {
      setValidationErrors(prev => ({ ...prev, event_date: false }));
    }
    if (field === 'total_tickets' && value && value > 0) {
      setValidationErrors(prev => ({ ...prev, event_total_tickets: false }));
    }
  };

  const handleArtistChange = (index: number, field: string, value: any) => {
    setEvent(prev => ({
      ...prev,
      artists: prev.artists.map((artist, i) => {
        if (i !== index) return artist;
        if (field === 'is_headliner' && value) {
          return { ...artist, is_headliner: true, is_opener: false };
        }
        if (field === 'is_opener' && value) {
          return { ...artist, is_headliner: false, is_opener: true };
        }
        return { ...artist, [field]: value };
      })
    }));
    
    // Clear validation errors for artist names when user starts typing
    if (field === 'name' && value.trim()) {
      setValidationErrors(prev => ({ ...prev, event_artists: false }));
    }
  };

  const addArtist = () => {
    setEvent(prev => ({
      ...prev,
      artists: [...prev.artists, { 
        name: '', 
        is_headliner: false, 
        is_opener: false, 
        performance_order: prev.artists.length + 1 
      }]
    }));
  };

  const removeArtist = (index: number) => {
    setEvent(prev => ({
      ...prev,
      artists: prev.artists.filter((_, i) => i !== index)
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVenueImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVenueImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setVenueImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getStepLabel = () => {
    switch (step) {
      case 'profile':
        return 'Profile Setup';
      case 'venue':
        return 'Add Venue';
      case 'early-access':
        return 'Early Access';
      case 'events':
        return `Event ${eventNumber}`;
      default:
        return '';
    }
  };

  const validateCurrentStep = () => {
    const errors: {[key: string]: boolean} = {};
    
    switch (step) {
      case 'profile':
        if (!profile.full_name.trim()) errors.profile_full_name = true;
        if (!profile.email.trim()) errors.profile_email = true;
        if (!profile.role) errors.profile_role = true;
        if (profile.role === 'other' && (!profile.custom_role || !profile.custom_role.trim())) errors.profile_custom_role = true;
        break;
        
      case 'venue':
        if (!venue.name.trim()) errors.venue_name = true;
        if (!venue.location.trim()) errors.venue_location = true;
        if (!venue.address.trim()) errors.venue_address = true;
        if (!venue.capacity || venue.capacity <= 0) errors.venue_capacity = true;
        break;
        
      case 'early-access':
        // Early access validation is handled by the component itself
        return true;
        
      case 'events':
        if (!event.date) errors.event_date = true;
        if (!event.total_tickets || event.total_tickets <= 0) errors.event_total_tickets = true;
        if (!event.artists.some(artist => artist.name.trim())) errors.event_artists = true;
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleComplete = async () => {
    if (!user) {
      //console.log('OnboardingWizard: User not authenticated');
      return;
    }

    // Validate current step first
    if (!validateCurrentStep()) {
      setHasAttemptedValidation(true);
      return;
    }

    setIsLoading(true);
    setValidationErrors({});
    setHasAttemptedValidation(false);

    try {
      //console.log('OnboardingWizard: Starting step completion for step:', step);
      
      switch (step) {
        case 'profile': {
          // Update user profile
          const profileResult = await UserProfileService.updateProfileWithAvatar(
            user.id,
            {
              full_name: profile.full_name,
              role: profile.role === 'other' ? profile.custom_role : profile.role
            },
            avatarFile || undefined
          );

          if (profileResult.error) {
            console.error('OnboardingWizard: Profile save error:', profileResult.error);
            
            // If avatar upload failed, try saving profile without avatar
            if (avatarFile && profileResult.error.includes('avatar')) {
              //console.log('OnboardingWizard: Retrying without avatar upload');
              const retryResult = await UserProfileService.updateProfileWithAvatar(
                user.id,
                {
                  full_name: profile.full_name,
                  role: profile.role === 'other' ? profile.custom_role : profile.role
                }
              );
              
              if (retryResult.error) {
                return;
              }
            }
          }
          break;
        }

        case 'venue': {
          // Create venue and associate with user
          const venueResult = await VenueService.createVenueWithImage(venue, venueImageFile || undefined);
          if (venueResult.error) {
            console.error('OnboardingWizard: Venue creation error:', venueResult.error);
            return;
          }

          if (venueResult.venueId) {
            const associateResult = await VenueService.associateUserWithVenue({
              user_id: user.id,
              venue_id: venueResult.venueId,
              role: 'owner'
            });

            if (associateResult.error) {
              console.error('OnboardingWizard: Venue association error:', associateResult.error);
              return;
            }
          }
          break;
        }

        case 'early-access':
          // Early access validation is handled by the OnboardingEarlyAccess component
          // which calls onClose() directly when validation succeeds
          break;

        case 'events': {
          // Get user's venue
          const userVenues = await VenueService.getUserVenues(user.id);
          //console.log('OnboardingWizard: User venues found:', userVenues.length);
          
          if (userVenues.length === 0) {
            return;
          }

          const venueId = userVenues[0].id;
          //console.log(`OnboardingWizard: Creating event ${eventNumber} for venue:`, venueId);
          //console.log('OnboardingWizard: Event data:', event);
          //console.log('OnboardingWizard: Price type:', priceType);
          
          // Create single event
          const eventData = {
            ...event,
            venue_id: venueId,
            total_tickets: event.total_tickets || 0,
            ticket_price: priceType === 'range' ? undefined : event.ticket_price,
            ticket_price_min: priceType === 'range' ? event.ticket_price_min : undefined,
            ticket_price_max: priceType === 'range' ? event.ticket_price_max : undefined,
          };

          //console.log(`OnboardingWizard: Final event data for creation:`, eventData);
          
          const eventResult = await EventService.createEvent(eventData);

          //console.log(`OnboardingWizard: Event creation result:`, eventResult);

          if (eventResult.error) {
            console.error(`OnboardingWizard: Event ${eventNumber} creation error:`, eventResult.error);
            return;
          }

          //console.log(`OnboardingWizard: Event ${eventNumber} created successfully:`, eventResult.eventId);
          break;
        }
      }

      //
      // console.log('OnboardingWizard: Step completed successfully');
      
      // Clear saved data on successful completion
      clearSavedData();
      
      onClose();
    } catch (error) {
      console.error('Error completing onboarding step:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format currency
  const formatCurrency = (value: string | number) => {
    if (!value && value !== 0) return '';
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
    if (isNaN(numValue)) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue);
  };

  // Helper function to parse currency value
  const parseCurrency = (value: string) => {
    const numValue = parseFloat(value.replace(/[^0-9.]/g, ''));
    return isNaN(numValue) ? undefined : numValue;
  };

  // Handle currency field changes (while typing)
  const handleCurrencyChange = (field: string, value: string) => {
    // Store the raw input value temporarily for editing
    const cleanValue = value.replace(/[^0-9.]/g, '');
    setEvent(prev => ({
      ...prev,
      [`${field}_display`]: value, // Store display value
      [field]: cleanValue ? parseFloat(cleanValue) : undefined // Store numeric value
    }));
  };

  // Handle currency field blur (format when done typing)
  const handleCurrencyBlur = (field: string, value: string) => {
    const numValue = parseCurrency(value);
    setEvent(prev => ({
      ...prev,
      [`${field}_display`]: undefined, // Clear display value
      [field]: numValue
    }));
  };

  // Get display value for currency field
  const getCurrencyDisplayValue = (field: string) => {
    const displayValue = (event as any)[`${field}_display`];
    if (displayValue !== undefined) return displayValue;
    const numValue = (event as any)[field];
    return numValue ? formatCurrency(numValue) : '';
  };

  const renderProfileStep = () => (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      <div className="text-center mb-3">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Profile Setup</h3>
        <p className="text-sm text-gray-600">Let's start with your basic information</p>
      </div>
      
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={profile.full_name || ''}
            onChange={(e) => handleProfileChange('full_name', e.target.value)}
            className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationErrors.profile_full_name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your full name"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={profile.email || ''}
            onChange={(e) => handleProfileChange('email', e.target.value)}
            className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationErrors.profile_email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Profile Picture (Optional)
          </label>
          <div className="flex items-center space-x-3">
            <Avatar 
              src={avatarPreview} 
              size="md" 
              fallback={profile.full_name}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Choose Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        </div>



        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Your Role <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {[
              { value: 'talent_buyer', label: 'Talent Buyer' },
              { value: 'owner', label: 'Owner' },
              { value: 'general_manager', label: 'General Manager' },
              { value: 'operations_manager', label: 'Operations Manager' },
              { value: 'promoter', label: 'Promoter' },
              { value: 'other', label: 'Other' }
            ].map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => handleProfileChange('role', role.value)}
                className={`p-2 border-2 rounded-lg text-center transition-colors ${
                  profile.role === role.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900 text-xs leading-tight">{role.label}</div>
              </button>
            ))}
          </div>
          
          {/* Custom role input */}
          {profile.role === 'other' && (
            <div className="mt-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Please specify your role <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={profile.custom_role}
                onChange={(e) => handleProfileChange('custom_role', e.target.value)}
                className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.profile_custom_role ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Sound Engineer, Booking Agent, etc."
                required
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderVenueStep = () => (
    <div className="space-y-3 lg:space-y-4">
      <div>
        <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1">Add Your Venue</h3>
        <p className="text-xs lg:text-sm text-gray-600">Tell us about your venue</p>
      </div>
      
      <div className="space-y-2 lg:space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Venue Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={venue.name}
              onChange={(e) => handleVenueChange('name', e.target.value)}
              className={`w-full px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm border-2 rounded-md lg:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                validationErrors.venue_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter venue name"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Location/City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={venue.location}
              onChange={(e) => handleVenueChange('location', e.target.value)}
              className={`w-full px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm border-2 rounded-md lg:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                validationErrors.venue_location ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter city or location"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={venue.address}
            onChange={(e) => handleVenueChange('address', e.target.value)}
            className={`w-full px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm border-2 rounded-md lg:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationErrors.venue_address ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter full address"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Capacity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={venue.capacity || ''}
            onChange={(e) => handleVenueChange('capacity', e.target.value ? parseInt(e.target.value) : undefined)}
            onWheel={e => e.currentTarget.blur()} // Prevent scroll wheel changes
            className={`w-full px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm border-2 rounded-md lg:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationErrors.venue_capacity ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter venue capacity"
            min="1"
            required
          />
        </div>



        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Venue Image (Optional)
          </label>
          <div className="flex items-center space-x-2 lg:space-x-3">
            <Avatar 
              src={venueImagePreview} 
              size="md" 
              fallback={venue.name}
            />
            <button
              type="button"
              onClick={() => venueImageInputRef.current?.click()}
              className="px-2 lg:px-3 py-1 lg:py-1.5 border border-gray-300 rounded-md lg:rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Choose Photo
            </button>
            <input
              ref={venueImageInputRef}
              type="file"
              accept="image/*"
              onChange={handleVenueImageChange}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderEarlyAccessStep = () => (
    <OnboardingEarlyAccess
      onValidCode={() => {
        // Mark early access as validated
        localStorage.setItem('musicdb-early-access-validated', 'true');
        onClose();
      }}
      onError={(message) => {
        // Error is handled by the OnboardingEarlyAccess component
        console.log('Early access error:', message);
      }}
    />
  );

  const renderEventStep = () => (
    <div className="w-full max-w-3xl xl:max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-4 lg:mb-6">
        <h2 className="text-base lg:text-lg xl:text-xl font-bold text-gray-900 mb-1">
          Add Event {eventNumber}
        </h2>
        <p className="text-xs lg:text-sm text-gray-600">
          {eventNumber === 1
            ? 'Report your first event - this will be how you access the tool during future logins'
            : `Create your ${eventNumber === 2 ? 'second' : 'third'} event – if possible, report a show from this week or month so your dashboard is up to date.`}
        </p>
      </div>
      <form className="space-y-3 lg:space-y-4" onSubmit={e => { e.preventDefault(); handleComplete(); }}>
        {/* Event Details */}
        <div className="card p-3 lg:p-4">
          <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 lg:mb-3">Event Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={event.date}
                onChange={e => handleEventChange('date', e.target.value)}
                className="form-input w-full text-xs lg:text-sm px-2 lg:px-3 py-1.5 lg:py-2"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 mt-3 lg:mt-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Total Tickets Available<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={event.total_tickets || ''}
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                  handleEventChange('total_tickets', value ? parseInt(value) : 0);
                }}
                onWheel={e => e.currentTarget.blur()} // Prevent scroll wheel changes
                className="form-input w-full text-xs lg:text-sm px-2 lg:px-3 py-1.5 lg:py-2"
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tickets Sold <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={event.tickets_sold || ''}
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                  const numValue = value ? parseInt(value) : undefined;
                  // Ensure tickets sold doesn't exceed total tickets
                  const maxValue = event.total_tickets || 0;
                  const finalValue = numValue && numValue > maxValue ? maxValue : numValue;
                  handleEventChange('tickets_sold', finalValue);
                }}
                onWheel={e => e.currentTarget.blur()} // Prevent scroll wheel changes
                className="form-input w-full text-xs lg:text-sm px-2 lg:px-3 py-1.5 lg:py-2"
                placeholder="0"
              />
            </div>
          </div>
        </div>
        
        {/* Artists */}
        <div className="card p-3 lg:p-4">
          <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 lg:mb-3">Artists</h3>
          {event.artists.map((artist, index) => (
            <div key={index} className="border border-gray-200 rounded-md lg:rounded-lg p-2 lg:p-3 mb-2 lg:mb-3">
              <div className="flex items-center justify-between mb-2 lg:mb-3">
                <h4 className="font-medium text-gray-900 text-xs lg:text-sm">
                  Artist {index + 1} {artist.is_headliner && '(Headliner)'}
                </h4>
                {event.artists.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArtist(index)}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Artist Name *
                  </label>
                  <input
                    type="text"
                    value={artist.name}
                    onChange={e => handleArtistChange(index, 'name', e.target.value)}
                    className="form-input w-full text-xs lg:text-sm px-2 lg:px-3 py-1.5 lg:py-2"
                    placeholder="e.g., The Rolling Stones"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Genre
                  </label>
                  <input
                    type="text"
                    value={artist.genre || ''}
                    onChange={e => handleArtistChange(index, 'genre', e.target.value)}
                    className="form-input w-full text-xs lg:text-sm px-2 lg:px-3 py-1.5 lg:py-2"
                    placeholder="e.g., Rock"
                  />
                </div>
              </div>
              <div className="mt-2 lg:mt-3">
                <div className="flex flex-col sm:flex-row gap-2 lg:gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={artist.is_headliner}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleArtistChange(index, 'is_headliner', true);
                        }
                      }}
                      className="mr-1.5"
                    />
                    <span className="text-xs lg:text-sm">Headliner</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={!artist.is_headliner}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleArtistChange(index, 'is_headliner', false);
                        }
                      }}
                      className="mr-1.5"
                    />
                    <span className="text-xs lg:text-sm">Supporting</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addArtist}
            className="btn-secondary w-full py-1.5 lg:py-2 text-xs lg:text-sm"
          >
            + Add Another Artist
          </button>
        </div>

        {/* Ticket Pricing */}
        <div className="card p-3 lg:p-4">
          <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 lg:mb-3">Ticket Pricing <span className="text-red-500">*</span></h3>
          <div className="mb-2 lg:mb-3">
            <div className="flex flex-col sm:flex-row gap-2 lg:gap-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="priceType"
                  value="single"
                  checked={priceType === 'single'}
                  onChange={() => setPriceType('single')}
                  className="mr-1.5"
                />
                <span className="text-xs lg:text-sm">Single Price</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="priceType"
                  value="range"
                  checked={priceType === 'range'}
                  onChange={() => setPriceType('range')}
                  className="mr-1.5"
                />
                <span className="text-xs lg:text-sm">Price Range</span>
              </label>
            </div>
          </div>
          {priceType === 'single' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Ticket Price ($)
              </label>
              <input
                type="text"
                value={getCurrencyDisplayValue('ticket_price')}
                onChange={e => handleCurrencyChange('ticket_price', e.target.value)}
                onBlur={e => handleCurrencyBlur('ticket_price', e.target.value)}
                className="form-input w-full text-xs lg:text-sm px-2 lg:px-3 py-1.5 lg:py-2"
                placeholder="$25.00"
              />
            </div>
          )}
          {priceType === 'range' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Minimum Price ($)
                </label>
                <input
                  type="text"
                  value={getCurrencyDisplayValue('ticket_price_min')}
                  onChange={e => handleCurrencyChange('ticket_price_min', e.target.value)}
                  onBlur={e => handleCurrencyBlur('ticket_price_min', e.target.value)}
                  className="form-input w-full text-xs lg:text-sm px-2 lg:px-3 py-1.5 lg:py-2"
                  placeholder="$20.00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Maximum Price ($)
                </label>
                <input
                  type="text"
                  value={getCurrencyDisplayValue('ticket_price_max')}
                  onChange={e => handleCurrencyChange('ticket_price_max', e.target.value)}
                  onBlur={e => handleCurrencyBlur('ticket_price_max', e.target.value)}
                  className="form-input w-full text-xs lg:text-sm px-2 lg:px-3 py-1.5 lg:py-2"
                  placeholder="$50.00"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Revenue Tracking */}
        <div className="card p-3 lg:p-4">
          <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 lg:mb-3">Revenue Tracking (Optional)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Total Ticket Revenue
              </label>
              <input
                type="text"
                value={getCurrencyDisplayValue('total_ticket_revenue')}
                onChange={e => handleCurrencyChange('total_ticket_revenue', e.target.value)}
                onBlur={e => handleCurrencyBlur('total_ticket_revenue', e.target.value)}
                className="form-input w-full text-xs lg:text-sm px-2 lg:px-3 py-1.5 lg:py-2"
                placeholder="$0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Total revenue from all ticket sales
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Bar Sales ($)
              </label>
              <input
                type="text"
                value={getCurrencyDisplayValue('bar_sales')}
                onChange={e => handleCurrencyChange('bar_sales', e.target.value)}
                onBlur={e => handleCurrencyBlur('bar_sales', e.target.value)}
                className="form-input w-full text-xs lg:text-sm px-2 lg:px-3 py-1.5 lg:py-2"
                placeholder="$0.00"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Any additional details you report—like bar sales or show notes—are completely private. They're optional and only visible to you on your dashboard for your own reference.
          </p>
        </div>
        {/* Notes */}
        <div className="card p-3 lg:p-4">
          <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 lg:mb-3">Additional Notes</h3>
          <p className="text-xs text-gray-600 mb-2 lg:mb-3">Add any additional notes you'll want to remember about this event…</p>
          <textarea
            value={event.notes}
            onChange={e => handleEventChange('notes', e.target.value)}
            className="form-textarea w-full text-xs lg:text-sm px-2 lg:px-3 py-1.5 lg:py-2"
            rows={2}
            placeholder="Any additional notes about this event..."
          />
        </div>
      </form>
    </div>
  );

  const renderStepContent = () => {
    switch (step) {
      case 'profile':
        return renderProfileStep();
      case 'venue':
        return renderVenueStep();
      case 'early-access':
        return renderEarlyAccessStep();
      case 'events':
        return renderEventStep();
      default:
        return null;
    }
  };



  const getProgressPercentage = () => {
    switch (step) {
      case 'profile':
        return 20;
      case 'venue':
        return 40;
      case 'early-access':
        return 50;
      case 'events':
        return Math.min(100, 50 + (eventNumber * 17)); // Cap at 100%
      default:
        return 0;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl lg:rounded-2xl shadow-xl w-full max-w-[95vw] lg:max-w-5xl xl:max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <img src={logo} alt="MusicDB Logo" className="w-6 h-6 lg:w-8 lg:h-8" />
              <h2 className="text-lg lg:text-xl font-bold text-gray-900">MusicDB</h2>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-3 lg:mt-4 max-w-xs sm:max-w-md mx-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">{getStepLabel()}</span>
              <span className="text-xs text-gray-500">{getProgressPercentage()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-gray-400 to-black h-1.5 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Content */}
        {step === 'profile' || step === 'venue' || step === 'events' || step === 'early-access' ? (
          // Full-width form, no preview panel
          <div className="p-3 sm:p-4 lg:p-5 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 240px)' }}>
            {renderStepContent()}
          </div>
        ) : (
          // This condition should no longer be reached since all steps now use full-width
          <div className="p-3 sm:p-4 lg:p-5 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 240px)' }}>
            {renderStepContent()}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 p-2 sm:p-3 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              {hasAttemptedValidation && Object.keys(validationErrors).length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-2 overflow-y-auto max-h-16">
                  <p className="text-xs text-red-700 font-medium mb-1">Please complete the following required fields:</p>
                  <div className="flex flex-wrap gap-1">
                    {validationErrors.profile_full_name && <span className="text-xs text-red-600">• Full Name</span>}
                    {validationErrors.profile_email && <span className="text-xs text-red-600">• Email</span>}
                    {validationErrors.profile_role && <span className="text-xs text-red-600">• Your Role</span>}
                    {validationErrors.profile_custom_role && <span className="text-xs text-red-600">• Custom Role</span>}
                    {validationErrors.venue_name && <span className="text-xs text-red-600">• Venue Name</span>}
                    {validationErrors.venue_location && <span className="text-xs text-red-600">• Location/City</span>}
                    {validationErrors.venue_address && <span className="text-xs text-red-600">• Address</span>}
                    {validationErrors.venue_capacity && <span className="text-xs text-red-600">• Capacity</span>}
                    {validationErrors.event_date && <span className="text-xs text-red-600">• Date</span>}
                    {validationErrors.event_total_tickets && <span className="text-xs text-red-600">• Total Tickets Available</span>}
                    {validationErrors.event_artists && <span className="text-xs text-red-600">• At least one Artist Name</span>}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleComplete}
              disabled={isLoading}
              className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-md lg:rounded-lg font-medium transition-all flex-shrink-0 text-xs lg:text-sm ${
                isLoading 
                  ? 'bg-gray-400 text-white opacity-50 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                  <span className="text-xs">Completing...</span>
                </div>
              ) : (
                step === 'early-access' ? 'Continue' : step === 'events' ? `Create Event ${eventNumber}` : 'Complete Step'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 