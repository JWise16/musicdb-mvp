import { type VenueEvent } from '../../../services/venueService';

interface YourShowsProps {
  upcoming: VenueEvent[];
  past: VenueEvent[];
  onEventClick: (eventId: string) => void;
}

const YourShows = ({ upcoming, past, onEventClick }: YourShowsProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getHeadliners = (event: VenueEvent) => {
    return event.event_artists
      ?.filter(ea => ea.is_headliner)
      .map(ea => ea.artists?.name)
      .filter(Boolean)
      .join(', ') || 'TBA';
  };

  const formatTicketPrice = (event: VenueEvent) => {
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

  const renderEventCard = (event: VenueEvent, isUpcoming: boolean) => (
    <div 
      key={event.id}
      className="card p-4 lg:p-6 hover:shadow-medium transition-all duration-200 cursor-pointer group min-w-0"
      onClick={() => onEventClick(event.id)}
    >
      <div className="flex items-start justify-between mb-3 min-w-0">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm lg:text-lg font-semibold text-gray-900 group-hover:text-accent-600 transition-colors line-clamp-2 mb-1 truncate">
            {event.name}
          </h4>
          <p className="text-xs lg:text-sm text-gray-600 mb-2 truncate">
            {formatDate(event.date)}
          </p>
          <p className="text-xs lg:text-sm text-gray-600 mb-2 truncate">
            {event.venues?.name} • {event.venues?.location}
          </p>
          <p className="text-xs lg:text-sm font-medium text-gray-900 truncate">
            Artist: {getHeadliners(event)}
          </p>
        </div>
        <div className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
          isUpcoming ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {isUpcoming ? 'Upcoming' : 'Past'}
        </div>
      </div>

      {/* Ticket Price */}
      <div className="flex items-center justify-between text-xs lg:text-sm mb-2 min-w-0">
        <div className="flex items-center min-w-0">
          <span className="text-gray-600 flex-shrink-0">Ticket Price:</span>
          <span className="ml-1 font-medium truncate">{formatTicketPrice(event)}</span>
        </div>
      </div>

      {/* Revenue Information for Past Events */}
      {!isUpcoming && (
        <div className="space-y-1">
          {/* Tickets Sold */}
          {event.tickets_sold && (
            <div className="text-xs lg:text-sm min-w-0">
              <span className="text-gray-600 flex-shrink-0">Tickets Sold: </span>
              <span className="font-medium text-gray-900 truncate">
                {event.tickets_sold.toLocaleString()} / {event.total_tickets.toLocaleString()}
              </span>
            </div>
          )}

          {/* Total Ticket Revenue */}
          {event.total_ticket_revenue && event.total_ticket_revenue > 0 && (
            <div className="text-xs lg:text-sm min-w-0">
              <span className="text-gray-600 flex-shrink-0">Ticket Revenue: </span>
              <span className="font-medium text-blue-600 truncate">
                ${event.total_ticket_revenue.toLocaleString()}
              </span>
            </div>
          )}

          {/* Bar Sales */}
          {event.bar_sales && event.bar_sales > 0 && (
            <div className="text-xs lg:text-sm min-w-0">
              <span className="text-gray-600 flex-shrink-0">Bar Sales: </span>
              <span className="font-medium text-purple-600 truncate">
                ${event.bar_sales.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="mb-6 lg:mb-8 overflow-hidden">
      <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6 truncate">Your Shows</h3>
      
      {/* Upcoming Shows */}
      <div className="mb-6 lg:mb-8">
        <div className="flex items-center justify-between mb-3 lg:mb-4 min-w-0">
          <h4 className="text-base lg:text-lg font-semibold text-gray-900 truncate">Upcoming Shows</h4>
          <span className="text-xs lg:text-sm text-gray-500 flex-shrink-0">{upcoming.length} show{upcoming.length !== 1 ? 's' : ''}</span>
        </div>
        
        {upcoming.length === 0 ? (
          <div className="text-center py-6 lg:py-8 bg-gray-50 rounded-lg">
            <svg className="w-8 h-8 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-3 lg:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm lg:text-base text-gray-600">No upcoming shows scheduled</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 overflow-hidden">
            {upcoming.slice(0, 6).map(event => renderEventCard(event, true))}
          </div>
        )}
      </div>

      {/* Past Shows */}
      <div>
        <div className="flex items-center justify-between mb-3 lg:mb-4 min-w-0">
          <h4 className="text-base lg:text-lg font-semibold text-gray-900 truncate">Recent Shows</h4>
          <span className="text-xs lg:text-sm text-gray-500 flex-shrink-0">{past.length} show{past.length !== 1 ? 's' : ''}</span>
        </div>
        
        {past.length === 0 ? (
          <div className="text-center py-6 lg:py-8 bg-gray-50 rounded-lg">
            <svg className="w-8 h-8 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-3 lg:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm lg:text-base text-gray-600">No past shows found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 overflow-hidden">
            {past.slice(0, 6).map(event => renderEventCard(event, false))}
          </div>
        )}
      </div>
    </div>
  );
};

export default YourShows; 