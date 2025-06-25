import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useVenue } from '../../contexts/VenueContext';
import { EventService, type EventFormData } from '../../services/eventService';
import type { Tables } from '../../types/database.types';

type FormStep = 'details' | 'artists' | 'review';

interface ManualEventFormProps {
  onBack: () => void;
  onComplete: () => void;
}

const ManualEventForm = ({ onBack, onComplete }: ManualEventFormProps) => {
  const { user } = useAuth();
  const { currentVenue, userVenues } = useVenue();
  const [currentStep, setCurrentStep] = useState<FormStep>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    date: '',
    venue_id: '',
    ticket_price: undefined,
    ticket_price_min: undefined,
    ticket_price_max: undefined,
    total_ticket_revenue: undefined,
    total_tickets: 0,
    tickets_sold: undefined,
    bar_sales: undefined,
    notes: '',
    artists: [],
  });

  // Price type state for radio buttons
  const [priceType, setPriceType] = useState<'single' | 'range' | null>(null);

  // Set venue_id when currentVenue changes
  useEffect(() => {
    if (currentVenue) {
      setFormData(prev => ({ ...prev, venue_id: currentVenue.id }));
    }
  }, [currentVenue]);

  const isPastEvent = () => {
    if (!formData.date) return false;
    return new Date(formData.date) < new Date();
  };

  const updateFormData = (updates: Partial<EventFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const addArtist = () => {
    const newArtist = {
      name: '',
      genre: '',
      is_headliner: false,
      performance_order: formData.artists.length + 1,
      contact_info: '',
      social_media: null,
    };
    updateFormData({ artists: [...formData.artists, newArtist] });
  };

  const removeArtist = (index: number) => {
    if (formData.artists.length > 1) {
      updateFormData({
        artists: formData.artists.filter((_, i) => i !== index)
      });
    }
  };

  const updateArtist = (index: number, field: string, value: any) => {
    updateFormData({
      artists: formData.artists.map((artist, i) =>
        i === index ? { ...artist, [field]: value } : artist
      )
    });
  };

  const handleSubmit = async () => {
    if (!user || !formData.venue_id) return;

    setIsSubmitting(true);
    try {
      const result = await EventService.createEvent(formData);
      
      if (result.success) {
        onComplete();
      } else {
        alert(`Error creating event: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 'details') setCurrentStep('artists');
    else if (currentStep === 'artists') setCurrentStep('review');
  };

  const prevStep = () => {
    if (currentStep === 'artists') setCurrentStep('details');
    else if (currentStep === 'review') setCurrentStep('artists');
  };

  const canProceed = () => {
    if (currentStep === 'details') {
      return formData.name && formData.date && formData.venue_id && formData.total_tickets > 0;
    }
    if (currentStep === 'artists') {
      return formData.artists.length > 0 && formData.artists.every(artist => artist.name);
    }
    return true;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {['details', 'artists', 'review'].map((step, index) => (
          <div key={step} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
              currentStep === step
                ? 'bg-black text-white'
                : ['details', 'artists', 'review'].indexOf(currentStep) > index
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {['details', 'artists', 'review'].indexOf(currentStep) > index ? '✓' : index + 1}
            </div>
            {index < 2 && (
              <div className={`w-16 h-1 mx-2 ${
                ['details', 'artists', 'review'].indexOf(currentStep) > index ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {currentStep === 'details' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  className="form-input w-full"
                  placeholder="e.g., Summer Concert Series"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateFormData({ date: e.target.value })}
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
                  onChange={(e) => updateFormData({ venue_id: e.target.value })}
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
                  Total Tickets *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.total_tickets}
                  onChange={(e) => updateFormData({ total_tickets: parseInt(e.target.value) })}
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
                  onChange={(e) => updateFormData({ tickets_sold: parseInt(e.target.value) || undefined })}
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
                  onChange={(e) => updateFormData({ ticket_price: parseFloat(e.target.value) || undefined })}
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
                    onChange={(e) => updateFormData({ ticket_price_min: parseFloat(e.target.value) || undefined })}
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
                    onChange={(e) => updateFormData({ ticket_price_max: parseFloat(e.target.value) || undefined })}
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
                  onChange={(e) => updateFormData({ total_ticket_revenue: parseFloat(e.target.value) || undefined })}
                  className="form-input w-full"
                  placeholder="0.00"
                />
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
                  onChange={(e) => updateFormData({ bar_sales: parseFloat(e.target.value) || undefined })}
                  className="form-input w-full"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'artists' && (
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
                    onChange={(e) => updateArtist(index, 'name', e.target.value)}
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
                    onChange={(e) => updateArtist(index, 'genre', e.target.value)}
                    className="form-input w-full"
                    placeholder="e.g., Rock"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={artist.is_headliner}
                    onChange={(e) => updateArtist(index, 'is_headliner', e.target.checked)}
                    className="mr-2"
                  />
                  This is the headliner
                </label>
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
      )}

      {currentStep === 'review' && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Event</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Event Name</label>
              <p className="text-gray-900">{formData.name}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Date</label>
              <p className="text-gray-900">{formData.date}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Venue</label>
              <p className="text-gray-900">
                {userVenues.find(v => v.id === formData.venue_id)?.name}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Artists</label>
              <div className="space-y-2">
                {formData.artists.map((artist, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-gray-900">{artist.name}</span>
                    {artist.is_headliner && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Headliner</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary px-6 py-3"
        >
          Back
        </button>

        <div className="flex gap-4">
          {currentStep !== 'details' && (
            <button
              type="button"
              onClick={prevStep}
              className="btn-secondary px-6 py-3"
            >
              Previous
            </button>
          )}
          
          {currentStep !== 'review' ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
              className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Event...' : 'Create Event'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManualEventForm; 