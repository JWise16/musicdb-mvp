import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { UserProfileService } from '../../../services/userProfileService';
import { VenueService } from '../../../services/venueService';
import { EventService } from '../../../services/eventService';
import Avatar from '../../common/Avatar';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  prefillData?: {
    full_name?: string;
    email?: string;
  };
  step?: 'profile' | 'venue' | 'events';
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
  total_tickets: number;
  tickets_sold?: number;
  bar_sales?: number;
  notes?: string;
  artists: Array<{
    name: string;
    genre?: string;
    is_headliner: boolean;
    performance_order: number;
    contact_info?: string;
    social_media?: any;
  }>;
}

export default function OnboardingWizard({ isOpen, onClose, prefillData, step = 'profile', eventNumber = 1 }: OnboardingWizardProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  console.log('OnboardingWizard: isOpen =', isOpen, 'user =', user?.email, 'prefillData =', prefillData, 'step =', step, 'eventNumber =', eventNumber);
  
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
    name: '',
    date: '',
    ticket_price: undefined,
    ticket_price_min: undefined,
    ticket_price_max: undefined,
    total_ticket_revenue: undefined,
    total_tickets: 0,
    tickets_sold: undefined,
    bar_sales: undefined,
    notes: '',
    artists: [{ name: '', is_headliner: true, performance_order: 1 }]
  });

  const [priceType, setPriceType] = useState<'single' | 'range'>('single');

  // Update profile when prefillData changes or component mounts
  useEffect(() => {
    console.log('OnboardingWizard: useEffect triggered with prefillData =', prefillData);
    if (prefillData) {
      setProfile(prev => {
        const updated = {
          ...prev,
          full_name: prefillData.full_name || prev.full_name,
          email: prefillData.email || prev.email
        };
        console.log('OnboardingWizard: Updated profile =', updated);
        return updated;
      });
    }
  }, [prefillData]);

  // Reset event form when eventNumber changes
  useEffect(() => {
    if (step === 'events') {
      setEvent({
        name: '',
        date: '',
        ticket_price: undefined,
        ticket_price_min: undefined,
        ticket_price_max: undefined,
        total_ticket_revenue: undefined,
        total_tickets: 0,
        tickets_sold: undefined,
        bar_sales: undefined,
        notes: '',
        artists: [{ name: '', is_headliner: true, performance_order: 1 }]
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
  };

  const handleVenueChange = (field: keyof VenueData, value: any) => {
    setVenue(prev => ({ ...prev, [field]: value }));
  };

  const handleEventChange = (field: keyof EventData, value: any) => {
    setEvent(prev => ({ ...prev, [field]: value }));
  };

  const handleArtistChange = (index: number, field: string, value: any) => {
    setEvent(prev => ({
      ...prev,
      artists: prev.artists.map((artist, i) => 
        i === index ? { ...artist, [field]: value } : artist
      )
    }));
  };

  const addArtist = () => {
    setEvent(prev => ({
      ...prev,
      artists: [...prev.artists, { 
        name: '', 
        is_headliner: false, 
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

  const handleComplete = async () => {
    if (!user) {
      console.log('OnboardingWizard: User not authenticated');
      setError('Please wait while we complete your account setup...');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('OnboardingWizard: Starting step completion for step:', step);
      
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
              console.log('OnboardingWizard: Retrying without avatar upload');
              const retryResult = await UserProfileService.updateProfileWithAvatar(
                user.id,
                {
                  full_name: profile.full_name,
                  bio: profile.bio,
                  role: profile.role === 'other' ? profile.custom_role : profile.role
                }
              );
              
              if (retryResult.error) {
                setError(retryResult.error);
                return;
              }
            } else {
              setError(profileResult.error);
              return;
            }
          }
          break;

        case 'venue':
          // Create venue and associate with user
          const venueResult = await VenueService.createVenueWithImage(venue, venueImageFile || undefined);
          if (venueResult.error) {
            console.error('OnboardingWizard: Venue creation error:', venueResult.error);
            setError(venueResult.error);
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
              setError(associateResult.error);
              return;
            }
          }
          break;

        case 'events':
          // Get user's venue
          const userVenues = await VenueService.getUserVenues(user.id);
          console.log('OnboardingWizard: User venues found:', userVenues.length);
          
          if (userVenues.length === 0) {
            setError('No venue found. Please add a venue first.');
            return;
          }

          const venueId = userVenues[0].id;
          console.log(`OnboardingWizard: Creating event ${eventNumber} for venue:`, venueId);
          console.log('OnboardingWizard: Event data:', event);
          console.log('OnboardingWizard: Price type:', priceType);
          
          // Create single event
          const eventData = {
            ...event,
            venue_id: venueId,
            ticket_price: priceType === 'range' ? undefined : event.ticket_price,
            ticket_price_min: priceType === 'range' ? event.ticket_price_min : undefined,
            ticket_price_max: priceType === 'range' ? event.ticket_price_max : undefined,
          };

          console.log(`OnboardingWizard: Final event data for creation:`, eventData);
          
          const eventResult = await EventService.createEvent(eventData);

          console.log(`OnboardingWizard: Event creation result:`, eventResult);

          if (eventResult.error) {
            console.error(`OnboardingWizard: Event ${eventNumber} creation error:`, eventResult.error);
            setError(`Failed to create event ${eventNumber}: ${eventResult.error}`);
            return;
          }

          console.log(`OnboardingWizard: Event ${eventNumber} created successfully:`, eventResult.eventId);
          break;
      }

      console.log('OnboardingWizard: Step completed successfully');
      onClose();
    } catch (error) {
      console.error('Error completing onboarding step:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'profile':
        return 'Personal Information';
      case 'venue':
        return 'Add Your Venue';
      case 'events':
        return `Add Event ${eventNumber}`;
      default:
        return 'Onboarding';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'profile':
        return 'Let\'s start with your basic information';
      case 'venue':
        return 'Tell us about your venue';
      case 'events':
        return `Create your ${eventNumber === 1 ? 'first' : eventNumber === 2 ? 'second' : 'third'} event`;
      default:
        return '';
    }
  };

  const renderProfileStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Personal Information</h3>
        <p className="text-gray-600">Let's start with your basic information</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={profile.full_name}
            onChange={(e) => handleProfileChange('full_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your full name"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => handleProfileChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Role *
          </label>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: 'venue_owner', label: 'Venue Owner', icon: '🏢' },
              { value: 'promoter', label: 'Promoter', icon: '🎫' },
              { value: 'artist_manager', label: 'Artist Manager', icon: '🎤' },
              { value: 'event_coordinator', label: 'Event Coordinator', icon: '🎪' },
              { value: 'other', label: 'Other', icon: '✨' }
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
                <div className="text-2xl mb-2">{role.icon}</div>
                <div className="font-medium text-gray-900">{role.label}</div>
              </button>
            ))}
          </div>
          
          {/* Custom role input */}
          {profile.role === 'other' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please specify your role *
              </label>
              <input
                type="text"
                value={profile.custom_role}
                onChange={(e) => handleProfileChange('custom_role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Venue Name *
          </label>
          <input
            type="text"
            value={venue.name}
            onChange={(e) => handleVenueChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter venue name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location/City *
          </label>
          <input
            type="text"
            value={venue.location}
            onChange={(e) => handleVenueChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter city or location"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address *
          </label>
          <input
            type="text"
            value={venue.address}
            onChange={(e) => handleVenueChange('address', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter full address"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Capacity
          </label>
          <input
            type="number"
            value={venue.capacity || ''}
            onChange={(e) => handleVenueChange('capacity', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter venue capacity"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Email
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Phone
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
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

  const renderEventStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Add Event {eventNumber}</h3>
        <p className="text-gray-600">Create your {eventNumber === 1 ? 'first' : eventNumber === 2 ? 'second' : 'third'} event</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Name *
          </label>
          <input
            type="text"
            value={event.name}
            onChange={(e) => handleEventChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter event name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date *
          </label>
          <input
            type="date"
            value={event.date}
            onChange={(e) => handleEventChange('date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Tickets *
            </label>
            <input
              type="number"
              value={event.total_tickets}
              onChange={(e) => handleEventChange('total_tickets', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter total tickets available"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tickets Sold
            </label>
            <input
              type="number"
              value={event.tickets_sold || ''}
              onChange={(e) => handleEventChange('tickets_sold', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
              min="0"
              max={event.total_tickets}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ticket Price Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="priceType"
                  value="single"
                  checked={priceType === 'single'}
                  onChange={(e) => setPriceType(e.target.value as 'single' | 'range')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Single Price</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="priceType"
                  value="range"
                  checked={priceType === 'range'}
                  onChange={(e) => setPriceType(e.target.value as 'single' | 'range')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Price Range</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bar Sales ($)
            </label>
            <input
              type="number"
              value={event.bar_sales || ''}
              onChange={(e) => handleEventChange('bar_sales', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Conditional Price Fields */}
        {priceType === 'single' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ticket Price ($)
            </label>
            <input
              type="number"
              value={event.ticket_price || ''}
              onChange={(e) => handleEventChange('ticket_price', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="25.00"
              min="0"
              step="0.01"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Price ($)
              </label>
              <input
                type="number"
                value={event.ticket_price_min || ''}
                onChange={(e) => handleEventChange('ticket_price_min', e.target.value ? parseFloat(e.target.value) : undefined)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  priceType === 'range' && event.ticket_price_min && event.ticket_price_max && 
                  event.ticket_price_min > event.ticket_price_max 
                    ? 'border-red-300' 
                    : 'border-gray-300'
                }`}
                placeholder="15.00"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Price ($)
              </label>
              <input
                type="number"
                value={event.ticket_price_max || ''}
                onChange={(e) => handleEventChange('ticket_price_max', e.target.value ? parseFloat(e.target.value) : undefined)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  priceType === 'range' && event.ticket_price_min && event.ticket_price_max && 
                  event.ticket_price_min > event.ticket_price_max 
                    ? 'border-red-300' 
                    : 'border-gray-300'
                }`}
                placeholder="75.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        )}
        
        {priceType === 'range' && event.ticket_price_min && event.ticket_price_max && 
         event.ticket_price_min > event.ticket_price_max && (
          <div className="text-red-600 text-sm">
            Maximum price must be greater than minimum price
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={event.notes}
            onChange={(e) => handleEventChange('notes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Any additional notes about the event..."
            rows={3}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Artists/Performers *
            </label>
            <button
              type="button"
              onClick={addArtist}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Add Artist
            </button>
          </div>
          
          <div className="space-y-4">
            {event.artists.map((artist, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Artist {index + 1}</span>
                  {event.artists.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArtist(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Name *</label>
                    <input
                      type="text"
                      value={artist.name}
                      onChange={(e) => handleArtistChange(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Artist name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Genre</label>
                    <input
                      type="text"
                      value={artist.genre || ''}
                      onChange={(e) => handleArtistChange(index, 'genre', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Genre"
                    />
                  </div>
                </div>
                
                <div className="mt-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={artist.is_headliner}
                      onChange={(e) => handleArtistChange(index, 'is_headliner', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Headliner</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (step) {
      case 'profile':
        return renderProfileStep();
      case 'venue':
        return renderVenueStep();
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
              <div className="flex items-center space-x-3">
                <Avatar 
                  src={avatarPreview} 
                  size="md" 
                  fallback={profile.full_name || 'Your Name'}
                />
                <div>
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

      case 'events':
        return (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Preview</h3>
            
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Event Name</div>
                <div className="text-sm text-gray-900">{event.name || 'Event Name'}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Date</div>
                <div className="text-sm text-gray-900">
                  {event.date ? new Date(event.date).toLocaleDateString() : 'Select Date'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Total Tickets</div>
                  <div className="text-sm text-gray-900">{event.total_tickets.toLocaleString()}</div>
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

  const isStepValid = () => {
    switch (step) {
      case 'profile':
        return profile.full_name && profile.email && profile.role && 
               (profile.role !== 'other' || profile.custom_role);
      case 'venue':
        return venue.name && venue.location && venue.address;
      case 'events':
        const hasValidArtists = event.artists.some(artist => artist.name.trim()) &&
                               event.artists.every(artist => artist.name.trim());
        
        // Check price range validation
        const hasValidPriceRange = priceType === 'single' || 
          (priceType === 'range' && 
           (!event.ticket_price_min || !event.ticket_price_max || 
            event.ticket_price_min <= event.ticket_price_max));
        
        return event.name && event.date && event.total_tickets > 0 && 
               hasValidArtists && hasValidPriceRange;
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{getStepTitle()}</h2>
              <p className="text-gray-600">{getStepDescription()}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-200px)]">
          {/* Left Panel - Form */}
          <div className="flex-1 p-6 overflow-y-auto">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            {renderStepContent()}
          </div>

          {/* Right Panel - Preview */}
          <div className="w-96 border-l border-gray-200 p-6 overflow-y-auto">
            {renderPreview()}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            
            <button
              onClick={handleComplete}
              disabled={isLoading || !isStepValid()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Completing...
                </div>
              ) : (
                step === 'events' ? `Create Event ${eventNumber}` : 'Complete Step'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 