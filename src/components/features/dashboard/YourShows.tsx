import { type VenueEvent } from '../../../services/venueService';
import { formatSimpleDate } from '../../../utils/dateUtils';
import { useArtistImage } from '../../../hooks/useArtistImage';

interface YourShowsProps {
  upcoming: VenueEvent[];
  past: VenueEvent[];
  onEventClick: (eventId: string) => void;
  onArtistClick?: (artistId: string) => void;
}

// Individual Event Card Component
const EventCard = ({ event, onEventClick, onArtistClick }: { 
  event: VenueEvent; 
  onEventClick: (eventId: string) => void;
  onArtistClick?: (artistId: string) => void;
}) => {
  // Use the first headliner name for the image
  const headlinerName = event.event_artists?.find(ea => ea.is_headliner)?.artists?.name || null;
  const { imageUrl, loading } = useArtistImage(headlinerName);

  const formatTicketPrice = (event: VenueEvent) => {
    if (event.ticket_price_min && event.ticket_price_max) {
      return `$${event.ticket_price_min} - $${event.ticket_price_max}`;
    }
    if (event.ticket_price) {
      return `$${event.ticket_price}`;
    }
    return 'TBA';
  };

  const headliners = event.event_artists
    ?.filter(ea => ea.is_headliner)
    .map(ea => ({ name: ea.artists?.name, id: ea.artists?.id }))
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

  const handleCardClick = () => {
    // If we have a headliner artist and artist click handler, navigate to artist page
    if (headliners.length > 0 && headliners[0].id && onArtistClick) {
      onArtistClick(headliners[0].id);
    } else {
      // Otherwise, navigate to event page
      onEventClick(event.id);
    }
  };

  return (
    <div 
      className="card p-3 sm:p-4 lg:p-5 hover:shadow-medium transition-all duration-200 cursor-pointer group flex flex-col h-full"
      onClick={handleCardClick}
    >
      {/* Artist Image or Placeholder */}
      <div className="w-full aspect-square bg-gray-200 rounded-lg mb-3 sm:mb-4 flex items-center justify-center overflow-hidden relative flex-shrink-0">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={headlinerName || 'Event'}
            className="w-full h-full object-cover"
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
      </div>

      {/* Content Container - Flex grow to fill remaining space */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Venue Name and Location */}
        <div className="mb-2 flex-shrink-0">
          <h4 className="font-semibold text-gray-900 break-words leading-tight text-sm sm:text-base">
            {event.venues?.name}
          </h4>
          <p className="text-sm text-gray-600 break-words leading-tight">
            {event.venues?.location}
          </p>
        </div>

        {/* Lineup + Date */}
        <p className="text-sm text-gray-600 mb-2 flex-shrink-0">
          Lineup {formatSimpleDate(event.date)}
        </p>

        {/* Artists Section - Allow to grow */}
        <div className="flex-1 min-h-0 mb-3">
          {/* Headliner */}
          {headliners.length > 0 && (
            <p className="text-sm font-medium text-gray-900 mb-1 break-words leading-tight">
              {headliners.map((headliner, index) => (
                <span key={headliner.id}>
                  {index > 0 && ', '}
                  {headliner.name}
                </span>
              ))}
            </p>
          )}

          {/* Supporting */}
          {supporting.length > 0 && (
            <p className="text-sm text-gray-600 break-words leading-tight">
              {supporting.join(', ')}
            </p>
          )}
        </div>

        {/* Sales and Pricing - Fixed at bottom */}
        <div className="space-y-1 text-sm flex-shrink-0 mt-auto">
          {/* Bar Sales */}
          <div className="flex justify-between items-center gap-2">
            <span className="text-gray-600">Bar Sales:</span>
            <span className="font-medium break-words">
              {event.bar_sales ? formatCurrency(event.bar_sales) : '$0'}
            </span>
          </div>

          {/* Ticket Sales */}
          <div className="flex justify-between items-center gap-2">
            <span className="text-gray-600">Ticket Sales:</span>
            <span className="font-medium break-words">
              {event.tickets_sold && event.total_tickets 
                ? `${event.tickets_sold}/${event.total_tickets}`
                : 'N/A'
              }
            </span>
          </div>

          {/* Ticket Price */}
          <div className="flex justify-between items-center gap-2">
            <span className="text-gray-600">Ticket Price:</span>
            <span className="font-medium break-words">{formatTicketPrice(event)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const YourShows = ({ upcoming, past, onEventClick, onArtistClick }: YourShowsProps) => {
  return (
    <div className="mb-6 lg:mb-8 overflow-hidden">
      <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6 break-words">Your Shows</h3>
      
      {/* Upcoming Shows */}
      {upcoming.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-800 mb-3">Upcoming</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-6 auto-rows-fr">
            {upcoming.slice(0, 3).map(event => (
              <EventCard key={event.id} event={event} onEventClick={onEventClick} onArtistClick={onArtistClick} />
            ))}
          </div>
        </div>
      )}
      
      {/* Past Shows */}
      <div>
        {past.length === 0 ? (
          <div className="text-center py-6 lg:py-8 bg-gray-50 rounded-lg">
            <svg className="w-8 h-8 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-3 lg:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm lg:text-base text-gray-600">No past shows found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-6 auto-rows-fr">
            {past.slice(0, 6).map(event => (
              <EventCard key={event.id} event={event} onEventClick={onEventClick} onArtistClick={onArtistClick} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default YourShows; 