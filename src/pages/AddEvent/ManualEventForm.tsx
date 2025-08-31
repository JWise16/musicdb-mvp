import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useVenue } from '../../contexts/VenueContext';
import { type EventFormData } from '../../services/eventService';
import { useCreateEventMutation } from '../../store/api/eventsApi';

interface ManualEventFormProps {
  onEventCreated: (eventId: string) => void;
  onCancel: () => void;
}

// Helper functions for currency formatting
const formatCurrency = (value: number | undefined): string => {
  if (value === undefined || value === null || isNaN(value)) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const parseCurrency = (value: string): number | undefined => {
  if (!value) return undefined;
  // Remove all non-digit and non-decimal characters
  const cleanValue = value.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? undefined : parsed;
};

const ManualEventForm = ({ onEventCreated, onCancel }: ManualEventFormProps) => {
  const { user } = useAuth();
  const { currentVenue, userVenues } = useVenue();
  const [isLoading, setIsLoading] = useState(false);
  
  // RTK mutation hook
  const [createEvent] = useCreateEventMutation();
  const [priceType, setPriceType] = useState<'single' | 'range' | null>(null);
  
  // Display states for formatted currency inputs
  const [totalRevenueDisplay, setTotalRevenueDisplay] = useState('');
  const [barSalesDisplay, setBarSalesDisplay] = useState('');
  const [ticketPriceDisplay, setTicketPriceDisplay] = useState('');
  const [ticketPriceMinDisplay, setTicketPriceMinDisplay] = useState('');
  const [ticketPriceMaxDisplay, setTicketPriceMaxDisplay] = useState('');
  
  const [formData, setFormData] = useState<EventFormData>({
    name: 'Event',
    date: '',
    venue_id: currentVenue?.id || '',
    ticket_price: undefined,
    ticket_price_min: undefined,
    ticket_price_max: undefined,
    total_ticket_revenue: undefined,
    total_tickets: currentVenue?.capacity ?? 100,
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

  // Set venue_id and total_tickets when currentVenue changes
  useEffect(() => {
    if (currentVenue) {
      setFormData(prev => ({
        ...prev,
        venue_id: currentVenue.id,
        total_tickets: currentVenue.capacity ?? 100
      }));
    }
  }, [currentVenue]);

  // Update display values when formData changes
  useEffect(() => {
    setTotalRevenueDisplay(formatCurrency(formData.total_ticket_revenue));
    setBarSalesDisplay(formatCurrency(formData.bar_sales));
    setTicketPriceDisplay(formatCurrency(formData.ticket_price));
    setTicketPriceMinDisplay(formatCurrency(formData.ticket_price_min));
    setTicketPriceMaxDisplay(formatCurrency(formData.ticket_price_max));
  }, [formData.total_ticket_revenue, formData.bar_sales, formData.ticket_price, formData.ticket_price_min, formData.ticket_price_max]);

  const handleInputChange = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Prevent wheel events on number inputs to avoid accidental value changes when scrolling
  const handleNumberInputWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    // Blur the input to lose focus instead of trying to preventDefault on passive wheel events
    (e.target as HTMLInputElement).blur();
  };

  // Special handlers for currency fields
  const handleCurrencyInputChange = (field: 'total_ticket_revenue' | 'bar_sales' | 'ticket_price' | 'ticket_price_min' | 'ticket_price_max', displayValue: string) => {
    // Just update the display value while typing, don't format yet
    if (field === 'total_ticket_revenue') {
      setTotalRevenueDisplay(displayValue);
    } else if (field === 'bar_sales') {
      setBarSalesDisplay(displayValue);
    } else if (field === 'ticket_price') {
      setTicketPriceDisplay(displayValue);
    } else if (field === 'ticket_price_min') {
      setTicketPriceMinDisplay(displayValue);
    } else if (field === 'ticket_price_max') {
      setTicketPriceMaxDisplay(displayValue);
    }
  };

  const handleCurrencyBlur = (field: 'total_ticket_revenue' | 'bar_sales' | 'ticket_price' | 'ticket_price_min' | 'ticket_price_max') => {
    // Parse and update the form data, then format the display value on blur
    let currentDisplayValue = '';
    if (field === 'total_ticket_revenue') {
      currentDisplayValue = totalRevenueDisplay;
    } else if (field === 'bar_sales') {
      currentDisplayValue = barSalesDisplay;
    } else if (field === 'ticket_price') {
      currentDisplayValue = ticketPriceDisplay;
    } else if (field === 'ticket_price_min') {
      currentDisplayValue = ticketPriceMinDisplay;
    } else if (field === 'ticket_price_max') {
      currentDisplayValue = ticketPriceMaxDisplay;
    }
    
    const numericValue = parseCurrency(currentDisplayValue);
    
    if (field === 'total_ticket_revenue') {
      handleInputChange('total_ticket_revenue', numericValue);
      setTotalRevenueDisplay(formatCurrency(numericValue));
    } else if (field === 'bar_sales') {
      handleInputChange('bar_sales', numericValue);
      setBarSalesDisplay(formatCurrency(numericValue));
    } else if (field === 'ticket_price') {
      handleInputChange('ticket_price', numericValue);
      setTicketPriceDisplay(formatCurrency(numericValue));
    } else if (field === 'ticket_price_min') {
      handleInputChange('ticket_price_min', numericValue);
      setTicketPriceMinDisplay(formatCurrency(numericValue));
    } else if (field === 'ticket_price_max') {
      handleInputChange('ticket_price_max', numericValue);
      setTicketPriceMaxDisplay(formatCurrency(numericValue));
    }
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
      console.log('ManualEventForm: Creating event with RTK mutation');
      const result = await createEvent(formData).unwrap();
      
      if (result.success && result.eventId) {
        console.log('ManualEventForm: Event created successfully:', result.eventId);
        onEventCreated(result.eventId);
      } else {
        alert(`Error creating event: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Error creating event:', error);
      alert(error.message || 'Failed to create event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Add New Event
        </h2>
        <p className="text-gray-600">
          Enter the details for your new event
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Event Info */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue *
              </label>
              <select
                value={formData.venue_id}
                onChange={(e) => handleInputChange('venue_id', e.target.value)}
                className="form-select w-full"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="form-input w-full"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Tickets *
              </label>
              <input
                type="number"
                min="1"
                value={formData.total_tickets || ''}
                onChange={(e) => handleInputChange('total_tickets', parseInt(e.target.value) || 0)}
                onWheel={handleNumberInputWheel}
                className="form-input w-full"
                placeholder="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tickets Sold *
              </label>
              <input
                type="number"
                min="0"
                max={formData.total_tickets}
                value={formData.tickets_sold || ''}
                onChange={(e) => handleInputChange('tickets_sold', parseInt(e.target.value) || undefined)}
                onWheel={handleNumberInputWheel}
                className="form-input w-full"
                placeholder="0"
                required
              />
            </div>
          </div>
        </div>

        {/* Artists */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Artists</h3>
          
          {formData.artists.map((artist, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">
                  Artist {index + 1} {artist.is_headliner && '(Headliner)'}
                </h4>
                {formData.artists.length > 1 && (
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
                    onChange={(e) => handleArtistChange(index, 'name', e.target.value)}
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
                    value={artist.genre}
                    onChange={(e) => handleArtistChange(index, 'genre', e.target.value)}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Pricing *</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Type *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="priceType"
                  value="single"
                  checked={priceType === 'single'}
                  onChange={() => setPriceType('single')}
                  className="mr-2"
                  required
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
                  required
                />
                Price Range
              </label>
            </div>
          </div>

          {priceType === 'single' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ticket Price ($) *
              </label>
              <input
                type="text"
                value={ticketPriceDisplay}
                onChange={(e) => handleCurrencyInputChange('ticket_price', e.target.value)}
                onBlur={() => handleCurrencyBlur('ticket_price')}
                className="form-input w-full"
                placeholder="$25.00"
                required
              />
            </div>
          )}

          {priceType === 'range' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Price ($) *
                </label>
                <input
                  type="text"
                  value={ticketPriceMinDisplay}
                  onChange={(e) => handleCurrencyInputChange('ticket_price_min', e.target.value)}
                  onBlur={() => handleCurrencyBlur('ticket_price_min')}
                  className="form-input w-full"
                  placeholder="$20.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Price ($) *
                </label>
                <input
                  type="text"
                  value={ticketPriceMaxDisplay}
                  onChange={(e) => handleCurrencyInputChange('ticket_price_max', e.target.value)}
                  onBlur={() => handleCurrencyBlur('ticket_price_max')}
                  className="form-input w-full"
                  placeholder="$50.00"
                  required
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
                type="text"
                value={totalRevenueDisplay}
                onChange={(e) => handleCurrencyInputChange('total_ticket_revenue', e.target.value)}
                onBlur={() => handleCurrencyBlur('total_ticket_revenue')}
                className="form-input w-full"
                placeholder="$0.00"
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
                type="text"
                value={barSalesDisplay}
                onChange={(e) => handleCurrencyInputChange('bar_sales', e.target.value)}
                onBlur={() => handleCurrencyBlur('bar_sales')}
                className="form-input w-full"
                placeholder="$0.00"
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
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className="form-textarea w-full"
            rows={3}
            placeholder="Any additional notes about this event..."
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary px-6 py-3"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              isLoading || 
              !formData.date || 
              !formData.venue_id || 
              !formData.total_tickets ||
              formData.tickets_sold === undefined || 
              !priceType || 
              (priceType === 'single' && !formData.ticket_price) ||
              (priceType === 'range' && (!formData.ticket_price_min || !formData.ticket_price_max))
            }
            className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Event...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManualEventForm; 