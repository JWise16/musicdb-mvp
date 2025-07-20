import { type VenueEvent } from '../../../services/venueService';
import { formatSimpleDate } from '../../../utils/dateUtils';

interface YourShowsProps {
  upcoming: VenueEvent[];
  past: VenueEvent[];
  onEventClick: (eventId: string) => void;
}

const YourShows = ({ upcoming, past, onEventClick }: YourShowsProps) => {

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

  const renderEventCard = (event: VenueEvent) => {
    const headliners = event.event_artists
      ?.filter(ea => ea.is_headliner)
      .map(ea => ea.artists?.name)
      .filter(Boolean) || [];
    
    const supporting = event.event_artists
      ?.filter(ea => !ea.is_headliner)
      .map(ea => ea.artists?.name)
      .filter(Boolean) || [];

    const formatCurrency = (amount: number) => {
      if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(1)}K`;
      }
      return `$${amount.toLocaleString()}`;
    };

    return (
      <div 
        key={event.id}
        className="card p-4 hover:shadow-medium transition-all duration-200 cursor-pointer group"
        onClick={() => onEventClick(event.id)}
      >
        {/* Square Image Placeholder */}
        <div className="w-full aspect-square bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Venue Name and Location */}
        <h4 className="font-semibold text-gray-900 mb-1 truncate">
          {event.venues?.name} - {event.venues?.location}
        </h4>

        {/* Lineup + Date */}
        <p className="text-sm text-gray-600 mb-2">
          Lineup {formatSimpleDate(event.date)}
        </p>

        {/* Headliner */}
        {headliners.length > 0 && (
          <p className="text-sm font-medium text-gray-900 mb-1 truncate">
            {headliners.join(', ')}
          </p>
        )}

        {/* Supporting */}
        {supporting.length > 0 && (
          <p className="text-sm text-gray-600 mb-3 truncate">
            {supporting.join(', ')}
          </p>
        )}

        {/* Sales and Pricing */}
        <div className="space-y-1 text-sm">
          {/* Bar Sales */}
          <div className="flex justify-between">
            <span className="text-gray-600">Bar Sales:</span>
            <span className="font-medium">
              {event.bar_sales ? formatCurrency(event.bar_sales) : '$0'}
            </span>
          </div>

          {/* Ticket Sales */}
          <div className="flex justify-between">
            <span className="text-gray-600">Ticket Sales:</span>
            <span className="font-medium">
              {event.tickets_sold && event.total_tickets 
                ? `${event.tickets_sold}/${event.total_tickets}`
                : 'N/A'
              }
            </span>
          </div>

          {/* Ticket Price */}
          <div className="flex justify-between">
            <span className="text-gray-600">Ticket Price:</span>
            <span className="font-medium">{formatTicketPrice(event)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mb-6 lg:mb-8 overflow-hidden">
      <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6 truncate">Your Shows</h3>
      
      {/* Upcoming Shows */}
      {upcoming.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-800 mb-3">Upcoming</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 overflow-hidden">
            {upcoming.slice(0, 3).map(event => renderEventCard(event))}
          </div>
        </div>
      )}
      
      {/* Past Shows */}
      <div>
        <h4 className="text-md font-semibold text-gray-800 mb-3">Past Shows</h4>
        {past.length === 0 ? (
          <div className="text-center py-6 lg:py-8 bg-gray-50 rounded-lg">
            <svg className="w-8 h-8 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-3 lg:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm lg:text-base text-gray-600">No past shows found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 overflow-hidden">
            {past.slice(0, 6).map(event => renderEventCard(event))}
          </div>
        )}
      </div>
    </div>
  );
};

export default YourShows; 