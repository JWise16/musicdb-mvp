import { type EventWithDetails } from '../../../services/eventService';
import { EventService } from '../../../services/eventService';

interface EventCardProps {
  event: EventWithDetails;
  onClick: () => void;
}

const EventCard = ({ event, onClick }: EventCardProps) => {
  const isPastEvent = new Date(event.date) < new Date();
  const needsUpdate = EventService.needsUpdate(event);
  const headliners = event.event_artists?.filter(ea => ea.is_headliner).map(ea => ea.artists?.name).filter(Boolean) || [];
  const supportingActs = event.event_artists?.filter(ea => !ea.is_headliner).map(ea => ea.artists?.name).filter(Boolean) || [];
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTicketPrice = (event: EventWithDetails) => {
    // Check if it's a price range
    if (event.ticket_price_min && event.ticket_price_max) {
      return `$${event.ticket_price_min} - $${event.ticket_price_max}`;
    }
    // Check if it's a single price
    if (event.ticket_price) {
      return `$${event.ticket_price}`;
    }
    // No price set
    return 'TBA';
  };

  return (
    <div 
      className="card hover:shadow-medium transition-all duration-200 cursor-pointer group relative"
      onClick={onClick}
    >
      {/* Event Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-accent-600 transition-colors line-clamp-2">
            {event.name}
          </h3>
          <div className={`px-2 py-1 text-xs rounded-full ${
            isPastEvent ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
          }`}>
            {isPastEvent ? 'Past' : 'Upcoming'}
          </div>
        </div>
        
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(event.date)}
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {event.venues?.name} • {event.venues?.location}
        </div>
      </div>

      {/* Artists */}
      {headliners.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-medium text-gray-500 mb-1">Headliners</div>
          <div className="text-sm text-gray-900 font-medium">
            {headliners.join(', ')}
          </div>
        </div>
      )}

      {supportingActs.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-medium text-gray-500 mb-1">Supporting</div>
          <div className="text-sm text-gray-600">
            {supportingActs.join(', ')}
          </div>
        </div>
      )}

      {/* Venue Info */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-gray-600">Capacity</span>
          </div>
          {event.venues?.capacity && (
            <span className="text-gray-500">{event.venues.capacity.toLocaleString()}</span>
          )}
        </div>
      </div>

      {/* Financial Info */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center">
          <span className="text-gray-600">Ticket Price:</span>
          <span className="ml-1 font-medium">{formatTicketPrice(event)}</span>
        </div>
      </div>

      {/* Revenue (for past events) */}
      {isPastEvent && (
        <div className="space-y-1">
          {/* Tickets Sold */}
          {event.tickets_sold && (
            <div className="text-sm">
              <span className="text-gray-600">Tickets Sold: </span>
              <span className="font-medium text-gray-900">
                {event.tickets_sold.toLocaleString()} / {event.total_tickets.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Missing Financial Data Warning */}
      {needsUpdate && (
        <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>Financial data missing</span>
          </div>
        </div>
      )}

      {/* Genres */}
      {event.event_artists && event.event_artists.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {Array.from(new Set(
            event.event_artists
              .map(ea => ea.artists?.genre)
              .filter(Boolean)
          )).slice(0, 3).map((genre, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-accent-100 text-accent-700 rounded-full"
            >
              {genre}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventCard; 