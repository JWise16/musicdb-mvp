import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { EventService, type EventFormData } from '../../services/eventService';
import type { Tables } from '../../types/database.types';

interface ManualEventFormProps {
  onBack: () => void;
  onComplete: () => void;
}

type FormStep = 'details' | 'artists' | 'financial' | 'review';

const ManualEventForm = ({ onBack, onComplete }: ManualEventFormProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<FormStep>('details');
  const [venues, setVenues] = useState<Tables<'venues'>[]>([]);
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

  // Load venues on component mount
  useEffect(() => {
    const loadVenues = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const venuesData = await EventService.getUserVenues(user.id);
        setVenues(venuesData);
      } catch (error) {
        console.error('Error loading venues:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVenues();
  }, [user]);

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

  const updateArtist = (index: number, updates: Partial<EventFormData['artists'][0]>) => {
    const updatedArtists = [...formData.artists];
    updatedArtists[index] = { ...updatedArtists[index], ...updates };
    updateFormData({ artists: updatedArtists });
  };

  const removeArtist = (index: number) => {
    const updatedArtists = formData.artists.filter((_, i) => i !== index);
    // Reorder performance order
    updatedArtists.forEach((artist, i) => {
      artist.performance_order = i + 1;
    });
    updateFormData({ artists: updatedArtists });
  };

  const moveArtist = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === formData.artists.length - 1) return;

    const updatedArtists = [...formData.artists];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap artists
    [updatedArtists[index], updatedArtists[newIndex]] = [updatedArtists[newIndex], updatedArtists[index]];
    
    // Update performance order
    updatedArtists.forEach((artist, i) => {
      artist.performance_order = i + 1;
    });
    
    updateFormData({ artists: updatedArtists });
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 'details':
        return !!(formData.name && formData.date && formData.venue_id && formData.total_tickets > 0);
      case 'artists':
        return formData.artists.length > 0 && formData.artists.every(artist => artist.name.trim());
      case 'financial':
        // Require either single ticket price or price range
        if (priceType === 'single') {
          return formData.ticket_price !== undefined && formData.ticket_price !== null;
        } else if (priceType === 'range') {
          return formData.ticket_price_min !== undefined && 
                 formData.ticket_price_max !== undefined && 
                 formData.ticket_price_min !== null && 
                 formData.ticket_price_max !== null;
        }
        return false; // No price type selected
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;

    const steps: FormStep[] = ['details', 'artists', 'financial', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const steps: FormStep[] = ['details', 'artists', 'financial', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await EventService.createEvent(formData);
      if (result.success) {
        onComplete();
      } else {
        alert(`Error creating event: ${result.error}`);
      }
    } catch (error) {
      console.error('Error submitting event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'details', label: 'Event Details' },
      { key: 'artists', label: 'Artist Lineup' },
      { key: 'financial', label: 'Financial Data' },
      { key: 'review', label: 'Review & Submit' },
    ];

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep === step.key ? 'bg-black text-white' : 
                steps.indexOf({ key: currentStep, label: '' }) > index ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {steps.indexOf({ key: currentStep, label: '' }) > index ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep === step.key ? 'text-black' : 'text-gray-500'
              }`}>
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-4 ${
                  steps.indexOf({ key: currentStep, label: '' }) > index ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          className="form-input w-full"
          placeholder="Enter event name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Date *
        </label>
        <input
          type="date"
          value={formData.date || ''}
          onChange={(e) => updateFormData({ date: e.target.value })}
          className="form-input w-full"
          placeholder="Select event date"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Venue *
        </label>
        <select
          value={formData.venue_id}
          onChange={(e) => updateFormData({ venue_id: e.target.value })}
          className="form-select w-full"
          disabled={isLoading}
        >
          <option value="">Select a venue</option>
          {venues.map(venue => (
            <option key={venue.id} value={venue.id}>
              {venue.name} - {venue.location}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Total Tickets Available *
        </label>
        <input
          type="number"
          min="1"
          value={formData.total_tickets || ''}
          onChange={(e) => {
            const value = e.target.value;
            const numValue = value === '' ? 0 : parseInt(value) || 0;
            updateFormData({ total_tickets: numValue });
          }}
          className="form-input w-full"
          placeholder="0"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => updateFormData({ notes: e.target.value })}
          className="form-textarea w-full"
          rows={3}
          placeholder="Any additional notes about the event..."
        />
      </div>
    </div>
  );

  const renderArtistsStep = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Artist Lineup</h3>
        <button
          type="button"
          onClick={addArtist}
          className="btn-secondary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Artist
        </button>
      </div>

      {formData.artists.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p>No artists added yet. Click "Add Artist" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {formData.artists.map((artist, index) => (
            <div key={index} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">#{artist.performance_order}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveArtist(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveArtist(index, 'down')}
                      disabled={index === formData.artists.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeArtist(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Artist Name *
                  </label>
                  <input
                    type="text"
                    value={artist.name}
                    onChange={(e) => updateArtist(index, { name: e.target.value })}
                    className="form-input w-full"
                    placeholder="Enter artist name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Genre
                  </label>
                  <input
                    type="text"
                    value={artist.genre || ''}
                    onChange={(e) => updateArtist(index, { genre: e.target.value })}
                    className="form-input w-full"
                    placeholder="e.g., Rock, Jazz, Electronic"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={artist.is_headliner}
                    onChange={(e) => updateArtist(index, { is_headliner: e.target.checked })}
                    className="form-checkbox"
                  />
                  <span className="ml-2 text-sm text-gray-700">Headliner</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderFinancialStep = () => (
    <div className="space-y-8">
      {/* Ticket Price and Sales Section */}
      <div className="card p-6">
        <div className="space-y-6">
          {/* Ticket Price */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Price</h3>
            <div className="space-y-4">
              {/* Single Price Option */}
              <div className="flex items-center">
                <input
                  type="radio"
                  id="single-price"
                  name="price-type"
                  checked={priceType === 'single'}
                  onChange={() => {
                    setPriceType('single');
                    updateFormData({ 
                      ticket_price: undefined, 
                      ticket_price_min: undefined, 
                      ticket_price_max: undefined 
                    });
                  }}
                  className="form-radio"
                />
                <label htmlFor="single-price" className="ml-3 text-sm font-medium text-gray-700">
                  Single Price
                </label>
              </div>
              {priceType === 'single' && (
                <div className="ml-6">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.ticket_price || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value === '' ? undefined : parseFloat(value) || undefined;
                      updateFormData({ ticket_price: numValue });
                    }}
                    className="form-input w-full max-w-xs"
                    placeholder="0.00"
                    required
                  />
                </div>
              )}

              {/* Price Range Option */}
              <div className="flex items-center">
                <input
                  type="radio"
                  id="price-range"
                  name="price-type"
                  checked={priceType === 'range'}
                  onChange={() => {
                    setPriceType('range');
                    updateFormData({ 
                      ticket_price: undefined, 
                      ticket_price_min: undefined, 
                      ticket_price_max: undefined 
                    });
                  }}
                  className="form-radio"
                />
                <label htmlFor="price-range" className="ml-3 text-sm font-medium text-gray-700">
                  Price Range
                </label>
              </div>
              {priceType === 'range' && (
                <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Minimum Price *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.ticket_price_min || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === '' ? undefined : parseFloat(value) || undefined;
                        updateFormData({ ticket_price_min: numValue });
                      }}
                      className="form-input w-full"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Maximum Price *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.ticket_price_max || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === '' ? undefined : parseFloat(value) || undefined;
                        updateFormData({ ticket_price_max: numValue });
                      }}
                      className="form-input w-full"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tickets Sold (for past events) */}
          {isPastEvent() && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tickets Sold</h3>
              <input
                type="number"
                min="0"
                max={formData.total_tickets}
                value={formData.tickets_sold || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === '' ? undefined : parseInt(value) || undefined;
                  updateFormData({ tickets_sold: numValue });
                }}
                className="form-input w-full max-w-xs"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum: {formData.total_tickets} tickets
              </p>
            </div>
          )}

          {!isPastEvent() && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-600 text-sm">
                For future events, ticket sales data will be collected after the event takes place.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Revenue Tracking Section */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Tracking (Optional)</h3>
        
        <div className="space-y-4">
          {/* Total Ticket Revenue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Ticket Revenue
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.total_ticket_revenue || ''}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = value === '' ? undefined : parseFloat(value) || undefined;
                updateFormData({ total_ticket_revenue: numValue });
              }}
              className="form-input w-full max-w-xs"
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Total revenue from all ticket sales
            </p>
          </div>

          {/* Bar Sales */}
          {isPastEvent() && (
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
                className="form-input w-full max-w-xs"
                placeholder="0.00"
              />
            </div>
          )}
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-blue-800 font-medium mb-1">Privacy Notice</p>
            <p className="text-sm text-blue-700">
              Bar sales and total ticket revenue data will not be made public. This information is for your internal tracking only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => {
    const selectedVenue = venues.find(v => v.id === formData.venue_id);
    const isPast = isPastEvent();

    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2">Review Your Event</h4>
          <p className="text-sm text-green-800">
            Please review all the information below before submitting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h5 className="font-semibold text-gray-900 mb-4">Event Details</h5>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Event Name</dt>
                <dd className="text-sm text-gray-900">{formData.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(formData.date).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Venue</dt>
                <dd className="text-sm text-gray-900">{selectedVenue?.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Tickets</dt>
                <dd className="text-sm text-gray-900">{formData.total_tickets}</dd>
              </div>
              {/* Ticket Price Display */}
              {formData.ticket_price !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ticket Price</dt>
                  <dd className="text-sm text-gray-900">${formData.ticket_price}</dd>
                </div>
              )}
              {formData.ticket_price_min !== undefined && formData.ticket_price_max !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ticket Price Range</dt>
                  <dd className="text-sm text-gray-900">
                    ${formData.ticket_price_min} - ${formData.ticket_price_max}
                  </dd>
                </div>
              )}
              {formData.total_ticket_revenue !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Ticket Revenue</dt>
                  <dd className="text-sm text-gray-900">${formData.total_ticket_revenue}</dd>
                </div>
              )}
              {formData.notes && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="text-sm text-gray-900">{formData.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="card p-6">
            <h5 className="font-semibold text-gray-900 mb-4">Financial Data</h5>
            <dl className="space-y-2">
              {isPast ? (
                <>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Tickets Sold</dt>
                    <dd className="text-sm text-gray-900">
                      {formData.tickets_sold || 0} / {formData.total_tickets}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Bar Sales</dt>
                    <dd className="text-sm text-gray-900">
                      ${formData.bar_sales || 0}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Total Revenue</dt>
                    <dd className="text-sm text-gray-900">
                      ${(formData.bar_sales || 0).toFixed(2)}
                    </dd>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">Financial data will be collected after the event</p>
              )}
            </dl>
          </div>
        </div>

        <div className="card p-6">
          <h5 className="font-semibold text-gray-900 mb-4">Artist Lineup</h5>
          <div className="space-y-2">
            {formData.artists.map((artist, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500">#{artist.performance_order}</span>
                  <span className="text-sm text-gray-900">{artist.name}</span>
                  {artist.is_headliner && (
                    <span className="px-2 py-1 text-xs bg-accent-100 text-accent-800 rounded-full">
                      Headliner
                    </span>
                  )}
                </div>
                {artist.genre && (
                  <span className="text-sm text-gray-500">{artist.genre}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'details':
        return renderDetailsStep();
      case 'artists':
        return renderArtistsStep();
      case 'financial':
        return renderFinancialStep();
      case 'review':
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {renderStepIndicator()}
      
      {renderCurrentStep()}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="btn-secondary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="flex gap-3">
          {currentStep !== 'details' && (
            <button
              onClick={handlePrevious}
              className="btn-secondary"
            >
              Previous
            </button>
          )}

          {currentStep !== 'review' ? (
            <button
              onClick={handleNext}
              disabled={!validateCurrentStep()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Event...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Create Event
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManualEventForm; 