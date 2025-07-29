import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useVenue } from '../../../contexts/VenueContext';
import { EventService, type EventFormData } from '../../../services/eventService';

interface OnboardingEventFormProps {
  onEventAdded: () => void;
  onSkip: () => void;
  currentEventNumber: number;
  totalEventsRequired: number;
}

export default function OnboardingEventForm({ 
  onEventAdded, 
  onSkip, 
  currentEventNumber, 
  totalEventsRequired 
}: OnboardingEventFormProps) {
  const { user } = useAuth();
  const { currentVenue, userVenues } = useVenue();
  const [isLoading, setIsLoading] = useState(false);
  const [priceType, setPriceType] = useState<'single' | 'range' | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    name: `Event ${currentEventNumber}`,
    date: '',
    venue_id: '',
    ticket_price: undefined,
    ticket_price_min: undefined,
    ticket_price_max: undefined,
    total_ticket_revenue: undefined,
    total_tickets: 100,
    tickets_sold: undefined,
    bar_sales: undefined,
    notes: '',
    artists: [
      {
        name: '',
        genre: '',
        is_headliner: true,
        performance_order: 1
      }
    ]
  });

  // Set venue_id when currentVenue changes
  useEffect(() => {
    if (currentVenue) {
      setFormData(prev => ({ ...prev, venue_id: currentVenue.id }));
    }
  }, [currentVenue]);

  const handleInputChange = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArtistChange = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      artists: prev.artists.map((artist, i) => 
        i === index ? { ...artist, [field]: value } : artist
      )
    }));
  };

  const addArtist = () => {
    setFormData(prev => ({
      ...prev,
      artists: [
        ...prev.artists,
        {
          name: '',
          genre: '',
          is_headliner: false,
          performance_order: prev.artists.length + 1
        }
      ]
    }));
  };

  const removeArtist = (index: number) => {
    if (formData.artists.length > 1) {
      setFormData(prev => ({
        ...prev,
        artists: prev.artists.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.venue_id) return;

    setIsLoading(true);
    try {
      const result = await EventService.createEvent(formData);
      
      if (result.success) {
        onEventAdded();
        // Reset form for next event
        setFormData({
          name: `Event ${currentEventNumber}`,
          date: '',
          venue_id: formData.venue_id, // Keep same venue
          ticket_price: undefined,
          ticket_price_min: undefined,
          ticket_price_max: undefined,
          total_ticket_revenue: undefined,
          total_tickets: 100,
          tickets_sold: undefined,
          bar_sales: undefined,
          notes: '',
          artists: [
            {
              name: '',
              genre: '',
              is_headliner: true,
              performance_order: 1
            }
          ]
        });
        setPriceType(null);
      } else {
        alert(`Error creating event: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getTips = () => {
    const tips = [
      "💡 You can add past events or upcoming shows",
      "💡 Don't worry about perfect details - you can edit later",
      "💡 Include the main artist/band name",
      "💡 Estimate ticket prices if you're not sure"
    ];
    return tips[currentEventNumber - 1] || tips[0];
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
    setFormData(prev => ({
      ...prev,
      [`${field}_display`]: value, // Store display value
      [field]: cleanValue ? parseFloat(cleanValue) : undefined // Store numeric value
    }));
  };

  // Handle currency field blur (format when done typing)
  const handleCurrencyBlur = (field: string, value: string) => {
    const numValue = parseCurrency(value);
    setFormData(prev => ({
      ...prev,
      [`${field}_display`]: undefined, // Clear display value
      [field]: numValue
    }));
  };

  // Get display value for currency field
  const getCurrencyDisplayValue = (field: string) => {
    const displayValue = (formData as any)[`${field}_display`];
    if (displayValue !== undefined) return displayValue;
    const numValue = (formData as any)[field];
    return numValue ? formatCurrency(numValue) : '';
  };

  return (
    <div className="w-full max-w-3xl xl:max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-4 lg:mb-6">
        <div className="flex items-center justify-center gap-2 lg:gap-3 mb-3 lg:mb-4">
          <div className="flex gap-1">
            {Array.from({ length: totalEventsRequired }, (_, i) => (
              <div
                key={i}
                className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs lg:text-sm font-semibold ${
                  i < currentEventNumber - 1
                    ? 'bg-green-500 text-white'
                    : i === currentEventNumber - 1
                    ? 'bg-black text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {i < currentEventNumber - 1 ? '✓' : i + 1}
              </div>
            ))}
          </div>
        </div>
        
        <h2 className="text-base lg:text-lg xl:text-xl font-bold text-gray-900 mb-1">
          Add Event #{currentEventNumber}
        </h2>
        <p className="text-xs lg:text-sm text-gray-600 mb-3">
          {currentEventNumber === 1 
            ? "Let's start with your first event!" 
            : `Great! Let's add event #${currentEventNumber}`
          }
        </p>
        
        <div className="bg-blue-50 rounded-md lg:rounded-lg p-2 lg:p-3 max-w-xs sm:max-w-sm mx-auto">
          <p className="text-xs text-blue-800">{getTips()}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-4">
        {/* Basic Event Info */}
        <div className="card p-3 lg:p-4">
          <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 lg:mb-3">Event Details</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="form-input w-full text-xs lg:text-sm px-2 lg:px-3 py-1.5 lg:py-2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 mt-3 lg:mt-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Venue *
              </label>
              <select
                value={formData.venue_id}
                onChange={(e) => handleInputChange('venue_id', e.target.value)}
                className="form-select w-full text-xs lg:text-sm px-2 lg:px-3 py-1.5 lg:py-2"
                required
              >
                <option value="">Select a venue</option>
                {userVenues.map(venue => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Total Tickets <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.total_tickets || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                  handleInputChange('total_tickets', value ? parseInt(value) : 0);
                }}
                onWheel={e => e.currentTarget.blur()} // Prevent scroll wheel changes
                className="form-input w-full text-xs lg:text-sm px-2 lg:px-3 py-1.5 lg:py-2"
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
                value={formData.tickets_sold || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                  const numValue = value ? parseInt(value) : undefined;
                  // Ensure tickets sold doesn't exceed total tickets
                  const maxValue = formData.total_tickets || 0;
                  const finalValue = numValue && numValue > maxValue ? maxValue : numValue;
                  handleInputChange('tickets_sold', finalValue);
                }}
                onWheel={e => e.currentTarget.blur()} // Prevent scroll wheel changes
                className="form-input w-full text-xs lg:text-sm px-2 lg:px-3 py-1.5 lg:py-2"
                placeholder="0"
              />
            </div>
          </div>
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
                onChange={(e) => handleCurrencyChange('ticket_price', e.target.value)}
                onBlur={(e) => handleCurrencyBlur('ticket_price', e.target.value)}
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
                  onChange={(e) => handleCurrencyChange('ticket_price_min', e.target.value)}
                  onBlur={(e) => handleCurrencyBlur('ticket_price_min', e.target.value)}
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
                  onChange={(e) => handleCurrencyChange('ticket_price_max', e.target.value)}
                  onBlur={(e) => handleCurrencyBlur('ticket_price_max', e.target.value)}
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
                onChange={(e) => handleCurrencyChange('total_ticket_revenue', e.target.value)}
                onBlur={(e) => handleCurrencyBlur('total_ticket_revenue', e.target.value)}
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
                onChange={(e) => handleCurrencyChange('bar_sales', e.target.value)}
                onBlur={(e) => handleCurrencyBlur('bar_sales', e.target.value)}
                className="form-input w-full text-xs lg:text-sm px-2 lg:px-3 py-1.5 lg:py-2"
                placeholder="$0.00"
              />
            </div>
          </div>
        </div>

        {/* Artists */}
        <div className="card p-3 lg:p-4">
          <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 lg:mb-3">Artists</h3>
          
          {formData.artists.map((artist, index) => (
            <div key={index} className="border border-gray-200 rounded-md lg:rounded-lg p-2 lg:p-3 mb-2 lg:mb-3">
              <div className="flex items-center justify-between mb-2 lg:mb-3">
                <h4 className="font-medium text-gray-900 text-xs lg:text-sm">
                  Artist {index + 1} {artist.is_headliner && '(Headliner)'}
                </h4>
                {formData.artists.length > 1 && (
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
                    onChange={(e) => handleArtistChange(index, 'name', e.target.value)}
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
                    value={artist.genre}
                    onChange={(e) => handleArtistChange(index, 'genre', e.target.value)}
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

        {/* Notes */}
        <div className="card p-3 lg:p-4">
          <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 lg:mb-3">Additional Notes</h3>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className="form-textarea w-full text-xs lg:text-sm px-2 lg:px-3 py-1.5 lg:py-2"
            rows={2}
            placeholder="Any additional notes about this event..."
          />
        </div>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 lg:gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="btn-secondary px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm order-2 sm:order-1"
          >
            Skip for Now
          </button>

          <div className="flex gap-2 lg:gap-3 order-1 sm:order-2">
            <button
              type="submit"
              disabled={isLoading || !formData.date || !formData.venue_id}
              className="btn-primary px-4 lg:px-6 py-1.5 lg:py-2 text-xs lg:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Adding Event...' : 'Add Event'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 