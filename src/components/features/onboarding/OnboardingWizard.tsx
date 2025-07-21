import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { UserProfileService } from '../../../services/userProfileService';
import { VenueService } from '../../../services/venueService';
import { EventService } from '../../../services/eventService';
import { formatSimpleDate } from '../../../utils/dateUtils';
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
  bio?: string;
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
  const [earlyAccessError, setEarlyAccessError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  //console.log('OnboardingWizard: isOpen =', isOpen, 'user =', user?.email, 'prefillData =', prefillData, 'step =', step, 'eventNumber =', eventNumber);
  
  const [profile, setProfile] = useState<UserProfile>({
    full_name: '',
    email: '',
    bio: '',
    role: '',
    custom_role: ''
  });

  const [venue, setVenue] = useState<VenueData>({
    name: '',
    location: '',
    address: '',
    capacity: undefined,
    contact_email: '',
    contact_phone: '',
    description: '',
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

  // Update profile when prefillData changes or component mounts
  useEffect(() => {
    //console.log('OnboardingWizard: useEffect triggered with prefillData =', prefillData);
    if (prefillData) {
      setProfile(prev => {
        const updated = {
          ...prev,
          full_name: prefillData.full_name || prev.full_name,
          email: prefillData.email || prev.email
        };
        //console.log('OnboardingWizard: Updated profile =', updated);
        return updated;
      });
    }
  }, [prefillData]);

  // Reset event form when eventNumber changes
  useEffect(() => {
    if (step === 'events') {
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
      setPriceType('single');
    }
  }, [step, eventNumber]);

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
        case 'profile':
          // Update user profile
          const profileResult = await UserProfileService.updateProfileWithAvatar(
            user.id,
            {
              full_name: profile.full_name,
              bio: profile.bio,
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
                  bio: profile.bio,
                  role: profile.role === 'other' ? profile.custom_role : profile.role
                }
              );
              
              if (retryResult.error) {
                return;
              }
            }
          }
          break;

        case 'venue':
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

        case 'early-access':
          // Early access validation is handled by the OnboardingEarlyAccess component
          // which calls onClose() directly when validation succeeds
          break;

        case 'events':
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

      //
      // console.log('OnboardingWizard: Step completed successfully');
      onClose();
    } catch (error) {
      console.error('Error completing onboarding step:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderProfileStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Profile Setup</h3>
        <p className="text-gray-600">Let's start with your basic information</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={profile.full_name}
            onChange={(e) => handleProfileChange('full_name', e.target.value)}
            className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationErrors.profile_full_name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your full name"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => handleProfileChange('email', e.target.value)}
            className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationErrors.profile_email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Profile Picture (Optional)
          </label>
          <div className="flex items-center space-x-4">
            <Avatar 
              src={avatarPreview} 
              size="lg" 
              fallback={profile.full_name}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
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
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Bio (Optional)
          </label>
          <textarea
            value={profile.bio}
            onChange={(e) => handleProfileChange('bio', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Tell us a bit about yourself..."
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Your Role <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
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
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  profile.role === role.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{role.label}</div>
              </button>
            ))}
          </div>
          
          {/* Custom role input */}
          {profile.role === 'other' && (
            <div className="mt-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Please specify your role <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={profile.custom_role}
                onChange={(e) => handleProfileChange('custom_role', e.target.value)}
                className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Add Your Venue</h3>
        <p className="text-gray-600">Tell us about your venue</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Venue Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={venue.name}
            onChange={(e) => handleVenueChange('name', e.target.value)}
            className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationErrors.venue_name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter venue name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Location/City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={venue.location}
            onChange={(e) => handleVenueChange('location', e.target.value)}
            className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationErrors.venue_location ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter city or location"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={venue.address}
            onChange={(e) => handleVenueChange('address', e.target.value)}
            className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationErrors.venue_address ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter full address"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Capacity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={venue.capacity || ''}
            onChange={(e) => handleVenueChange('capacity', e.target.value ? parseInt(e.target.value) : undefined)}
            className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationErrors.venue_capacity ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter venue capacity"
            min="1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Contact Email (Optional)
          </label>
          <input
            type="email"
            value={venue.contact_email}
            onChange={(e) => handleVenueChange('contact_email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter contact email"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Contact Phone (Optional)
          </label>
          <input
            type="tel"
            value={venue.contact_phone}
            onChange={(e) => handleVenueChange('contact_phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter contact phone"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={venue.description}
            onChange={(e) => handleVenueChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Tell us about your venue..."
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Venue Image (Optional)
          </label>
          <div className="flex items-center space-x-4">
            <Avatar 
              src={venueImagePreview} 
              size="lg" 
              fallback={venue.name}
            />
            <button
              type="button"
              onClick={() => venueImageInputRef.current?.click()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
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
        setEarlyAccessError('');
        // Mark early access as validated
        localStorage.setItem('musicdb-early-access-validated', 'true');
        onClose();
      }}
      onError={(message) => {
        setEarlyAccessError(message);
      }}
    />
  );

  const renderEventStep = () => (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Add Event {eventNumber}
        </h2>
        <p className="text-gray-600">
          {eventNumber === 1
            ? 'Report your first event - this will be how you access the tool during future logins'
            : `Create your ${eventNumber === 2 ? 'second' : 'third'} event – if possible, report a show from this week or month so your dashboard is up to date.`}
        </p>
      </div>
      <form className="space-y-6" onSubmit={e => { e.preventDefault(); handleComplete(); }}>
        {/* Event Details */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={event.date}
                onChange={e => handleEventChange('date', e.target.value)}
                className="form-input w-full"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Tickets
              </label>
              <input
                type="number"
                min="1"
                value={event.total_tickets || ''}
                onChange={e => handleEventChange('total_tickets', parseInt(e.target.value) || 0)}
                className="form-input w-full"
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tickets Sold
              </label>
              <input
                type="number"
                min="0"
                max={event.total_tickets}
                value={event.tickets_sold || ''}
                onChange={e => handleEventChange('tickets_sold', parseInt(e.target.value) || undefined)}
                className="form-input w-full"
                placeholder="0"
              />
            </div>
          </div>
        </div>
        
        {/* Artists */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Artists</h3>
          {event.artists.map((artist, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">
                  Artist {index + 1} {artist.is_headliner && '(Headliner)'}
                </h4>
                {event.artists.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArtist(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Artist Name *
                  </label>
                  <input
                    type="text"
                    value={artist.name}
                    onChange={e => handleArtistChange(index, 'name', e.target.value)}
                    className="form-input w-full"
                    placeholder="e.g., The Rolling Stones"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Genre
                  </label>
                  <input
                    type="text"
                    value={artist.genre || ''}
                    onChange={e => handleArtistChange(index, 'genre', e.target.value)}
                    className="form-input w-full"
                    placeholder="e.g., Rock"
                  />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex gap-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={artist.is_headliner}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleArtistChange(index, 'is_headliner', true);
                        }
                      }}
                      className="mr-2"
                    />
                    Headliner
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
                      className="mr-2"
                    />
                    Supporting
                  </label>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addArtist}
            className="btn-secondary w-full py-3"
          >
            + Add Another Artist
          </button>
        </div>

        {/* Ticket Pricing */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Pricing</h3>
          <div className="mb-4">
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="priceType"
                  value="single"
                  checked={priceType === 'single'}
                  onChange={() => setPriceType('single')}
                  className="mr-2"
                />
                Single Price
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="priceType"
                  value="range"
                  checked={priceType === 'range'}
                  onChange={() => setPriceType('range')}
                  className="mr-2"
                />
                Price Range
              </label>
            </div>
          </div>
          {priceType === 'single' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ticket Price ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={event.ticket_price || ''}
                onChange={e => handleEventChange('ticket_price', parseFloat(e.target.value) || undefined)}
                className="form-input w-full"
                placeholder="25.00"
              />
            </div>
          )}
          {priceType === 'range' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={event.ticket_price_min || ''}
                  onChange={e => handleEventChange('ticket_price_min', parseFloat(e.target.value) || undefined)}
                  className="form-input w-full"
                  placeholder="20.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={event.ticket_price_max || ''}
                  onChange={e => handleEventChange('ticket_price_max', parseFloat(e.target.value) || undefined)}
                  className="form-input w-full"
                  placeholder="50.00"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Revenue Tracking */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Tracking (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Ticket Revenue
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={event.total_ticket_revenue || ''}
                onChange={e => handleEventChange('total_ticket_revenue', parseFloat(e.target.value) || undefined)}
                className="form-input w-full"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Total revenue from all ticket sales
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bar Sales ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={event.bar_sales || ''}
                onChange={e => handleEventChange('bar_sales', parseFloat(e.target.value) || undefined)}
                className="form-input w-full"
                placeholder="0.00"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Any additional details you report—like bar sales or show notes—are completely private. They're optional and only visible to you on your dashboard for your own reference.
          </p>
        </div>
        {/* Notes */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h3>
          <textarea
            value={event.notes}
            onChange={e => handleEventChange('notes', e.target.value)}
            className="form-textarea w-full"
            rows={3}
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

  const renderPreview = () => {
    switch (step) {
      case 'profile':
        return (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Preview</h3>
            
            <div className="space-y-4">
              {/* Centered Avatar above name/email */}
              <div className="flex flex-col items-center mb-2">
                <Avatar 
                  src={avatarPreview} 
                  size="md" 
                  fallback={profile.full_name || 'Your Name'}
                />
                <div className="mt-3 text-center">
                  <div className="font-medium text-gray-900">
                    {profile.full_name || 'Your Name'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {profile.email || 'your.email@example.com'}
                  </div>
                </div>
              </div>

              {profile.bio && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Bio</div>
                  <div className="text-sm text-gray-600">{profile.bio}</div>
                </div>
              )}

              {profile.role && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Role</div>
                  <div className="text-sm text-gray-600 capitalize">
                    {profile.role === 'other' 
                      ? profile.custom_role 
                      : profile.role.replace('_', ' ')
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'venue':
        return (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Venue Preview</h3>
            
            <div className="space-y-3">
              {venueImagePreview && (
                <div className="mb-4">
                  <img 
                    src={venueImagePreview} 
                    alt="Venue preview" 
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
              
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Name</div>
                <div className="text-sm text-gray-900">{venue.name || 'Venue Name'}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Location</div>
                <div className="text-sm text-gray-900">{venue.location || 'City, State'}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Address</div>
                <div className="text-sm text-gray-900">{venue.address || 'Full Address'}</div>
              </div>
              
              {venue.capacity && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Capacity</div>
                  <div className="text-sm text-gray-900">{venue.capacity.toLocaleString()}</div>
                </div>
              )}
              
              {venue.description && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Description</div>
                  <div className="text-sm text-gray-600">{venue.description}</div>
                </div>
              )}
            </div>
          </div>
        );

      case 'early-access':
        return (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Early Access</h3>
            
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="text-sm text-gray-600">
                  Enter your early access code to unlock the platform and continue setting up your events.
                </div>
              </div>
              
              {earlyAccessError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{earlyAccessError}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'events':
        return (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Preview</h3>
            
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Event Name</div>
                <div className="text-sm text-gray-900">{event.name}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Date</div>
                <div className="text-sm text-gray-900">
                  {event.date ? formatSimpleDate(event.date) : 'Select Date'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Total Tickets</div>
                  <div className="text-sm text-gray-900">{event.total_tickets ? event.total_tickets.toLocaleString() : 'Not specified'}</div>
                </div>
                
                {event.tickets_sold !== undefined && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Tickets Sold</div>
                    <div className="text-sm text-gray-900">{event.tickets_sold.toLocaleString()}</div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {priceType === 'single' && event.ticket_price && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Ticket Price</div>
                    <div className="text-sm text-gray-900">${event.ticket_price}</div>
                  </div>
                )}
                
                {priceType === 'range' && (event.ticket_price_min || event.ticket_price_max) && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Price Range</div>
                    <div className="text-sm text-gray-900">
                      ${event.ticket_price_min || 0} - ${event.ticket_price_max || 0}
                    </div>
                  </div>
                )}
                
                {event.bar_sales && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Bar Sales</div>
                    <div className="text-sm text-gray-900">${event.bar_sales}</div>
                  </div>
                )}
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Artists</div>
                <div className="space-y-1">
                  {event.artists.map((artist, index) => (
                    <div key={index} className="text-sm text-gray-900">
                      {artist.name || 'Artist Name'} {artist.is_headliner && '(Headliner)'}
                    </div>
                  ))}
                </div>
              </div>
              
              {event.notes && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Notes</div>
                  <div className="text-sm text-gray-600">{event.notes}</div>
                </div>
              )}
            </div>
          </div>
        );

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="MusicDB Logo" className="w-12 h-12" />
              <h2 className="text-3xl font-bold text-gray-900">MusicDB</h2>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{getStepLabel()}</span>
              <span className="text-sm text-gray-500">{getProgressPercentage()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-gray-400 to-black h-2 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Content */}
        {step === 'events' || step === 'early-access' ? (
          // Full-width form, no preview panel
          <div className="p-6 overflow-y-auto h-[calc(90vh-320px)]">
            {step === 'events' ? renderEventStep() : renderStepContent()}
          </div>
        ) : (
          // Default: split panel with preview
          <div className="flex h-[calc(90vh-320px)]">
            {/* Left Panel - Form */}
            <div className="flex-1 p-6 overflow-y-auto">
              {renderStepContent()}
            </div>
            {/* Right Panel - Preview */}
            <div className="w-96 border-l border-gray-200 p-6 overflow-y-auto">
              {renderPreview()}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {hasAttemptedValidation && Object.keys(validationErrors).length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 max-w-md overflow-y-auto max-h-24">
                  <p className="text-sm text-red-700 font-medium mb-1">Please complete the following required fields:</p>
                  <div className="flex flex-wrap gap-1">
                    {validationErrors.profile_full_name && <span className="text-sm text-red-600">• Full Name</span>}
                    {validationErrors.profile_email && <span className="text-sm text-red-600">• Email</span>}
                    {validationErrors.profile_role && <span className="text-sm text-red-600">• Your Role</span>}
                    {validationErrors.profile_custom_role && <span className="text-sm text-red-600">• Custom Role</span>}
                    {validationErrors.venue_name && <span className="text-sm text-red-600">• Venue Name</span>}
                    {validationErrors.venue_location && <span className="text-sm text-red-600">• Location/City</span>}
                    {validationErrors.venue_address && <span className="text-sm text-red-600">• Address</span>}
                    {validationErrors.venue_capacity && <span className="text-sm text-red-600">• Capacity</span>}
                    {validationErrors.event_date && <span className="text-sm text-red-600">• Date</span>}
                    {validationErrors.event_total_tickets && <span className="text-sm text-red-600">• Total Tickets</span>}
                    {validationErrors.event_artists && <span className="text-sm text-red-600">• At least one Artist Name</span>}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleComplete}
              disabled={isLoading}
              className={`px-6 py-2 rounded-lg font-medium transition-all flex-shrink-0 ${
                isLoading 
                  ? 'bg-gray-400 text-white opacity-50 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Completing...
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