import { type EventWithDetails } from '../../../services/eventService';
import { formatEventDate, isEventPast } from '../../../utils/dateUtils';

interface EventTableProps {
  events: EventWithDetails[];
  onEventClick: (eventId: string) => void;
}

const EventTable = ({ events, onEventClick }: EventTableProps) => {
  // Debug: Log the first event to see the data structure
  if (events.length > 0) {
    console.log('Sample event data:', events[0]);
    console.log('Sample event_artists:', events[0].event_artists);
  }

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

  const getEventGenres = (event: EventWithDetails) => {
    const genres = Array.from(new Set(
      event.event_artists
        ?.map(ea => ea.artists?.genre)
        .filter(Boolean)
    ));
    return genres.slice(0, 2); // Show max 2 genres
  };

  const getHeadliners = (event: EventWithDetails) => {
    console.log('Getting headliners for event:', event.name);
    console.log('event_artists array:', event.event_artists);
    
    if (!event.event_artists) {
      console.log('No event_artists found');
      return [];
    }
    
    const headliners = event.event_artists
      ?.filter(ea => {
        console.log('Artist relationship:', ea, 'is_headliner:', ea.is_headliner);
        return ea.is_headliner;
      })
      .map(ea => {
        console.log('Artist object:', ea.artists, 'name:', ea.artists?.name);
        return ea.artists?.name;
      })
      .filter(Boolean) || [];
    
    console.log('Final headliners:', headliners);
    return headliners;
  };

  const getSupportingActs = (event: EventWithDetails) => {
    return event.event_artists
      ?.filter(ea => !ea.is_headliner)
      .map(ea => ea.artists?.name)
      .filter(Boolean) || [];
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
        <p className="text-gray-600">Try adjusting your filters or add some events to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Headliner
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Supporting
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Genre
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Venue Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Venue Location
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Capacity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tickets Sold
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              % Sold
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ticket Price
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {events.map((event) => {
            const isPastEvent = isEventPast(event.date);
            const headliners = getHeadliners(event);
            const supportingActs = getSupportingActs(event);
            const genres = getEventGenres(event);

            return (
              <tr
                key={event.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onEventClick(event.id)}
              >
                {/* Date */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatEventDate(event.date)}
                  </div>
                </td>

                {/* Headliners */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {headliners.length > 0 ? (
                      <div>
                        {headliners.slice(0, 2).map((name, index) => (
                          <div key={index} className="font-medium">
                            {name}
                          </div>
                        ))}
                        {headliners.length > 2 && (
                          <div className="text-gray-500 text-xs">
                            +{headliners.length - 2} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                </td>

                {/* Supporting Acts */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700">
                    {supportingActs.length > 0 ? (
                      <div>
                        {supportingActs.slice(0, 2).map((name, index) => (
                          <div key={index}>
                            {name}
                          </div>
                        ))}
                        {supportingActs.length > 2 && (
                          <div className="text-gray-500 text-xs">
                            +{supportingActs.length - 2} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                </td>

                {/* Genres */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {genres.length > 0 ? (
                      genres.map((genre, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-accent-100 text-accent-700 rounded-full"
                        >
                          {genre}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                </td>

                {/* Venue Name */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {event.venues?.name || '—'}
                  </div>
                </td>

                {/* Venue Location */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700">
                    {event.venues?.location || '—'}
                  </div>
                </td>

                {/* Venue Capacity */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {event.venues?.capacity ? event.venues.capacity.toLocaleString() : '—'}
                  </div>
                </td>

                {/* Tickets Sold */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {event.tickets_sold !== null ? (
                      event.tickets_sold.toLocaleString()
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                </td>

                {/* % Sold */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {event.tickets_sold !== null && event.venues?.capacity ? (
                      `${Math.round((event.tickets_sold / event.venues.capacity) * 100)}%`
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                </td>

                {/* Ticket Price */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatTicketPrice(event)}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default EventTable; 