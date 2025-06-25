import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useVenue } from '../../contexts/VenueContext';
import { EventService, type EventFormData } from '../../services/eventService';

interface ManualEventFormProps {
  onEventCreated: (eventId: string) => void;
  onCancel: () => void;
}

const ManualEventForm = ({ onEventCreated, onCancel }: ManualEventFormProps) => {
  const { user } = useAuth();
  const { currentVenue } = useVenue();
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    date: '',
    venue_id: currentVenue?.id || '',
    ticket_price: undefined,
    ticket_price_min: undefined,
    ticket_price_max: undefined,
    total_ticket_revenue: undefined,
    total_tickets: 0,
    tickets_sold: undefined,
    bar_sales: undefined,
    notes: '',
    artists: []
  });

  const handleInputChange = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentVenue) return;

    try {
      const result = await EventService.createEvent({
        ...formData,
        venue_id: currentVenue.id
      });

      if (result.success && result.eventId) {
        onEventCreated(result.eventId);
      } else {
        alert(`Error creating event: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    }
  };

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Event Entry</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
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
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="form-input w-full"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Tickets *
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className="form-textarea w-full"
            rows={3}
            placeholder="Additional notes about the event..."
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
            className="btn-primary px-6 py-3"
          >
            Create Event
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManualEventForm; 