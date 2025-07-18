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
    name: 'Event',
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
          name: 'Event',
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="flex gap-2">
            {Array.from({ length: totalEventsRequired }, (_, i) => (
              <div
                key={i}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${
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
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Add Event #{currentEventNumber}
        </h2>
        <p className="text-gray-600 mb-4">
          {currentEventNumber === 1 
            ? "Let's start with your first event!" 
            : `Great! Let's add event #${currentEventNumber}`
          }
        </p>
        
        <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-800">{getTips()}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Event Info */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
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
                Total Tickets
              </label>
              <input
                type="number"
                min="1"
                value={formData.total_tickets}
                onChange={(e) => handleInputChange('total_tickets', parseInt(e.target.value))}
                className="form-input w-full"
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
                max={formData.total_tickets}
                value={formData.tickets_sold || ''}
                onChange={(e) => handleInputChange('tickets_sold', parseInt(e.target.value) || undefined)}
                className="form-input w-full"
                placeholder="0"
              />
            </div>
          </div>
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
                value={formData.ticket_price || ''}
                onChange={(e) => handleInputChange('ticket_price', parseFloat(e.target.value) || undefined)}
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
                  value={formData.ticket_price_min || ''}
                  onChange={(e) => handleInputChange('ticket_price_min', parseFloat(e.target.value) || undefined)}
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
                  value={formData.ticket_price_max || ''}
                  onChange={(e) => handleInputChange('ticket_price_max', parseFloat(e.target.value) || undefined)}
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
                value={formData.total_ticket_revenue || ''}
                onChange={(e) => handleInputChange('total_ticket_revenue', parseFloat(e.target.value) || undefined)}
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
                value={formData.bar_sales || ''}
                onChange={(e) => handleInputChange('bar_sales', parseFloat(e.target.value) || undefined)}
                className="form-input w-full"
                placeholder="0.00"
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

        {/* Submit */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={onSkip}
            className="btn-secondary px-6 py-3"
          >
            Skip for Now
          </button>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading || !formData.date || !formData.venue_id}
              className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Adding Event...' : 'Add Event'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 