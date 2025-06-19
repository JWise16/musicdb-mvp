import { type EventWithDetails } from '../../../services/eventService';

interface EventCardProps {
  event: EventWithDetails;
  onClick: () => void;
}

const EventCard = ({ event, onClick }: EventCardProps) => {
  const isPastEvent = new Date(event.date) < new Date();
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getPercentageSoldColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getVenueSizeLabel = (capacity: number | null) => {
    if (!capacity) return 'Unknown';
    if (capacity <= 200) return 'Small';
    if (capacity <= 1000) return 'Medium';
    return 'Large';
  };

  return (
    <div 
      className="card hover:shadow-medium transition-all duration-200 cursor-pointer group"
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
          {formatDate(event.date)} at {formatTime(event.date)}
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
            <span className="text-gray-600">{getVenueSizeLabel(event.venues?.capacity)} Venue</span>
          </div>
          {event.venues?.capacity && (
            <span className="text-gray-500">Capacity: {event.venues.capacity.toLocaleString()}</span>
          )}
        </div>
      </div>

      {/* Financial Info */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center">
          <span className="text-gray-600">Tickets:</span>
          <span className="ml-1 font-medium">${event.ticket_price}</span>
        </div>
        
        {isPastEvent && event.tickets_sold && event.total_tickets && (
          <div className="flex items-center">
            <span className="text-gray-600 mr-1">Sold:</span>
            <span className={`font-medium ${getPercentageSoldColor(event.percentage_sold)}`}>
              {event.percentage_sold.toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Revenue (for past events) */}
      {isPastEvent && event.total_revenue > 0 && (
        <div className="mt-2 text-sm">
          <span className="text-gray-600">Revenue: </span>
          <span className="font-medium text-green-600">
            ${event.total_revenue.toLocaleString()}
          </span>
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